import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/common.json';
import ru from './locales/ru/common.json';
import uk from './locales/uk/common.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uk: { translation: uk }
};

const savedLanguage = localStorage.getItem('language') || 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.lang = lng;
});

document.documentElement.lang = savedLanguage;

export default i18n;
