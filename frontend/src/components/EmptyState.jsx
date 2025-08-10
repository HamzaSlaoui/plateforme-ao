import React from "react";
import { FolderOpen } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12">
      <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Aucun dossier trouvé
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Aucun dossier ne correspond à vos critères de recherche.
      </p>
    </div>
  );
};

export default EmptyState;
