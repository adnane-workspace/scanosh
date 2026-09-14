function repairJsonText(text) {
  let value = String(text || '').trim();
  if (!value) return value;
  value = value.replace(/,\s*([}\]])/g, '$1');
  value = value.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  value = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return value;
}

function closeTruncatedJson(text) {
  const start = String(text || '').indexOf('{');
  if (start < 0) return String(text || '');

  let partial = String(text).slice(start);
  const stack = [];
  let inString = false;
  let escape = false;

  for (const ch of partial) {
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  if (inString) {
    partial += '"';
  }
  partial = partial.replace(/:\s*$/, ':null').replace(/,\s*$/, '');
  while (stack.length) {
    partial += stack.pop();
  }
  return repairJsonText(partial);
}

function lookLikeMenu(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  if (Array.isArray(parsed.categories)) return parsed;
  if (Array.isArray(parsed.menu?.categories)) return parsed.menu;
  if (Array.isArray(parsed.data?.categories)) return parsed.data;
  if (Array.isArray(parsed)) return { categories: parsed };
  return null;
}

export function extractJsonObject(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return lookLikeMenu(raw);
  }

  if (Array.isArray(raw)) {
    const textPart = raw
      .map((part) => (typeof part === 'string' ? part : part?.text || part?.content || ''))
      .join('\n');
    return extractJsonObject(textPart);
  }

  const text = String(raw || '').trim();
  if (!text) return null;

  const candidates = [];
  candidates.push(text);

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    candidates.push(text.slice(start, end + 1));
  }
  if (start >= 0) {
    candidates.push(closeTruncatedJson(text));
  }

  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    candidates.push(`{"categories":${text.slice(arrayStart, arrayEnd + 1)}}`);
  }

  for (const candidate of candidates) {
    const repaired = repairJsonText(candidate);
    try {
      const parsed = lookLikeMenu(JSON.parse(repaired));
      if (parsed) return parsed;
    } catch {
      try {
        const parsed = lookLikeMenu(JSON.parse(closeTruncatedJson(repaired)));
        if (parsed) return parsed;
      } catch {
        // next
      }
    }
  }

  return null;
}

export function readLlmMessageContent(payload) {
  const message = payload?.choices?.[0]?.message;
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('\n');
  }
  if (message.parsed && typeof message.parsed === 'object') {
    return JSON.stringify(message.parsed);
  }
  return String(message.reasoning || message.refusal || '');
}
