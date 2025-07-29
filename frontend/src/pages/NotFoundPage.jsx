import React from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            404 - Page non trouvée
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Oups ! La page que vous recherchez n'existe pas.
          </p>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
