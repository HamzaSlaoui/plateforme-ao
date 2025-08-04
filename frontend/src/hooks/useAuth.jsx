import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Configure API client
const API_URL = "http://localhost:8000";
const api = axios.create({ baseURL: API_URL, withCredentials: true });

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Set up interceptor for token refresh on 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalReq = error.config;
        if (
          error.response?.status === 401 &&
          !originalReq._retry &&
          !originalReq.url.endsWith("/auth/refresh")
        ) {
          originalReq._retry = true;
          try {
            const { data } = await api.post("/auth/refresh");
            const bearer = `Bearer ${data.access_token}`;
            localStorage.setItem("token", bearer);
            api.defaults.headers.common["Authorization"] = bearer;
            originalReq.headers["Authorization"] = bearer;
            return api(originalReq);
          } catch (e) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // Initialize auth state from localStorage
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
      const bearer = `${token_type} ${access_token}`;
      localStorage.setItem("token", bearer);
      api.defaults.headers.common["Authorization"] = bearer;

      const userResp = await api.get("/auth/me");
      const user = userResp.data;
      localStorage.setItem("user", JSON.stringify(user));

      setAuthState({
        user,
        token: bearer,
        isAuthenticated: true,
        isLoading: false,
      });

      return {
        success: true,
        isVerified: user.is_verified,
        hasOrganisation: Boolean(user.organisation_id),
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
      await api.post("/auth/register", {
        firstname,
        lastname,
        email,
        password,
      });
      return { success: true, needsVerification: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Erreur lors de l'inscription",
      };
    }
  };

  const verifyEmail = async (token) => {
    try {
      await api.post("/auth/verify-email", { token });
      if (authState.isAuthenticated) {
        const userResp = await api.get("/auth/me");
        const user = userResp.data;
        localStorage.setItem("user", JSON.stringify(user));
        setAuthState((prev) => ({ ...prev, user }));
      }
      return { success: true };
    } catch (error) {
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

  const isUserVerified = () => Boolean(authState.user?.is_verified);
  const hasOrganisation = () => Boolean(authState.user?.organisation_id);
  const isOwner = () => Boolean(authState.user?.is_owner);

  const refreshUser = async () => {
    try {
      const userResp = await api.get("/auth/me");
      const user = userResp.data;
      localStorage.setItem("user", JSON.stringify(user));
      setAuthState((prev) => ({ ...prev, user }));
      return { success: true, user };
    } catch (error) {
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
        isOwner,
        refreshUser,
        api,
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
