import React from "react";
import { Search, Filter } from "lucide-react";

const StatsCards = ({ dossiers, stats }) => {
  const cardData = [
    {
      title: "Total des dossiers",
      value: dossiers.length,
      color: "indigo",
      icon: Search,
    },
    {
      title: "En cours",
      value: stats.en_cours || 0,
      color: "yellow",
      icon: Filter,
    },
    {
      title: "Soumis",
      value: stats.soumis || 0,
      color: "blue",
      icon: Filter,
    },
    {
      title: "Gagné",
      value: stats.gagne || 0,
      color: "green",
      icon: Filter,
    },
    {
      title: "Perdu",
      value: stats.perdu || 0,
      color: "red",
      icon: Filter,
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      indigo:
        "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400",
      blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
      yellow:
        "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400",
      green:
        "text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400",
      red: "text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[color];
  };

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
                <p className={`text-2xl font-bold text-${card.color}-600`}>
                  {card.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(
                  card.color
                )}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
