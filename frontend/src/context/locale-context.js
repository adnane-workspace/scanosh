import { createContext } from 'react';
import { publicMessages } from '../i18n/publicMessages.js';

export const LocaleContext = createContext(null);

let activeMessages = publicMessages;
const listeners = new Set();

export function getActiveMessages() {
  return activeMessages;
}

export function registerMessages(catalog) {
  if (catalog && catalog !== activeMessages) {
    activeMessages = catalog;
    for (const listener of listeners) {
      listener();
    }
  }
}

export function subscribeMessages(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
