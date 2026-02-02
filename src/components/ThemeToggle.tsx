/* eslint-disable react-dom/no-missing-button-type */
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn flex items-center justify-center rounded-full transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className="text-yellow-500" size={18} />
      ) : (
        <FaMoon className="text-gray-700" size={18} />
      )}
    </button>
  );
};

export default ThemeToggle;