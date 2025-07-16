import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Configure API client
const API_URL = "http://localhost:8000";
const api = axios.create({ baseURL: API_URL });

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      api.defaults.headers.common["Authorization"] = token;
      setAuthState({
        user: JSON.parse(user),
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, token_type } = response.data;
      const token = `${token_type} ${access_token}`;

      localStorage.setItem("token", token);

      api.defaults.headers.common["Authorization"] = token;
      // Récupérer les infos utilisateur
      const userResponse = await api.get("/auth/me");
      const user = userResponse.data;

      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      return {
        success: true,
        isVerified: user.is_verified,
        hasOrganisation: user.organisation_id !== null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Erreur de connexion",
      };
    }
  };

  const signup = async (firstname, lastname, email, password) => {
    try {
      const response = await api.post("/auth/register", {
        firstname,
        lastname,
        email,
        password,
      });

      // Retourner success avec indication de vérification nécessaire
      return {
        success: true,
        needsVerification: true,
      };
    } catch (error) {
      console.error("Signup error:", error.response || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || "Erreur lors de l'inscription",
      };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await api.post("/auth/verify-email", { token });

      // Recharger les infos utilisateur si connecté
      if (authState.isAuthenticated) {
        const userResp = await api.get("/auth/me");
        const user = userResp.data;
        localStorage.setItem("user", JSON.stringify(user));
        setAuthState((prev) => ({ ...prev, user }));
      }

      return { success: true };
    } catch (error) {
      console.error("Verify email error:", error.response || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || "Token invalide ou expiré",
      };
    }
  };

  const logout = () => {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const isUserVerified = () => {
    return authState.user?.is_verified || false;
  };

  const hasOrganisation = () => {
    return authState.user?.organisation_id !== null;
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      const user = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      setAuthState((prev) => ({
        ...prev,
        user,
      }));

      return { success: true, user };
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        signup,
        logout,
        verifyEmail,
        isUserVerified,
        hasOrganisation,
        refreshUser,
        api, // Exposer l'instance axios configurée
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
