import React from "react";
import { Search } from "lucide-react";
import { getStatusConfig } from "../utils/status";

const StatsCards = ({ dossiers = [], stats = {} }) => {
  const totalCard = {
    title: "Total des dossiers",
    value: Array.isArray(dossiers) ? dossiers.length : 0,
    color:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    icon: Search,
  };

  const statusCards = [
    { title: "En cours", value: stats.en_cours || 0, status: "en_cours" },
    { title: "Soumis", value: stats.soumis || 0, status: "soumis" },
    { title: "Gagné", value: stats.gagne || 0, status: "gagne" },
    { title: "Perdu", value: stats.perdu || 0, status: "perdu" },
  ].map((card) => {
    const statusConfig = getStatusConfig(card.status);
    return {
      ...card,
      color: statusConfig.color,
      icon: statusConfig.icon,
    };
  });

  const cardData = [totalCard, ...statusCards];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {cardData.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}
              >
                {Icon && <Icon className="w-6 h-6" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
