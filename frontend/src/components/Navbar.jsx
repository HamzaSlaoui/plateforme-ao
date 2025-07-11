import React, { useState } from "react";
import { Menu, X, FileText } from "lucide-react";

function Navbar({ onNavigate, currentPage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Accueil", key: "home" },
    { name: "Fonctionnalités", key: "features" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => onNavigate("home")}
          >
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              IntelliAO
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`text-sm font-medium transition-colors ${
                  currentPage === item.key
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => onNavigate("login")}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Se connecter
            </button>
            <button
              onClick={() => onNavigate("signup")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              S'inscrire
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onNavigate(item.key);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  currentPage === item.key
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
                }`}
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onNavigate("login");
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => {
                  onNavigate("signup");
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 mt-1 text-base font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
