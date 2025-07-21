import React from "react";
import { CheckCircle, X } from "lucide-react";

const AlertToast = ({ message, onClose }) => (
  <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
    <div className="flex items-center bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-5 py-4 rounded-lg shadow-lg min-w-[260px]">
      <CheckCircle className="h-5 w-5 mr-3" />
      <span className="font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-3 text-green-700 dark:text-green-300 hover:text-green-900"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default AlertToast; 