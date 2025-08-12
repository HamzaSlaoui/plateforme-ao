// components/DocumentViewerPanel.jsx
import React from "react";
import { FileText, Eye, PanelRightOpen, PanelRightClose } from "lucide-react";

const DocumentViewerPanel = ({ documents, onSelect, isVisible, onToggle }) => {
  if (!documents?.length) return null;

  //A adapter selon les formats acceptés (par la suite)
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    if (extension === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return '🖼️';
    if (['txt', 'md'].includes(extension)) return '📝';
    if (extension === 'csv') return '📊';
    return '📎';
  };

  return (
    <>
      {/* Toggle Button - Positioned relative to panel */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 transform -translate-y-1/2 z-40 p-3 rounded-l-full shadow-lg transition-all duration-300 ${
          isVisible 
            ? 'right-80 bg-red-500 hover:bg-red-600 text-white' 
            : 'right-0 bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isVisible ? "Fermer le panneau" : "Ouvrir les documents"}
      >
        {isVisible ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
      </button>

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Documents</span>
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                {documents.length}
              </span>
            </div>
          </div>

          {/* Documents List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer group"
                onClick={() => onSelect(doc)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getFileIcon(doc.filename)}</span>
                      <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {doc.filename}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {doc.document_type || 'Document'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay when panel is open on mobile */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default DocumentViewerPanel;