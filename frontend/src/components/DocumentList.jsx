import React from "react";
import { Eye, Download, FileText, FolderOpen } from "lucide-react";
import { getFileType, formatFileSize } from "../utils/fileUtils";

const DocumentList = ({ documents, onPreview }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun document trouvé
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Ce dossier ne contient encore aucun document.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">
        Documents ({documents.length})
      </h2>

      <div className="grid gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onPreview={onPreview} />
        ))}
      </div>
    </div>
  );
};

const DocumentCard = ({ doc, onPreview }) => {
  const fileType = getFileType(doc.filename);

  const getFileIcon = () => {
    switch (fileType) {
      case "pdf":
        return "📄";
      case "image":
        return "🖼️";
      case "text":
        return "📝";
      case "document":
        return "📋";
      case "spreadsheet":
        return "📊";
      default:
        return "📎";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{getFileIcon()}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {doc.filename}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {doc.document_type}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Ajouté le {new Date(doc.created_at).toLocaleDateString("fr-FR")}
              </span>
              {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onPreview(doc)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
            title="Aperçu du document"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </button>

          <a
            href={`/api/documents/${doc.id}/download`}
            download={doc.filename}
            className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
            title="Télécharger le document"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;
