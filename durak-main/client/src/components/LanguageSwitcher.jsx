import React from 'react';
import i18n from '../i18n';

const languages = [
  { code: 'en', label: '🇬🇧' },
  { code: 'ru', label: '🇷🇺' },
  { code: 'uk', label: '🇺🇦' }
];

const LanguageSwitcher = () => {
  const current = i18n.language;
  const changeLanguage = (lng) => {
    if (lng === current) return;
    i18n.changeLanguage(lng);
  };
  return (
    <div className="flex gap-2">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={current === code ? 'opacity-100' : 'opacity-50 hover:opacity-100'}
        >
          <span role="img" aria-label={code} style={{ fontSize: '20px' }}>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
