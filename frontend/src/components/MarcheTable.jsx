import React, { useState } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function MarcheTable({ marches }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');

  const getUrgencyInfo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        text: 'Expiré',
        class: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle
      };
    } else if (diffDays <= 3) {
      return {
        status: 'urgent',
        text: `${diffDays}j`,
        class: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle
      };
    } else if (diffDays <= 7) {
      return {
        status: 'soon',
        text: `${diffDays}j`,
        class: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Clock
      };
    } else {
      return {
        status: 'normal',
        text: `${diffDays}j`,
        class: 'bg-green-100 text-green-800 border-green-200',
        icon: Clock
      };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAndSortedMarches = marches
    .filter((marche) =>
      [marche.objet, marche.acheteur_public, marche.lieu_execution, marche.reference]
        .some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison =
          new Date(a.date_limite_remise).getTime() - new Date(b.date_limite_remise).getTime();
      } else {
        comparison = a[sortBy].localeCompare(b[sortBy]);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  if (!Array.isArray(marches) || marches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun marché trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les marchés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">
                {filteredAndSortedMarches.length} marché
                {filteredAndSortedMarches.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left">
                  <SortButton field="reference">Référence</SortButton>
                </th>
                <th className="px-6 py-4 text-left">
                  <SortButton field="objet">Objet</SortButton>
                </th>
                <th className="px-6 py-4 text-left">
                  <SortButton field="acheteur_public">Acheteur</SortButton>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Lieu</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <SortButton field="date">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Date limite</span>
                    </div>
                  </SortButton>
                </th>
                <th className="font-semibold text-gray-700 dark:text-gray-300">Urgence</th>
                <th className="font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedMarches.map((marche, index) => {
                const urgencyInfo = getUrgencyInfo(marche.date_limite_remise);
                const UrgencyIcon = urgencyInfo.icon;

                return (
                  <tr key={`${marche.reference}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {marche.reference}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white font-medium leading-relaxed line-clamp-2">
                        {marche.objet}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {marche.acheteur_public}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {marche.lieu_execution}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(marche.date_limite_remise)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${urgencyInfo.class}`}>
                        <UrgencyIcon className="w-3 h-3 mr-1" />
                        {urgencyInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {marche.lien_consultation && (
                        <a
                          href={
                            marche.lien_consultation.startsWith("http")
                              ? marche.lien_consultation
                              : `https://www.marchespublics.gov.ma/${marche.lien_consultation}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 group"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Voir</span>
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
