import React, { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const VerifyEmailPrompt = ({ onNavigate }) => {
  const { authState, logout } = useAuth();
  const [resendStatus, setResendStatus] = useState({
    sent: false,
    error: null,
  });

  const handleResendEmail = async () => {
    try {
      // TODO: Ajouter un endpoint pour renvoyer l'email
      // const response = await api.post('/auth/resend-verification');
      setResendStatus({ sent: true, error: null });
    } catch (error) {
      setResendStatus({ sent: false, error: "Erreur lors de l'envoi" });
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-full">
            <Mail className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Vérifiez votre email
        </h2>

        <div className="flex items-start mb-6">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Nous avons envoyé un email de vérification à{" "}
            <strong>{authState.user?.email}</strong>. Veuillez cliquer sur le
            lien dans l'email pour activer votre compte.
          </p>
        </div>

        {resendStatus.sent && (
          <div className="mb-4 flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">Email renvoyé avec succès!</span>
          </div>
        )}

        {resendStatus.error && (
          <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
            {resendStatus.error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Renvoyer l'email
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPrompt;
