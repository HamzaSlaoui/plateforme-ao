import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Sample data
  const dossiers = [
    {
      id: "1",
      title: "Rénovation énergétique - Mairie de Paris",
      description:
        "Appel d'offres pour la rénovation énergétique du bâtiment principal de la mairie du 12ème arrondissement.",
      deadline: "2024-02-15",
      status: "in-progress",
      attachments: ["cahier_charges.pdf", "plans_batiment.pdf"],
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      title: "Développement site web - Conseil Régional",
      description:
        "Création d'un site web institutionnel pour le Conseil Régional d'Île-de-France.",
      deadline: "2024-02-28",
      status: "draft",
      attachments: ["specifications.pdf"],
      createdAt: "2024-01-20",
    },
    {
      id: "3",
      title: "Fourniture mobilier bureau - Ministère",
      description:
        "Appel d'offres pour la fourniture de mobilier de bureau pour les nouveaux locaux du ministère.",
      deadline: "2024-01-30",
      status: "submitted",
      attachments: ["catalogue.pdf", "devis.pdf"],
      createdAt: "2024-01-10",
    },
    {
      id: "4",
      title: "Système informatique - Hôpital",
      description:
        "Mise en place d'un nouveau système informatique pour la gestion des patients.",
      deadline: "2024-03-15",
      status: "won",
      attachments: ["specifications_techniques.pdf"],
      createdAt: "2024-01-05",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "submitted":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "won":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "draft":
        return "Brouillon";
      case "in-progress":
        return "En cours";
      case "submitted":
        return "Soumis";
      case "won":
        return "Gagné";
      case "lost":
        return "Perdu";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "draft":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />;
      case "submitted":
        return <Calendar className="w-4 h-4" />;
      case "won":
        return <CheckCircle className="w-4 h-4" />;
      case "lost":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesSearch =
      dossier.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || dossier.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez vos dossiers d'appels d'offres
              </p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nouveau dossier</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dossiers.length}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    En cours
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dossiers.filter((d) => d.status === "in-progress").length}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Soumis
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dossiers.filter((d) => d.status === "submitted").length}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gagnés
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dossiers.filter((d) => d.status === "won").length}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un dossier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="in-progress">En cours</option>
                  <option value="submitted">Soumis</option>
                  <option value="won">Gagné</option>
                  <option value="lost">Perdu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dossiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDossiers.map((dossier) => (
              <div
                key={dossier.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate("dossier", dossier.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {dossier.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                        dossier.status
                      )}`}
                    >
                      {getStatusIcon(dossier.status)}
                      <span>{getStatusLabel(dossier.status)}</span>
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {dossier.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Échéance:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(dossier.deadline).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Pièces jointes:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dossier.attachments.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDossiers.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun dossier trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aucun dossier ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
