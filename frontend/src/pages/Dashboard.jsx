import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FolderOpen,
  MessageCircle,
  Eye,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Dashboard() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [dossiers, setDossiers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        const res = await api.get("/tender-folders");
        console.log(res.data);
        setStats(res.data.stats);
        setDossiers(res.data.folders);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les dossiers.");
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, [api]);

  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesSearch =
      dossier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dossier.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || dossier.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status) => {
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "en_cours":
        return <Clock className="w-4 h-4" />;
      case "soumis":
        return <Calendar className="w-4 h-4" />;
      case "gagne":
        return <CheckCircle className="w-4 h-4" />;
      case "perdu":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleCardClick = (e, dossierId) => {
    e.stopPropagation();
    navigate(`/tender-folders/${dossierId}`);
  };

  const handleChatClick = (e, dossierId) => {
    e.stopPropagation();
    navigate(`/chat/${dossierId}`);
  };

  const handleViewClick = (e, dossierId) => {
    e.stopPropagation();
    navigate(`/tender-folders/${dossierId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <FolderOpen className="animate-spin w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez vos dossiers d'appels d'offres
              </p>
            </div>
            <button
              onClick={() => navigate("/tender-folder-form")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau dossier</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total des dossiers
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dossiers.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    En cours
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.en_cours}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Filter className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gagné
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.gagne}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Filter className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Soumis
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.soumis}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Filter className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                  onChange={({ target }) => setFilterStatus(target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="en_cours">En cours</option>
                  <option value="soumis">Soumis</option>
                  <option value="gagne">Gagné</option>
                  <option value="perdu">Perdu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dossiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDossiers.map((dossier) => (
              <div
                key={dossier.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={(e) => handleCardClick(e, dossier.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 pr-2">
                      {dossier.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 whitespace-nowrap ${getStatusColor(
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

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Échéance:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {dossier.submission_deadline
                          ? new Date(
                              dossier.submission_deadline
                            ).toLocaleDateString("fr-FR")
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

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={(e) => handleViewClick(e, dossier.id)}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Voir</span>
                    </button>
                    <button
                      onClick={(e) => handleChatClick(e, dossier.id)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                      title="Chat avec l'IA sur ce dossier"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat IA</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredDossiers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
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
    </div>
  );
}

export default Dashboard;
