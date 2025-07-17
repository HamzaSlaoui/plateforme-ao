import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
  const { authState, isUserVerified, hasOrganisation } = useAuth();

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si authentifié et vérifié avec organisation, aller au dashboard
  if (authState.isAuthenticated && isUserVerified() && hasOrganisation()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si authentifié et vérifié sans organisation, aller au choix
  if (authState.isAuthenticated && isUserVerified() && !hasOrganisation()) {
    return <Navigate to="/organisation-choice" replace />;
  }

  // Si authentifié mais non vérifié, aller au prompt de vérification
  if (authState.isAuthenticated && !isUserVerified()) {
    return <Navigate to="/verify-email-prompt" replace />;
  }

  return children;
};

export default PublicRoute;
