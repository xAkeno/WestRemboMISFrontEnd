import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


import translationEN from '../public/webviewer/ui/i18n/translation-en.json';
import translationES from '../public/webviewer/ui/i18n/translation-es.json';
import translationCS from '../public/webviewer/ui/i18n/translation-cs.json';
import translationDE from '../public/webviewer/ui/i18n/translation-de.json';
import translationFR from '../public/webviewer/ui/i18n/translation-fr.json';
import translationJA from '../public/webviewer/ui/i18n/translation-ja.json';
// import translationZH from '../public/webviewer/ui/i18n/translation-zh.json';
import translationRU from '../public/webviewer/ui/i18n/translation-ru.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  cs: { translation: translationCS },
  de: { translation: translationDE },
  fr: { translation: translationFR },
  ja: { translation: translationJA },
//   zh: { translation: translationZH },
  ru: { translation: translationRU },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;