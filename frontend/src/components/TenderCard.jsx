import React from "react";
import { Calendar, Clock, FileText, ExternalLink } from "lucide-react";

const TenderCard = ({ tender, onOpen }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "en_cours":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "soumis":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "gagne":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "perdu":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "en_cours":
        return "En cours";
      case "soumis":
        return "Soumis";
      case "gagne":
        return "Gagné";
      case "perdu":
        return "Perdu";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {tender.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
            {tender.description || "Aucune description"}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            tender.status
          )}`}
        >
          {getStatusText(tender.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {tender.submission_deadline && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Date limite:{" "}
              {new Date(tender.submission_deadline).toLocaleDateString("fr-FR")}
            </span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          <span>
            Créé le: {new Date(tender.created_at).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-4 h-4 mr-2" />
          <span>{tender.document_count || 0} pièce(s) jointe(s)</span>
        </div>
        {tender.client_name && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Client:</span>
            <span className="ml-2">{tender.client_name}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onOpen(tender)}
        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        <ExternalLink className="w-4 h-4" />
        <span>Ouvrir le dossier</span>
      </button>
    </div>
  );
};

export default TenderCard;
