import React, { useState } from "react";
import { Plus, AlertCircle, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDossiers, useFilteredDossiers } from "../hooks/useDossiers";
import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import SearchAndFilter from "../components/SearchAndFilter";
import DossierCard from "../components/DossierCard";
import EmptyState from "../components/EmptyState";

function Dashboard() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { dossiers, stats, loading, error } = useDossiers(api);
  const filteredDossiers = useFilteredDossiers(
    dossiers,
    searchTerm,
    filterStatus
  );

  const recentDossiers = [...filteredDossiers]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

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
              <div>
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                  {error.message}
                </p>
              </div>
            </div>
          )}

          <StatsCards dossiers={dossiers} stats={stats} />

          <SearchAndFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />

          {recentDossiers.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Derniers dossiers créés
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {recentDossiers.map((dossier) => (
                  <DossierCard
                    key={dossier.id}
                    dossier={dossier}
                    onCardClick={handleCardClick}
                    onChatClick={handleChatClick}
                    onViewClick={handleViewClick}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
