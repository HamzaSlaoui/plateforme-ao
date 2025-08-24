import { useState, useEffect } from "react";

export const usePendingRequests = (api, user) => {
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.is_owner || !api) return;

    const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get("/organizations/join-requests/pending-count");
        setHasPendingRequests((res.data.count || 0) > 0);
      } catch (err) {
        console.error("Erreur lors de la récupération des demandes:", err);
        setHasPendingRequests(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, [api, user?.is_owner]);

  return { hasPendingRequests, loading };
};
