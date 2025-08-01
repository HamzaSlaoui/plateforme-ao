import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const JoinOrganisation = () => {
  const navigate = useNavigate();
  const { api, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    code: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Le code est requis";
    } else if (formData.code.trim().length !== 8) {
      newErrors.code = "Le code doit contenir 8 caractères";
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
      await api.post("/organisations/join", {
        code: formData.code.trim().toUpperCase(),
      });

      setSuccess(true);

      setTimeout(async () => {
        await refreshUser();
        navigate("/");
      }, 2000);
    } catch (error) {
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      } else {
        setErrors({
          general: "Une erreur s'est produite lors de l'envoi de la demande",
        });
      }
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
            Demande envoyée !
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Redirection vers la page d'authentification...
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
            <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Rejoindre une organisation
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Entrez le code unique de l'organisation
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
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Code de l'organisation
              </label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.code
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Ex: A1B2C3D4"
                disabled={isLoading}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.code}
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
                    Envoi...
                  </span>
                ) : (
                  "Rejoindre"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinOrganisation;
