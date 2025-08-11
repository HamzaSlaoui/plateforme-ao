import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FolderOpen, Trash2, AlertCircle } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useTenderFolder } from "../hooks/useTenderFolder";
import { useDocumentPreview } from "../hooks/useDocumentPreview";

import Sidebar from "../components/Sidebar";
import StatusSelector from "../components/StatusSelector";
import DocumentPreview from "../components/DocumentPreview";
import DocumentList from "../components/DocumentList";
import ConfirmDialog from "../components/ConfirmDialog";
import FolderInfo from "../components/FolderInfo";
import AddDocumentDropzone from "../components/AddDocumentDropzone";

function TenderFolderDetail() {
  const { dossierId } = useParams();
  const { api, isOwner } = useAuth();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { folder, loading, error, updateStatus, deleteFolder } =
    useTenderFolder(api, dossierId);

  const {
    selectedDoc,
    docContent,
    loading: previewLoading,
    error: previewError,
    openPreview,
    closePreview,
  } = useDocumentPreview(api);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await deleteFolder();

    if (result.success) {
      navigate(-1);
    } else {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleDocumentsUploaded = () => {
    // Option simple : recharger la page pour refetch le dossier avec ses nouveaux documents
    // (à remplacer par un refetch propre si votre hook expose une méthode de rafraîchissement)
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <FolderOpen className="animate-spin w-12 h-12 text-gray-400" />
        </main>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 dark:text-white">
              Dossier non trouvé
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Ce dossier n'existe pas ou vous n'y avez pas accès.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
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

        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {folder.name}
            </h1>
            {folder.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 italic">
                {folder.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <StatusSelector value={folder.status} onChange={updateStatus} />

            {isOwner() && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            )}
          </div>
        </div>

        <FolderInfo folder={folder} />

        {/* Zone d'upload avec le nouveau composant */}
        <AddDocumentDropzone
          dossierId={dossierId}
          api={api}
          onUploaded={handleDocumentsUploaded}
          className="mb-4"
        />

        <DocumentList documents={folder.documents} onPreview={openPreview} />

        {selectedDoc && (
          <DocumentPreview
            doc={selectedDoc}
            content={docContent}
            loading={previewLoading}
            error={previewError}
            onClose={closePreview}
          />
        )}

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Supprimer le dossier ?"
          message={
            <>
              Cette action est <span className="font-semibold">irréversible</span>. Tous les
              documents liés seront supprimés.
            </>
          }
          confirmText="Supprimer définitivement"
          loading={deleting ? "Suppression..." : false}
          danger={true}
        />
      </main>
    </div>
  );
}

export default TenderFolderDetail;