import { Clock, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export const statusConfig = {
  en_cours: {
    label: "En cours",
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    icon: Clock
  },
  soumis: {
    label: "Soumis",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    icon: Calendar
  },
  gagne: {
    label: "Gagné",
    color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    icon: CheckCircle
  },
  perdu: {
    label: "Perdu",
    color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    icon: AlertCircle
  }
};

export const getStatusConfig = (status) => {
  return statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    icon: Clock
  };
};