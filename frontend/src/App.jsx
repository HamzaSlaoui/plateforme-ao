import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import PrivateRoute from "./components/PrivateRoute";
import ChatbotPage from "./pages/ChatbotPage.jsx";
import Home from "./pages/Home";
import Login from "./pages/LoginForm";
import Signup from "./pages/SignupForm";
import Dashboard from "./pages/Dashboard";
import VerifyEmailPrompt from "./pages/VerifyEmailPrompt";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import OrganizationChoice from "./pages/OrganizationChoice.jsx";
import CreateOrganization from "./pages/CreateOrganization";
import TenderFolderForm from "./pages/TenderFolderForm";
import JoinOrganization from "./pages/JoinOrganization";
import MembersPage from "./pages/MembersPage";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import TenderFolderDetail from "./pages/TenderFolderDetail.jsx";
import Marches from "./pages/Marches.jsx";
import TenderFolders from "./pages/TenderFolders.jsx";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route
            path="/verify-email-prompt"
            element={
              <PrivateRoute requireVerified={false} requireOrganization={false}>
                <VerifyEmailPrompt />
              </PrivateRoute>
            }
          />

          {/* Routes pour la gestion des organisations */}
          <Route
            path="/organization-choice"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={false}>
                <OrganizationChoice />
              </PrivateRoute>
            }
          />

          <Route
            path="/create-organization"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={false}>
                <CreateOrganization />
              </PrivateRoute>
            }
          />

          <Route
            path="/join-organization"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={false}>
                <JoinOrganization />
              </PrivateRoute>
            }
          />

          {/* Routes protégées nécessitant authentification, vérification ET organisation */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/tender-folder-form"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <TenderFolderForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <SettingsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/members"
            element={
              <PrivateRoute
                requireVerified={true}
                requireOrganization={true}
                requireOwner={true}
              >
                <MembersPage />
              </PrivateRoute>
            }
          />

          {
            <Route
              path="/tender-folders/:dossierId"
              element={
                <PrivateRoute requireVerified={true} requireOrganization={true}>
                  <TenderFolderDetail />
                </PrivateRoute>
              }
            />
          }

          <Route
            path="/chat/:dossierId"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <ChatbotPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/folders"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <TenderFolders />
              </PrivateRoute>
            }
          />

          <Route
            path="/marches"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <Marches />
              </PrivateRoute>
            }
          />

          {/* <Route
            path="/tender-folders"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={true}>
                <TenderFolders />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <PrivateRoute requireVerified={true} requireOrganization={false}>
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
