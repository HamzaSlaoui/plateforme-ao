import { X, Download, FileText } from "lucide-react";

const DocumentPreview = ({ doc, onClose }) => {
  if (!doc) return null;

  const extension = doc.filename.split(".").pop().toLowerCase();
  const base64 = doc.file_content;

  const renderContent = () => {
    if (extension === "pdf") {
      return (
        <div className="flex-1 p-4">
          <iframe
            src={`data:application/pdf;base64,${base64}`}
            width="100%"
            height="100%"
            title="Aperçu PDF"
            className="border rounded-lg"
          />
        </div>
      );
    }

    if (["txt", "md", "csv", "log"].includes(extension)) {
      const decoded = atob(base64);
      return (
        <div className="flex-1 p-4 overflow-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            {decoded}
          </pre>
        </div>
      );
    }

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return (
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
          <img
            src={`data:image/${extension};base64,${base64}`}
            alt={doc.filename}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">
            Aperçu non disponible pour ce type de fichier (
            {extension.toUpperCase()}).
          </p>
          <a
            href={`data:application/octet-stream;base64,${base64}`}
            download={doc.filename}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger {doc.filename}</span>
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {doc.filename}
          </h3>
          <div className="flex items-center space-x-2">
            <a
              href={`data:application/octet-stream;base64,${base64}`}
              download={doc.filename}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default DocumentPreview;
