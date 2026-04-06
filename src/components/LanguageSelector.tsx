import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { FaGlobe } from 'react-icons/fa';

interface LanguageSelectorProps {
  accentClass?: string;
  hoverBgClass?: string;
  activeBgClass?: string;
  activeTextClass?: string;
}

export default function LanguageSelector({
  accentClass = 'text-blue-500',
  hoverBgClass = 'hover:bg-blue-50/40 dark:hover:bg-gray-700',
  activeBgClass = 'bg-blue-900 dark:bg-blue-700',
  activeTextClass = 'text-white dark:text-green-100',
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'vi', name: t('common.vietnamese'), flag: '🇻🇳' },
    { code: 'en', name: t('common.english'), flag: '🇺🇸' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 group ${hoverBgClass}`}
        title={t('common.language')}
      >
        <FaGlobe className={`${accentClass} text-lg transition-colors duration-300`} />
        <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
          {currentLanguage.flag}
        </span>
      </button>

      {/* Dropdown menu */}
      <div
        className={`absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-300 origin-top-right ${
          open 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="p-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                i18n.language === lang.code
                  ? `${activeBgClass} ${activeTextClass}`
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}