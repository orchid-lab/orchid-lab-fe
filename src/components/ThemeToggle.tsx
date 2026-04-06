/* eslint-disable react-dom/no-missing-button-type */
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeToggleProps {
  accentClass?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  accentClass = 'text-blue-500',
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-gray-100"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className={`${accentClass} text-lg`} size={18} />
      ) : (
        <FaMoon className={`${accentClass} text-lg`} size={18} />
      )}
    </button>
  );
};

export default ThemeToggle;