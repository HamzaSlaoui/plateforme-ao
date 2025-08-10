import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

function VerifyEmail() {
  const { verifyEmail, authState, hasOrganisation } = useAuth();
  const [status, setStatus] = useState({
    loading: true,
    success: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus({ loading: false, success: false });
      return;
    }

    (async () => {
      const result = await verifyEmail(token);
      setStatus({ loading: false, success: result.success });
      if (!result.success) return;

      setTimeout(() => setStatus((s) => ({ ...s, success: "redirect" })), 1500);
    })();
  }, [verifyEmail]);

  useEffect(() => {
    if (status.success !== "redirect") return;
    console.error("Redirection vers :", authState.user);
    if (!authState.isAuthenticated) {
      navigate("/");
      return;
    }
    if (!hasOrganisation()) {
      navigate("/organisation-choice");
    } else {
      navigate("/dashboard");
    }
  }, [status.success, authState.user]);

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
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
