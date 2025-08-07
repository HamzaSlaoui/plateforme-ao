import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, Download } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";

function DocumentPreview({ doc }) {
  const extension = doc.filename.split(".").pop().toLowerCase();
  const base64 = doc.file_content;

  if (extension === "pdf") {
    return (
      <iframe
        src={`data:application/pdf;base64,${base64}`}
        width="100%"
        height="100%"
        title="Aperçu PDF"
        className="border rounded"
      />
    );
  } else if (["txt", "md", "csv", "log"].includes(extension)) {
    const decoded = atob(base64);
    return (
      <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
        {decoded}
      </pre>
    );
  } else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
    return (
      <img
        src={`data:image/${extension};base64,${base64}`}
        alt={doc.filename}
        className="max-h-[80vh] mx-auto"
      />
    );
  } else {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        <p className="mb-2">
          Aperçu non disponible pour ce type de fichier (
          {extension.toUpperCase()}).
        </p>
        <a
          href={`data:application/octet-stream;base64,${base64}`}
          download={doc.filename}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-flex items-center"
        >
          Télécharger {doc.filename}
        </a>
      </div>
    );
  }
}

function TenderFolderDetail() {
  const { dossierId: id } = useParams();
  const { api } = useAuth();
  const [folder, setFolder] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

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

  useEffect(() => {
    if (!id) return;
    api
      .get(`/tender-folders/${id}`)
      .then((res) => setFolder(res.data))
      .catch((err) => console.error("Erreur de chargement :", err));
  }, [api, id]);

  if (!folder) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 p-8 text-gray-700 dark:text-white">
          Chargement...
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {folder.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
          {folder.description}
        </p>

        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 shadow-sm rounded-2xl p-6">
            <h2 className="text-lg font-bold text-blue-800 dark:text-white mb-4">
              Informations sur le dossier
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-200">
              <div>
                <span className="font-semibold">Client :</span>{" "}
                {folder.client_name || "—"}
              </div>
              <div>
                <span className="font-semibold">Statut :</span>{" "}
                {getStatusLabel(folder.status)}
              </div>
              <div>
                <span className="font-semibold">Date de soumission :</span>{" "}
                {folder.submission_deadline?.split("T")[0] || "—"}
              </div>
              <div>
                <span className="font-semibold">Créé le :</span>{" "}
                {new Date(folder.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">Nombre de documents :</span>{" "}
                {folder.document_count}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">
          Documents
        </h2>
        <div className="grid gap-4">
          {folder.documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {doc.filename}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {doc.document_type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                    Ajouté le {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Aperçu</span>
                  </button>
                  <a
                    href={`data:application/octet-stream;base64,${doc.file_content}`}
                    download={doc.filename}
                    className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-4 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedDoc && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-4xl w-full h-[90vh] relative overflow-auto">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
                onClick={() => setSelectedDoc(null)}
              >
                &times;
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {selectedDoc.filename}
              </h3>
              <DocumentPreview doc={selectedDoc} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TenderFolderDetail;
