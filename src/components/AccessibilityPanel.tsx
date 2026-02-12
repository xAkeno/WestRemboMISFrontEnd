import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AccessibilitySettings {
  fontSize: number;
  zoom: number;
}

const AccessibilityPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 100,
    zoom: 100,
  });

  useEffect(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      applySettings(parsed);
    }
  }, []);

  const applySettings = (newSettings: AccessibilitySettings) => {
    document.documentElement.style.setProperty(
      '--base-font-size',
      `${newSettings.fontSize}%`
    );
    document.documentElement.style.setProperty(
      '--zoom-level',
      `${newSettings.zoom}%`
    );
  };

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
  };

  const adjustFontSize = (increment: number) => {
    const newSize = Math.max(50, Math.min(200, settings.fontSize + increment));
    updateSettings({ fontSize: newSize });
  };

  const adjustZoom = (increment: number) => {
    const newZoom = Math.max(50, Math.min(200, settings.zoom + increment));
    updateSettings({ zoom: newZoom });
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const resetSettings = () => {
    const defaults = { fontSize: 100, zoom: 100 };
    updateSettings(defaults);
    i18n.changeLanguage('en');
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 z-[9998] flex items-center justify-center"
        aria-label={isOpen ? 'Close accessibility panel' : 'Open accessibility panel'}
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" />
          <path d="M8 13h8M12 13v7M9 20l3-3 3 3" />
        </svg>
      </button>

      <div
        className={`fixed top-0 ${isOpen ? 'right-0' : '-right-[400px]'} w-[380px] h-screen bg-white shadow-2xl transition-all duration-400 ease-in-out z-[9999] flex flex-col`}
        role="dialog"
        aria-label="Accessibility Settings"
      >
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t('Accessibility Settings')}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-xl"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {t('Font Size')}
            </h3>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => adjustFontSize(-10)}
                disabled={settings.fontSize <= 50}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg px-5 py-3 text-lg font-semibold text-gray-700 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:translate-y-0 transition-all min-w-[60px]"
                aria-label="Decrease font size"
              >
                A−
              </button>
              <span className="text-lg font-semibold text-gray-700 min-w-[60px] text-center">
                {settings.fontSize}%
              </span>
              <button
                onClick={() => adjustFontSize(10)}
                disabled={settings.fontSize >= 200}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg px-5 py-3 text-lg font-semibold text-gray-700 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:translate-y-0 transition-all min-w-[60px]"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {t('Zoom')}
            </h3>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => adjustZoom(-10)}
                disabled={settings.zoom <= 50}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg px-5 py-3 text-lg font-semibold text-gray-700 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:translate-y-0 transition-all min-w-[60px]"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="text-lg font-semibold text-gray-700 min-w-[60px] text-center">
                {settings.zoom}%
              </span>
              <button
                onClick={() => adjustZoom(10)}
                disabled={settings.zoom >= 200}
                className="bg-gray-50 border-2 border-gray-200 rounded-lg px-5 py-3 text-lg font-semibold text-gray-700 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:translate-y-0 transition-all min-w-[60px]"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {t('Language Switcher')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`rounded-lg px-3 py-3 flex items-center gap-2 text-sm font-medium transition-all ${
                    i18n.language === lang.code
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-indigo-500 hover:bg-indigo-50'
                  }`}
                  aria-pressed={i18n.language === lang.code}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={resetSettings}
            className="w-full py-3.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all mt-2"
          >
            {t('Reset')}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9997] animate-fadeIn"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default AccessibilityPanel;