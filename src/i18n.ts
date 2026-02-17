import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enServices from './locales/en/services.json';
import enForms from './locales/en/forms.json';
import enAccessibility from './locales/en/accessibility.json';
import enAbout from './locales/en/about.json';
import enContact from './locales/en/contact.json';

// Import Spanish translations
import esCommon from './locales/es/common.json';
import esHome from './locales/es/home.json';
import esServices from './locales/es/services.json';
import esForms from './locales/es/forms.json';
import esAccessibility from './locales/es/accessibility.json';

// Import Tagalog translations
import tlCommon from './locales/tl/common.json';
import tlHome from './locales/tl/home.json';
import tlServices from './locales/tl/services.json';
import tlForms from './locales/tl/forms.json';
import tlAccessibility from './locales/tl/accessibility.json';
import tlAbout from './locales/tl/about.json';
import tlContact from './locales/tl/contact.json';

// Import French translations
import frCommon from './locales/fr/common.json';
import frHome from './locales/fr/home.json';
import frServices from './locales/fr/services.json';
import frForms from './locales/fr/forms.json';
import frAccessibility from './locales/fr/accessibility.json';

//Import other languages here...
import bsCommon from './locales/bs/common.json';
import bsHome from './locales/bs/home.json';
import bsServices from './locales/bs/services.json';
import bsForms from './locales/bs/forms.json';
import bsAccessibility from './locales/bs/accessibility.json';
import bsAbout from './locales/bs/about.json';
import bsContact from './locales/bs/contact.json';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    services: enServices,
    forms: enForms,
    accessibility: enAccessibility,
    about: enAbout,
    contact: enContact,
  },
  // es: {
  //   common: esCommon,
  //   home: esHome,
  //   services: esServices,
  //   forms: esForms,
  //   accessibility: esAccessibility,
  // },
  tl: {
    common: tlCommon,
    home: tlHome,
    services: tlServices,
    forms: tlForms,
    accessibility: tlAccessibility,
    about: tlAbout,
    contact: tlContact,
  },
  // fr: {
  //   common: frCommon,
  //   home: frHome,
  //   services: frServices,
  //   forms: frForms,
  //   accessibility: frAccessibility,
  // },
  bs: {
    common: bsCommon,
    home: bsHome,
    services: bsServices,
    forms: bsForms,
    accessibility: bsAccessibility,
    about: bsAbout,
    contact: bsContact,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    ns: ['common', 'home', 'services', 'forms', 'accessibility', 'about', 'contact'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
