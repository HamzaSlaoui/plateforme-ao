import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const CreateOrganisation = () => {
  const navigate = useNavigate();
  const { api, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'organisation est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.name.length > 255) {
      newErrors.name = "Le nom ne peut pas dépasser 255 caractères";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await api.post("/organisations/create", {
        name: formData.name.trim(),
      });
      setSuccess(true);

      setTimeout(async () => {
        await refreshUser();
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      setErrors({ general: "Une erreur s'est produite lors de la création" });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Organisation créée avec succès !
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Redirection vers le tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <button
            onClick={() => navigate("/organisation-choice")}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Créer une organisation
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Donnez un nom à votre organisation
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">
                  {errors.general}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nom de l'organisation
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.name
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Ex: Mon Entreprise"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/organisation-choice")}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  isLoading
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Création...
                  </span>
                ) : (
                  "Créer"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Un code unique sera généré pour inviter des membres
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganisation;
