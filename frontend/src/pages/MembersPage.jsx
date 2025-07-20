import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../hooks/useAuth";

const MembersPage = () => {
  const {
    api,
    authState: { user },
  } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState({});
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await api.get("/organisations/join-requests");
      setRequests(res.data); // expect [{ id, firstname, lastname, email }, …]
    } catch (e) {
      setError("Impossible de charger les demandes.");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    setLoadingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/organisations/join-requests/${id}/${action}`);
      // remove from list
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Gestion des membres
        </h1>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prénom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {requests.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Aucune demande en attente
                  </td>
                </tr>
              )}
              {requests.map(({ id, firstname, lastname, email }) => (
                <tr key={id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {lastname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {firstname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                    {email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => handleAction(id, "accept")}
                        disabled={loadingIds[id]}
                        className={`p-2 rounded-full transition-colors ${
                          loadingIds[id]
                            ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                        }`}
                      >
                        {loadingIds[id] ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(id, "reject")}
                        disabled={loadingIds[id]}
                        className={`p-2 rounded-full transition-colors ${
                          loadingIds[id]
                            ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                        }`}
                      >
                        {loadingIds[id] ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default MembersPage;
