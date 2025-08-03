import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PrivateRoute from "./components/PrivateRoute";
import ChatbotPage from "./pages/ChatbotPage.jsx";
// import Home from "./pages/Home";
import Login from "./pages/LoginForm";
import Signup from "./pages/SignupForm";
import Dashboard from "./pages/Dashboard";
import VerifyEmailPrompt from "./pages/VerifyEmailPrompt";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import OrganisationChoice from "./pages/OrganisationChoice.jsx";
import CreateOrganisation from "./pages/CreateOrganisation";
import TenderFolderForm from "./pages/TenderFolderForm";
import JoinOrganisation from "./pages/JoinOrganisation";
import MembersPage from "./pages/MembersPage";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import TenderFolderDetail from "./pages/TenderFolderDetail.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route
            path="/verify-email-prompt"
            element={
              <PrivateRoute
                requireVerified={false}
                allowGuestPendingEmail={true}
              >
                <VerifyEmailPrompt />
              </PrivateRoute>
            }
          />

          {/* Routes pour la gestion des organisations */}
          <Route
            path="/organisation-choice"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={false}>
                <OrganisationChoice />
              </PrivateRoute>
            }
          />

          <Route
            path="/create-organisation"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={false}>
                <CreateOrganisation />
              </PrivateRoute>
            }
          />

          <Route
            path="/join-organisation"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={false}>
                <JoinOrganisation />
              </PrivateRoute>
            }
          />

          {/* Routes protégées nécessitant authentification, vérification ET organisation */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={true}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/tender-folder-form"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={true}>
                <TenderFolderForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={true}>
                <SettingsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/members"
            element={
              <PrivateRoute
                requireVerified={true}
                requireOrganisation={true}
                requireOwner={true}
              >
                <MembersPage />
              </PrivateRoute>
            }
          />

          {/* 1) Page de détail « Voir » */}
          { <Route
            path="/tender-folders/:dossierId"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={true}>
                <TenderFolderDetail />
              </PrivateRoute>
            }
          /> }

          <Route
            path="/chat/:dossierId"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={true}>
                <ChatbotPage />
              </PrivateRoute>
            }
          />

          {/* <Route
            path="/tender-folders"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={true}>
                <TenderFolders />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <PrivateRoute requireVerified={true} requireOrganisation={false}>
                <Profile />
              </PrivateRoute>
            }
          /> */}

          {/* Route 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
