import React from "react";
import { CheckCircle, X } from "lucide-react";

const AlertToast = ({ message, onClose, type }) => (
  <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
    <div
      className={`flex items-center px-5 py-4 rounded-lg shadow-lg min-w-[260px] ${
        type === "success"
          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
          : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 mr-3" />
      ) : (
        <X className="h-5 w-5 mr-3" />
      )}
      <span className="font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className={`ml-3 ${
          type === "success"
            ? "text-green-700 dark:text-green-300 hover:text-green-900"
            : "text-red-700 dark:text-red-300 hover:text-red-900"
        }`}
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default AlertToast;
