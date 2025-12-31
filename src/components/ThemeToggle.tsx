import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FaSun className="text-yellow-500" size={18} />
      ) : (
        <FaMoon className="text-gray-700 dark:text-gray-300" size={18} />
      )}
    </button>
  );
};

export default ThemeToggle;
