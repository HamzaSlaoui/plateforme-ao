import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FolderOpen,
  Calendar,
  Building,
  FileText,
  Upload,
  X,
  Save,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AlertToast from "../components/AlertToast";

const TenderFolderForm = () => {
  const { api, authState } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    submission_deadline: "",
    client_name: "",
    status: "en_cours",
  });

  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newDocuments = acceptedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file: file,
      filename: file.name,
      document_type: getDocumentType(file.name),
      size: file.size,
      status: "accepted",
    }));

    setDocuments((prev) => [...prev, ...newDocuments]);

    if (rejectedFiles.length > 0) {
      const rejectedDocs = rejectedFiles.map((rejection) => ({
        id: Date.now() + Math.random(),
        file: rejection.file,
        filename: rejection.file.name,
        errors: rejection.errors,
        status: "rejected",
      }));
    }
  }, []);

  const getDocumentType = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    return ext.toUpperCase();
  };

  const removeDocument = (documentId) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept: {}, // <--- supprime ou laisse vide pour accepter tous les fichiers
    multiple: true,
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
  });

  const getDropzoneClassName = () => {
    let baseClass =
      "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ";

    if (isDragAccept) {
      baseClass += "border-green-500 bg-green-50 dark:bg-green-900/20 ";
    } else if (isDragReject) {
      baseClass += "border-red-500 bg-red-50 dark:bg-red-900/20 ";
    } else if (isDragActive) {
      baseClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ";
    } else {
      baseClass +=
        "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 ";
    }

    return baseClass;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orgId = authState.user.organisation_id;

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("client_name", formData.client_name);
    formDataToSend.append("status", formData.status);
    if (formData.submission_deadline) {
      const dateStr =
        formData.submission_deadline instanceof Date
          ? formData.submission_deadline.toISOString().slice(0, 10) // "YYYY-MM-DD"
          : formData.submission_deadline;
      formDataToSend.append("submission_deadline", dateStr);
    }
    formDataToSend.append("organisation_id", orgId);

    documents
      .filter((doc) => doc.status === "accepted")
      .forEach((doc) => formDataToSend.append("files", doc.file));

    try {
      const response = await api.post(
        "/tender-folders/create",
        formDataToSend,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccessMessage("Dossier créé avec succès !");
      setFormData({
        name: "",
        description: "",
        submission_deadline: "",
        client_name: "",
        status: "en_cours",
      });
      setDocuments([]);
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      setSuccessMessage(
        error?.response?.data?.message ||
          "Erreur lors de la création du dossier. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full">
              <FolderOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Nouveau Dossier d'Appel d'Offre
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Créez un nouveau dossier et ajoutez vos documents
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Informations du dossier
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du dossier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: Appel d'offre construction..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nom du client"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date limite de soumission
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="submission_deadline"
                    value={formData.submission_deadline}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="en_cours">En cours</option>
                  <option value="soumis">Soumis</option>
                  <option value="gagne">Gagne</option>
                  <option value="perdu">Perdu</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Description détaillée du dossier d'appel d'offre..."
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Upload className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Documents
                </h2>
              </div>
              <button
                type="button"
                onClick={open}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Parcourir les fichiers
              </button>
            </div>

            <div {...getRootProps()} className={getDropzoneClassName()}>
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

              {isDragActive ? (
                isDragAccept ? (
                  <div>
                    <p className="text-green-600 dark:text-green-400 font-medium mb-2">
                      Déposez vos fichiers ici
                    </p>
                    <p className="text-sm text-green-500 dark:text-green-400">
                      Fichiers acceptés
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                      Certains fichiers ne sont pas acceptés
                    </p>
                    <p className="text-sm text-red-500 dark:text-red-400">
                      Vérifiez le format et la taille des fichiers
                    </p>
                  </div>
                )
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">
                    Glissez-déposez vos fichiers ici ou cliquez pour
                    sélectionner
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    📁 Formats acceptés : tous types de fichiers (PDF, Word,
                    Excel, etc.)
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Maximum 10 fichiers • 10MB par fichier
                  </p>
                </div>
              )}
            </div>

            {documents.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    {
                      documents.filter((doc) => doc.status === "accepted")
                        .length
                    }{" "}
                    fichier(s) accepté(s)
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    Total:{" "}
                    {formatFileSize(
                      documents.reduce((total, doc) => total + doc.size, 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            {documents.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Documents ajoutés (
                  {documents.filter((doc) => doc.status === "accepted").length})
                </h3>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      doc.status === "accepted"
                        ? "bg-gray-50 dark:bg-gray-700"
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          doc.status === "accepted"
                            ? "bg-green-100 dark:bg-green-900/20"
                            : "bg-red-100 dark:bg-red-900/20"
                        }`}
                      >
                        {doc.status === "accepted" ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {doc.filename}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {doc.status === "accepted"
                            ? `${doc.document_type} • ${formatFileSize(
                                doc.size
                              )}`
                            : `Erreur: ${doc.errors
                                ?.map((e) => e.message)
                                .join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Créer le dossier</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
        {successMessage && (
          <AlertToast
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}
      </div>
    </div>
  );
};

export default TenderFolderForm;
