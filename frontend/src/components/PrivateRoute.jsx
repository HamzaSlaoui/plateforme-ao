import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({
  children,
  requireVerified = true,
  requireOrganization = false,
  requireOwner = false,
}) => {
  const { authState, isUserVerified, hasOrganization, isOwner } = useAuth();

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !isUserVerified()) {
    return <Navigate to="/verify-email-prompt" replace />;
  }

  if (!requireOrganization && hasOrganization()) {
    console.error(authState);
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOrganization && !hasOrganization()) {
    console.error(authState);
    return <Navigate to="/organization-choice" replace />;
  }

  if (requireOwner && !isOwner()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
