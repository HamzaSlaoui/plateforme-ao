import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertCircle, PlusCircle, Upload, X, Check, FileText } from "lucide-react";


function AddDocumentDropzone({ dossierId, api, onUploaded, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = (acceptedFiles) => {
    setError("");
    if (!acceptedFiles?.length) return;
    
    // Ajouter les nouveaux fichiers à la liste existante
    const newFiles = acceptedFiles.map((file, index) => ({
      id: Date.now() + index, // ID unique pour pouvoir supprimer
      file,
      name: file.name,
      size: file.size
    }));
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setError(""); // Clear any error when files are modified
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setError("");
  };

  const confirmUpload = async () => {
    if (!selectedFiles.length) return;
    
    const formData = new FormData();
    selectedFiles.forEach(({ file }) => formData.append("files", file));

    try {
      setUploading(true);
      setError("");
      
      await api.post(`/tender-folders/${dossierId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Reset state on success
      setSelectedFiles([]);
      onUploaded?.();
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.detail ||
          "Échec du téléversement. Veuillez réessayer."
      );
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
    disabled: uploading
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`mt-6 ${className}`}>
      {/* Zone de dépôt */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
          isDragActive 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10 scale-[1.02]" 
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
        } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg transition-colors ${
              isDragActive 
                ? "bg-blue-100 dark:bg-blue-900/20" 
                : "bg-gray-100 dark:bg-gray-700"
            }`}>
              <Upload className={`w-5 h-5 ${
                isDragActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400"
              }`} />
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragActive ? "Déposez vos fichiers ici" : "Ajouter des documents"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Glissez-déposez ou cliquez pour sélectionner
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={open}
            disabled={uploading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              uploading
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
            }`}
          >
            <span className="flex items-center space-x-2">
              <PlusCircle className="w-4 h-4" />
              <span>Parcourir</span>
            </span>
          </button>
        </div>

        {/* Indicateur visuel pendant le drag */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-lg border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-center">
            <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Relâchez pour ajouter les fichiers
            </div>
          </div>
        )}
      </div>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Fichiers sélectionnés ({selectedFiles.length})
            </h4>
            <button
              type="button"
              onClick={clearAllFiles}
              disabled={uploading}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              Tout supprimer
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {fileItem.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileItem.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(fileItem.id)}
                  disabled={uploading}
                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 flex-shrink-0 ml-2"
                  title="Supprimer ce fichier"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={clearAllFiles}
              disabled={uploading}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
            >
              Annuler
            </button>
            
            <button
              type="button"
              onClick={confirmUpload}
              disabled={uploading || selectedFiles.length === 0}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                uploading
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
              }`}
            >
              {uploading ? (
                <span className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 animate-pulse" />
                  <span>Upload en cours...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Confirmer l'ajout</span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Info formats */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Formats acceptés : PDF, Word, CSV et TXT.
      </p>
    </div>
  );
}

export default AddDocumentDropzone;