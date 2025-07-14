import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const VerifyEmail = ({ onNavigate }) => {
  const { verifyEmail, authState } = useAuth();
  const [status, setStatus] = useState({
    loading: true,
    success: false,
    error: null,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus({ loading: false, success: false, error: "Token manquant" });
      return;
    }

    const verify = async () => {
      const result = await verifyEmail(token);

      if (result.success) {
        setStatus({ loading: false, success: true, error: null });

        // Rediriger après 3 secondes
        setTimeout(() => {
          if (authState.isAuthenticated) {
            onNavigate("dashboard");
          } else {
            onNavigate("login");
          }
        }, 3000);
      } else {
        setStatus({ loading: false, success: false, error: result.error });
      }
    };

    verify();
  }, [verifyEmail, authState.isAuthenticated, onNavigate]);

  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Vérification en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {status.success ? (
          <>
            <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Email vérifié avec succès!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Votre compte a été activé. Vous allez être redirigé...
            </p>
          </>
        ) : (
          <>
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Échec de la vérification
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {status.error}
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
