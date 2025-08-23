import React, { useState } from "react";
import {
  Eye,
  MessageCircle,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// import { useNavigate } from "react-router-dom";

const TenderFoldersTable = ({ folders }) => {
  // const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Vous pouvez rendre cela configurable

  const getStatusInfo = (status) => {
    const statusConfig = {
      en_cours: {
        text: "En cours",
        class:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
        icon: Clock,
      },
      soumis: {
        text: "Soumis",
        class:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        icon: Calendar,
      },
      gagne: {
        text: "Gagné",
        class:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        icon: CheckCircle,
      },
      perdu: {
        text: "Perdu",
        class:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        icon: AlertCircle,
      },
    };
    return statusConfig[status] || statusConfig.en_cours;
  };

  const getUrgencyInfo = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "expired",
        text: "Expiré",
        class:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
        icon: AlertCircle,
      };
    } else if (diffDays <= 3) {
      return {
        status: "urgent",
        text: `${diffDays}j`,
        class:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
        icon: AlertCircle,
      };
    } else if (diffDays <= 7) {
      return {
        status: "soon",
        text: `${diffDays}j`,
        class:
          "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
        icon: Clock,
      };
    } else {
      return {
        status: "normal",
        text: `${diffDays}j`,
        class:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",
        icon: Clock,
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Tri des dossiers
  const sortedFolders = [...folders].sort((a, b) => {
    const dateA = new Date(a.submission_deadline || 0);
    const dateB = new Date(b.submission_deadline || 0);
    const comparison = dateA.getTime() - dateB.getTime();
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Calculs de pagination
  const totalItems = sortedFolders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFolders = sortedFolders.slice(startIndex, endIndex);

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setCurrentPage(1); // Reset à la première page après tri
  };

  const handleViewClick = (folderId) => {
    // navigate(`/tender-folders/${folderId}`);
    console.log('Voir dossier:', folderId);
  };

  const handleChatClick = (folderId) => {
    // navigate(`/chat/${folderId}`);
    console.log('Chat dossier:', folderId);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Composant de pagination intégré
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, "...");
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push("...", totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <span>
            Affichage de {Math.min(startIndex + 1, totalItems)} à{" "}
            {Math.min(endIndex, totalItems)} sur {totalItems} résultats
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Bouton Précédent */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="ml-1">Précédent</span>
          </button>

          {/* Numéros de page */}
          <div className="flex items-center space-x-1">
            {visiblePages.map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? "bg-blue-600 text-white border border-blue-600"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Bouton Suivant */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-1">Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const SortButton = ({ children }) => (
    <button
      onClick={handleSort}
      className="flex items-center space-x-1 text-left font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      <span>{children}</span>
      <span>
        {sortOrder === "asc" ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </span>
    </button>
  );

  if (!Array.isArray(folders) || folders.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun dossier trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Créez votre premier dossier d'appel d'offres
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Nom du dossier
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Client
                  </span>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Statut
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <SortButton>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Échéance</span>
                  </div>
                </SortButton>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Urgence
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Documents
                  </span>
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Date de création
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentFolders.map((folder) => {
              const statusInfo = getStatusInfo(folder.status);
              const urgencyInfo = getUrgencyInfo(folder.submission_deadline);
              const StatusIcon = statusInfo.icon;

              return (
                <tr
                  key={folder.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {folder.name}
                        </p>
                        {folder.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                            {folder.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 dark:text-gray-300">
                      {folder.client_name || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.class}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(folder.submission_deadline)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {urgencyInfo ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${urgencyInfo.class}`}
                      >
                        <urgencyInfo.icon className="w-3 h-3 mr-1" />
                        {urgencyInfo.text}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {folder.document_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(folder.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewClick(folder.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Voir le dossier"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Voir</span>
                      </button>
                      <button
                        onClick={() => handleChatClick(folder.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        title="Chat IA sur ce dossier"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default TenderFoldersTable;