import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import Home from "./pages/Home";
import Login from "./pages/LoginForm";
import Signup from "./pages/SignupForm";
import Dashboard from "./pages/Dashboard";
import VerifyEmailPrompt from "./pages/VerifyEmailPrompt";
import VerifyEmail from "./pages/VerifyEmail.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques - redirigent vers dashboard si connecté */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Route pour utilisateurs connectés mais non vérifiés */}
          <Route
            path="/verify-email-prompt"
            element={
              <PrivateRoute requireVerified={false}>
                <VerifyEmailPrompt />
              </PrivateRoute>
            }
          />

          {/* Routes protégées nécessitant authentification ET vérification */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requireVerified={true}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          {/* <Route
            path="/tender-folders"
            element={
              <PrivateRoute requireVerified={true}>
                <TenderFolders />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute requireVerified={true}>
                <Profile />
              </PrivateRoute>
            }
          /> */}

          {/* Route 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
