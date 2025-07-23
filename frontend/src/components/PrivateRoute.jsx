import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({
  children,
  requireVerified = true,
  requireOrganisation = false,
  requireOwner = false,
}) => {
  const { authState, isUserVerified, hasOrganisation, isOwner } = useAuth();
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
    return <Navigate to="/" replace />;
  }

  // Si authentifié mais non vérifié et que la route nécessite vérification
  if (requireVerified && !isUserVerified()) {
    return <Navigate to="/verify-email-prompt" replace />;
  }

  // Si la route est /organisation-choice (requireOrganisation=false)
  // et que l'utilisateur a déjà une organisation, rediriger vers dashboard
  if (!requireOrganisation && hasOrganisation()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si la route nécessite une org et que l'utilisateur n'en a pas
  if (requireOrganisation && !hasOrganisation()) {
    return <Navigate to="/organisation-choice" replace />;
  }

  if (requireOwner && !isOwner()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
