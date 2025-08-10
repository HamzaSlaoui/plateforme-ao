import React, { useState } from "react";

const STATUS_OPTIONS = [
  { key: "en_cours", label: "En cours", color: "yellow" },
  { key: "soumis", label: "Soumis", color: "blue" },
  { key: "gagne", label: "Gagné", color: "green" },
  { key: "perdu", label: "Perdu", color: "red" },
];

const StatusSelector = ({ value, onChange, disabled = false }) => {
  const [saving, setSaving] = useState(false);

  const getClasses = (active) =>
    `px-3 py-1 rounded-full border transition-colors text-xs sm:text-sm font-medium
     ${
       active
         ? "bg-blue-600 border-blue-600 text-white dark:text-white"
         : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
     }
     ${
       disabled || saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
     }`;

  const handleClick = async (status) => {
    if (saving || status === value || disabled) return;

    try {
      setSaving(true);
      await onChange(status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
      {STATUS_OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key}
            onClick={() => handleClick(option.key)}
            disabled={saving || disabled}
            className={getClasses(active)}
            aria-pressed={active}
            title={saving ? "Mise à jour..." : option.label}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusSelector;
