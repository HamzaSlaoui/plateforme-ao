import React from "react";
import { MessageCircle, Eye } from "lucide-react";
import { getStatusConfig } from "../utils/status";

const DossierCard = ({ dossier, onViewClick, onChatClick, onCardClick }) => {
  const statusConfig = getStatusConfig(dossier.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer relative flex flex-col"
      onClick={(e) => onCardClick(e, dossier.id)}
    >
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 pr-2">
            {dossier.name}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${statusConfig.color}`}
          >
            <StatusIcon className="w-4 h-4" />
            <span>{statusConfig.label}</span>
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {dossier.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Échéance:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {dossier.submission_deadline
                ? new Date(dossier.submission_deadline).toLocaleDateString(
                    "fr-FR"
                  )
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Pièces jointes:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {dossier.document_count}
            </span>
          </div>
        </div>

        {/* Boutons toujours en bas */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <button
            onClick={(e) => onViewClick(e, dossier.id)}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Voir</span>
          </button>
          <button
            onClick={(e) => onChatClick(e, dossier.id)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
            title="Chat avec l'IA sur ce dossier"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DossierCard;
