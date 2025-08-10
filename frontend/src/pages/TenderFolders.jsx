import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useFilteredDossiers, useDossiers } from "../hooks/useDossiers";
import Sidebar from "../components/Sidebar";
import SearchAndFilter from "../components/SearchAndFilter";
import TenderFoldersTable from "../components/TenderFoldersTable";

export default function TenderFolders() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { dossiers, loading, error } = useDossiers(api);
  const filteredDossiers = useFilteredDossiers(
    dossiers,
    searchTerm,
    filterStatus
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <FolderOpen className="animate-spin w-12 h-12 text-gray-400" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dossiers d'appels d'offres
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez tous vos dossiers d'appels d'offres
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                {error.message}
              </p>
            </div>
          </div>
        )}

        <SearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        <TenderFoldersTable folders={filteredDossiers} />
      </main>
    </div>
  );
}
