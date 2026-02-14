import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    resources: {},
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/webviewer/ui/i18n/translation-{{lng}}.json',
      
      requestOptions: {
        cache: 'default',
        mode: 'cors',
        credentials: 'same-origin',
      },
    },
    
    react: {
      useSuspense: false,
    }
  });

export default i18n;