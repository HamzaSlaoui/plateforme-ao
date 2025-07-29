import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Clipboard, Check } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const SettingsPage = () => {
  const {
    authState: { user },
    api,
  } = useAuth();
  const [organisation, setOrganisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrganisation = async () => {
      if (!user?.organisation_id) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me/organisation");
        setOrganisation(response.data);
        console.log("Organisation loaded:", response.data);
      } catch (error) {
        console.error("Failed to load organisation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganisation();
  }, [user]);

  const handleCopy = () => {
    const code = organisation?.code;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Paramètres
        </h1>

        {user?.is_owner && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Code d'invitation
            </h2>
            <div className="mt-2 flex items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chargement du code…
                </p>
              ) : organisation ? (
                <>
                  <code className="font-mono text-xl text-gray-900 dark:text-white">
                    {organisation.code}
                  </code>
                  <button
                    onClick={handleCopy}
                    disabled={copied}
                    aria-label="Copier le code"
                    className={`ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      copied ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Clipboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune organisation
                </p>
              )}
            </div>
            {copied && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                Code copié !
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default SettingsPage;
