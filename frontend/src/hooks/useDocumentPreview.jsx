import { useState, useCallback } from "react";

export const useDocumentPreview = (api) => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openPreview = useCallback(
    async (doc) => {
      setSelectedDoc(doc);
      setDocContent(null);
      setLoading(true);
      setError(null);

      try {
        setDocContent(doc.file_content);
      } catch (err) {
        setError("Impossible de charger le document");
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const closePreview = useCallback(() => {
    setSelectedDoc(null);
    setDocContent(null);
    setError(null);
  }, []);

  return {
    selectedDoc,
    docContent,
    loading,
    error,
    openPreview,
    closePreview,
  };
};
