import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeDraftMenu } from './menuDraft.extractor.js';
import { extractJsonObject, readLlmMessageContent } from './menuDraft.json.js';

const SYSTEM_PROMPT = `Tu es un expert en menus de cafés et restaurants (France / Maroc, FR et AR).
On te donne le texte brut issu d'un OCR d'un menu papier.
Tu dois le transformer en menu digital structuré.

Règles:
- Regroupe les articles par catégories (ex: Entrées, Plats, Boissons, Desserts).
- Chaque catégorie contient ses produits.
- Pour chaque catégorie, choisis sectionKey:
  - "cafe" : cafés, thés, jus, boissons, petit-déjeuner, pâtisseries, viennoiseries
  - "restaurant" : entrées, plats, salades salées, sandwiches repas, pizzas, desserts de restaurant
- Pour chaque produit: name, description, price (nombre, 0 si inconnu), needsReview (true si doute sur le nom/prix).
- NAME : court, SANS prix et SANS symbole ($ € DH MAD). Exemple: "Expresso" pas "Expresso $".
- Ne crée JAMAIS une catégorie avec le nom du restaurant / café (ex: "The Roasted Bean"). Utilise Cafés, Boissons, Desserts, etc.
- DESCRIPTION (important) :
  - Section "cafe" : description TOUJOURS "" (jamais d'ingrédients / sous-texte).
  - Section "restaurant" : si le menu donne ingrédients, composition, accompagnement, taille, ou une ligne sous le nom → mets-les dans "description".
  - Ne mets PAS ces infos dans "name" (le name reste court : nom du plat/boisson).
  - Hors café, laisse description "" SEULEMENT si aucune info secondaire n'apparaît dans le texte OCR.
  - Max 500 caractères, conserve la langue d'origine.
- Ignore logos, adresses, téléphones, slogans, QR, horaires, URLs, noms de restaurant.
- Chaque catégorie DOIT contenir au moins un produit. Interdit: catégorie vide.
- Les jus, sodas, cafés, thés sont des PRODUITS dans une catégorie « Boissons » (ou « Jus »), jamais une catégorie par saveur (pas de « Jus d'Orange » vide).
- Ne crée JAMAIS une catégorie nommée "/", "-", "MENU", ou un nom de plat/boisson isolé.
- Ne invente pas de plats absents du texte. Ne nomme pas un produit "Article 1".
- Conserve la langue d'origine des noms.
- Réponds UNIQUEMENT avec un JSON valide, sans markdown, de la forme:
{
  "categories": [
    {
      "name": "Boissons",
      "sectionKey": "cafe",
      "products": [
        { "name": "Café latte", "description": "", "price": 18, "needsReview": false }
      ]
    }
  ]
}`;

function stripBearer(value) {
  let apiKey = String(value || '').trim();
  if (/^bearer\s+/i.test(apiKey)) {
    apiKey = apiKey.replace(/^bearer\s+/i, '').trim();
  }
  return apiKey;
}

const DEFAULT_FALLBACK_MODELS = ['openai/gpt-oss-20b', 'google/gemma-4-31b-it'];

function uniqueModels(values) {
  const seen = new Set();
  const models = [];
  for (const raw of values) {
    const model = String(raw || '').trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);
    models.push(model);
  }
  return models;
}

function resolveLlmConfig() {
  const apiKey = stripBearer(env.MENU_LLM_API_KEY || env.NVIDIA_API_KEY || '');
  const baseUrl = String(env.MENU_LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1')
    .trim()
    .replace(/\/+$/, '');
  const primary = String(env.MENU_LLM_MODEL || DEFAULT_FALLBACK_MODELS[0]).trim();
  const extra = String(env.MENU_LLM_FALLBACK_MODELS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const models = uniqueModels([primary, ...extra, ...DEFAULT_FALLBACK_MODELS]);
  const timeoutMs = env.MENU_LLM_TIMEOUT_MS || 90000;

  return { apiKey, baseUrl, model: models[0], models, timeoutMs };
}

export function isMenuLlmConfigured() {
  return Boolean(resolveLlmConfig().apiKey);
}

export function getMenuLlmInfo() {
  const { apiKey, model, models } = resolveLlmConfig();
  return {
    configured: Boolean(apiKey),
    model,
    models,
    role: 'text',
  };
}

function ocrInputToPrompt({ text, blocks }) {
  const lines = [];
  if (Array.isArray(blocks) && blocks.length) {
    for (const block of blocks) {
      const value = String(block?.text || '').trim();
      if (!value) continue;
      lines.push(value);
    }
  }

  const body = lines.length ? lines.join('\n') : String(text || '').trim();
  return body.slice(0, 12000);
}

function toDraft(parsed, model) {
  return normalizeDraftMenu({
    categories: (Array.isArray(parsed.categories) ? parsed.categories : []).map((cat) => ({
      name: cat?.name,
      sectionKey: cat?.sectionKey,
      selected: true,
      products: (Array.isArray(cat?.products) ? cat.products : []).map((prod) => ({
        name: prod?.name,
        description: prod?.description || '',
        price: prod?.price,
        selected: true,
        needsReview: Boolean(prod?.needsReview) || !(Number(prod?.price) > 0),
      })),
    })),
    meta: {
      parser: 'llm-v1',
      model,
    },
  });
}

/**
 * Structure OCR text into categories → products via LLM (OpenAI-compatible API).
 */
export async function extractDraftMenuWithLlm({ text, blocks } = {}) {
  const { apiKey, baseUrl, models, timeoutMs } = resolveLlmConfig();

  if (!apiKey) {
    throw new ApiError(503, 'Menu LLM is not configured', null, 'MENU_LLM_NOT_CONFIGURED');
  }

  const ocrText = ocrInputToPrompt({ text, blocks });
  if (!ocrText) {
    return normalizeDraftMenu({
      categories: [],
      meta: { parser: 'llm-v1', model: models[0], productCount: 0, categoryCount: 0 },
    });
  }

  const perModelTimeout = Math.max(20000, Math.floor(timeoutMs / Math.min(models.length, 3)));

  const baseMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Texte OCR du menu:\n\n${ocrText}\n\nRetourne UNIQUEMENT le JSON du menu structuré (pas de markdown).`,
    },
  ];

  async function callLlm({ model, useJsonFormat, messages, maxTokens = 4096 }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), perModelTimeout);
    try {
      return await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: maxTokens,
          ...(useJsonFormat ? { response_format: { type: 'json_object' } } : {}),
          messages,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function parseResponse(response) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.detail ||
        payload?.message ||
        `Menu LLM error (${response.status})`;
      const error = new ApiError(502, message, null, 'MENU_LLM_PROVIDER_ERROR');
      error.status = response.status;
      throw error;
    }

    const content = readLlmMessageContent(payload);
    const parsed = extractJsonObject(content);
    return { content, parsed, finishReason: payload?.choices?.[0]?.finish_reason };
  }

  const retryNextModel = new Set([404, 410, 422, 429, 503]);
  let lastError = null;
  let lastContent = '';

  for (const model of models) {
    const attempts = [
      { useJsonFormat: true, messages: baseMessages, maxTokens: 4096 },
      { useJsonFormat: false, messages: baseMessages, maxTokens: 4096 },
    ];

    let skipModel = false;
    for (const attempt of attempts) {
      let response;
      try {
        response = await callLlm({ ...attempt, model });
      } catch (error) {
        if (error?.name === 'AbortError') {
          lastError = new ApiError(504, 'Menu LLM timed out', null, 'MENU_LLM_TIMEOUT');
          skipModel = true;
          break;
        }
        lastError = new ApiError(502, 'Menu LLM unreachable', null, 'MENU_LLM_UNAVAILABLE');
        skipModel = true;
        break;
      }

      try {
        const { content, parsed, finishReason } = await parseResponse(response);
        lastContent = content;
        if (parsed?.categories) {
          const source = finishReason === 'length' ? extractJsonObject(content) : parsed;
          if (source?.categories) {
            const draft = toDraft(source, model);
            if (finishReason === 'length') draft.meta.truncated = true;
            if (!draft.categories.length || draft.meta.productCount === 0) {
              draft.meta.empty = true;
            }
            if (model !== models[0]) {
              console.warn(`[menu-llm] using fallback model ${model}`);
            }
            return draft;
          }
        }
      } catch (error) {
        lastError = error;
        if (error?.status === 400 && attempt.useJsonFormat) continue;
        if (
          error instanceof ApiError &&
          error.code === 'MENU_LLM_PROVIDER_ERROR' &&
          attempt.useJsonFormat &&
          !retryNextModel.has(error.status)
        ) {
          continue;
        }
        if (retryNextModel.has(error?.status)) {
          console.warn(`[menu-llm] ${model} HTTP ${error.status}, trying next model`);
          skipModel = true;
          break;
        }
        throw error;
      }
    }
    if (skipModel) continue;
  }

  if (lastError) throw lastError;
  const snippet = String(lastContent || '').replace(/\s+/g, ' ').slice(0, 240);
  console.error('[menu-llm] invalid JSON', snippet);
  throw new ApiError(502, 'Menu LLM returned invalid JSON', null, 'MENU_LLM_INVALID_JSON');
}
