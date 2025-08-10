import { useState, useEffect, useMemo } from "react";

export const useDossiers = (api) => {
  const [dossiers, setDossiers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/tender-folders");
        setStats(res.data.stats);
        setDossiers(res.data.folders);
      } catch (err) {
        setError({
          message: "Impossible de charger les dossiers.",
          details: err.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDossiers();
  }, [api]);

  return { dossiers, stats, loading, error };
};

export const useFilteredDossiers = (dossiers, searchTerm, filterStatus) => {
  return useMemo(() => {
    return dossiers.filter((dossier) => {
      const matchesSearch =
        dossier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dossier.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || dossier.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [dossiers, searchTerm, filterStatus]);
};
