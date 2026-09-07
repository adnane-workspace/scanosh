import { extractDraftMenuWithLlm, isMenuLlmConfigured } from '../src/services/menuDraft.llm.js';
import { env } from '../src/config/env.js';

const sample = `CAFE MENU
123 Southern Park
www.menu.com

SALADS
Caesar Salad - romaine, parmesan 8.50
Greek Salad - feta, olives 7.90

COFFEE DRINKS
Espresso 2.50
Cappuccino 3.50
Latte 4.00`;

console.log('configured', isMenuLlmConfigured());
console.log('model', env.MENU_LLM_MODEL);

const draft = await extractDraftMenuWithLlm({ text: sample });
console.log('parser', draft.meta.parser);
console.log(JSON.stringify(draft.categories, null, 2));
