import { useState, useEffect, useCallback } from "react";

export const useTenderFolder = (api, folderId) => {
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFolder = useCallback(async () => {
    if (!folderId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/tender-folders/${folderId}`);
      setFolder(res.data);
    } catch (err) {
      setError({
        message: "Erreur lors du chargement du dossier",
        details: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [api, folderId]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  const updateStatus = useCallback(
    async (status) => {
      try {
        await api.put(`/tender-folders/${folder.id}/status`, { status });
        setFolder((prev) => ({ ...prev, status }));
        return { success: true };
      } catch (err) {
        const error = {
          message: "Erreur de mise à jour du statut",
          details: err.message,
        };
        setError(error);
        return { success: false, error };
      }
    },
    [api, folder?.id]
  );

  const deleteFolder = useCallback(async () => {
    try {
      await api.delete(`/tender-folders/${folder.id}`);
      return { success: true };
    } catch (err) {
      const error = {
        message: "Erreur lors de la suppression",
        details: err.message,
      };
      setError(error);
      return { success: false, error };
    }
  }, [api, folder?.id]);

  return {
    folder,
    loading,
    error,
    updateStatus,
    deleteFolder,
    refetch: fetchFolder,
  };
};
