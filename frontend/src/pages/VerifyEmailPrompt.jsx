import React, { useState, useEffect } from "react";
import { Mail, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

function VerifyEmailPrompt() {
  const { authState, logout, isUserVerified, api, refreshUser } = useAuth();
  const navigate = useNavigate();
  const user = localStorage.getItem("user");

  const [resendStatus, setResendStatus] = useState({
    sent: false,
    error: null,
    loading: false,
    cooldown: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem("resendCooldown");
    if (saved) {
      const end = parseInt(saved, 10);
      const now = Date.now();
      if (end > now) {
        setResendStatus((prev) => ({
          ...prev,
          cooldown: Math.ceil((end - now) / 1000),
        }));
      } else {
        localStorage.removeItem("resendCooldown");
      }
    }
  }, []);

  useEffect(() => {
    if (resendStatus.cooldown > 0) {
      const timer = setTimeout(() => {
        setResendStatus((prev) => {
          const next = prev.cooldown - 1;
          if (next <= 0) localStorage.removeItem("resendCooldown");
          return { ...prev, cooldown: next };
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendStatus.cooldown]);

  const handleResendEmail = async () => {
    await refreshUser();
    if (isUserVerified()) {
      setResendStatus((prev) => ({
        ...prev,
        error: "Votre email est déjà vérifié.",
        loading: false,
      }));
      return;
    }
    if (resendStatus.loading || resendStatus.cooldown > 0) return;

    try {
      setResendStatus({ sent: false, error: null, loading: true, cooldown: 0 });

      await api.post("/auth/resend-verification");

      const duration = 0;
      const end = Date.now() + duration * 1000;
      localStorage.setItem("resendCooldown", end.toString());
      setResendStatus({
        sent: true,
        error: null,
        loading: false,
        cooldown: duration,
      });
      setTimeout(
        () => setResendStatus((prev) => ({ ...prev, sent: false })),
        5000
      );
    } catch (error) {
      if (error.response?.status === 429) {
        const match = error.response.data.detail.match(/(\d+) secondes/);
        const wait = match ? parseInt(match[1], 10) : 60;
        const end = Date.now() + wait * 1000;
        localStorage.setItem("resendCooldown", end.toString());
        setResendStatus({
          sent: false,
          error: `Trop de tentatives. Réessayez dans ${wait} secondes.`,
          loading: false,
          cooldown: wait,
        });
      } else {
        setResendStatus({
          sent: false,
          error: "Erreur lors de l'envoi",
          loading: false,
          cooldown: 0,
        });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("resendCooldown");
    logout();
    navigate("/");
  };

  const canResend = !resendStatus.loading && resendStatus.cooldown === 0;

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
            <strong>{authState.user?.email}</strong>. Cliquez sur le lien dans
            l'email pour activer votre compte.
          </p>
        </div>

        {isUserVerified() ? (
          <>
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 text-center">
              <CheckCircle className="inline w-5 h-5 mr-2" />
              Votre email est déjà vérifié!
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Accéder à votre compte
            </button>
          </>
        ) : (
          <>
            {resendStatus.sent && !resendStatus.loading && (
              <div className="mb-4 flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">Email renvoyé avec succès!</span>
              </div>
            )}

            {resendStatus.error && !resendStatus.loading && (
              <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>{resendStatus.error}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={!canResend}
                className={`w-full py-2 px-4 border rounded-lg transition-all duration-200 ${
                  canResend
                    ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-gray-700/50"
                }`}
              >
                {resendStatus.loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2" />
                    Envoi en cours...
                  </span>
                ) : resendStatus.cooldown > 0 ? (
                  <span className="flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Réessayer dans {resendStatus.cooldown}s
                  </span>
                ) : (
                  "Renvoyer l'email"
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Vérifiez votre dossier spam. Si vous continuez à avoir des
            problèmes, contactez le support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPrompt;
