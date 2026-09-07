import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeDraftMenu } from './menuDraft.extractor.js';

const SYSTEM_PROMPT = `Tu es un expert en menus de cafés et restaurants (France / Maroc, FR et AR).
On te donne le texte brut issu d'un OCR d'un menu papier.
Tu dois le transformer en menu digital structuré.

Règles:
- Regroupe les articles par catégories (ex: Entrées, Plats, Boissons, Desserts).
- Chaque catégorie contient ses produits.
- Pour chaque catégorie, choisis sectionKey:
  - "cafe" : cafés, thés, jus, boissons, petit-déjeuner, pâtisseries, viennoiseries
  - "restaurant" : entrées, plats, salades salées, sandwiches repas, pizzas, desserts de restaurant
- Pour chaque produit: name, description ("" si absente), price (nombre, 0 si inconnu), needsReview (true si doute sur le nom/prix).
- Ignore logos, adresses, téléphones, slogans, QR, horaires, URLs, noms de restaurant.
- Ne crée JAMAIS une catégorie pour une adresse, un site web, ou le mot "MENU" seul.
- Ne invente pas de plats absents du texte. Ne nomme pas un produit "Article 1".
- Conserve la langue d'origine des noms.
- Réponds UNIQUEMENT avec un JSON valide, sans markdown, de la forme:
{
  "categories": [
    {
      "name": "Boissons",
      "sectionKey": "cafe",
      "products": [
        { "name": "Café", "description": "", "price": 12, "needsReview": false }
      ]
    },
    {
      "name": "Plats",
      "sectionKey": "restaurant",
      "products": [
        { "name": "Tajine", "description": "", "price": 65, "needsReview": false }
      ]
    }
  ]
}`;

function resolveLlmConfig() {
  let apiKey = String(env.MENU_LLM_API_KEY || env.NVIDIA_API_KEY || '').trim();
  // Users sometimes paste "Bearer nvapi-..." from docs/curl examples.
  if (/^bearer\s+/i.test(apiKey)) {
    apiKey = apiKey.replace(/^bearer\s+/i, '').trim();
  }
  const baseUrl = String(env.MENU_LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1')
    .trim()
    .replace(/\/+$/, '');
  const model = String(env.MENU_LLM_MODEL || 'meta/llama-3.2-11b-vision-instruct').trim();
  const timeoutMs = env.MENU_LLM_TIMEOUT_MS || 90000;

  return { apiKey, baseUrl, model, timeoutMs };
}

export function isMenuLlmConfigured() {
  return Boolean(resolveLlmConfig().apiKey);
}

function extractJsonObject(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // ignore
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // ignore
    }
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function ocrInputToPrompt({ text, blocks }) {
  const lines = [];
  if (Array.isArray(blocks) && blocks.length) {
    for (const block of blocks) {
      const value = String(block?.text || '').trim();
      if (!value) continue;
      const conf =
        typeof block?.confidence === 'number' ? ` [conf=${block.confidence.toFixed(2)}]` : '';
      lines.push(`${value}${conf}`);
    }
  }

  const body = lines.length ? lines.join('\n') : String(text || '').trim();
  return body.slice(0, 14000);
}

/**
 * Structure OCR text into categories → products via LLM (OpenAI-compatible API).
 */
export async function extractDraftMenuWithLlm({ text, blocks } = {}) {
  const { apiKey, baseUrl, model, timeoutMs } = resolveLlmConfig();

  if (!apiKey) {
    throw new ApiError(503, 'Menu LLM is not configured', null, 'MENU_LLM_NOT_CONFIGURED');
  }

  const ocrText = ocrInputToPrompt({ text, blocks });
  if (!ocrText) {
    return normalizeDraftMenu({
      categories: [],
      meta: { parser: 'llm-v1', model, productCount: 0, categoryCount: 0 },
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Texte OCR du menu:\n\n${ocrText}\n\nRetourne le JSON du menu structuré.`,
          },
        ],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError(504, 'Menu LLM timed out', null, 'MENU_LLM_TIMEOUT');
    }
    throw new ApiError(502, 'Menu LLM unreachable', null, 'MENU_LLM_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || `Menu LLM error (${response.status})`;
    throw new ApiError(502, message, null, 'MENU_LLM_PROVIDER_ERROR');
  }

  const content = payload?.choices?.[0]?.message?.content;
  const parsed = extractJsonObject(content);

  if (!parsed || !Array.isArray(parsed.categories)) {
    throw new ApiError(502, 'Menu LLM returned invalid JSON', null, 'MENU_LLM_INVALID_JSON');
  }

  const draft = normalizeDraftMenu({
    categories: parsed.categories.map((cat) => ({
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

  if (!draft.categories.length || draft.meta.productCount === 0) {
    draft.meta.empty = true;
  }

  return draft;
}
