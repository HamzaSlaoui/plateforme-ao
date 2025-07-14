import React from "react";
import { Home, FolderOpen, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Sidebar = ({ currentPage, onNavigate }) => {
  const { authState, logout } = useAuth();

  const menuItems = [
    { icon: Home, label: "Dashboard", key: "dashboard" },
    { icon: FolderOpen, label: "Dossiers", key: "dashboard" },
    { icon: Settings, label: "Paramètres", key: "settings" },
  ];

  const handleLogout = () => {
    logout();
    onNavigate("home");
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen flex flex-col">
      {/* User Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {authState.user?.firstName} {authState.user?.lastName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {authState.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.key
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
