// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// IMPORTANT: Notez que requireOrganisation est défini comme paramètre ici
const PrivateRoute = ({
  children,
  requireVerified = true,
  requireOrganisation = false, // <-- Ce paramètre doit être défini ici
}) => {
  const { authState, isUserVerified, hasOrganisation } = useAuth();

  // Afficher un loader pendant la vérification de l'auth
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si non authentifié, rediriger vers login
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si authentifié mais non vérifié et que la route nécessite vérification
  if (requireVerified && !isUserVerified()) {
    return <Navigate to="/verify-email-prompt" replace />;
  }

  // Vérification pour l'organisation
  if (requireOrganisation && !hasOrganisation()) {
    return <Navigate to="/organisation-choice" replace />;
  }

  return children;
};

export default PrivateRoute;
