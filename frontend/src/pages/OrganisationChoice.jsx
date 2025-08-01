import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const OrganisationChoice = () => {
  const navigate = useNavigate();
  const { authState, hasOrganisation } = useAuth();

  useEffect(() => {
    if (hasOrganisation()) {
      navigate("/dashboard");
    }
  }, [authState.user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Bienvenue, {authState.user?.firstname} !
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Pour commencer, créez ou rejoignez une organisation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate("/create-organisation")}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 cursor-pointer transition-all hover:shadow-xl hover:scale-105 group"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-4">
              Créer une organisation
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Démarrez votre propre organisation et invitez des membres à vous
              rejoindre
            </p>

            <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
              <span>Commencer</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate("/join-organisation")}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 cursor-pointer transition-all hover:shadow-xl hover:scale-105 group"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                <Users className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-4">
              Rejoindre une organisation
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Entrez le code d'invitation pour rejoindre une organisation
              existante
            </p>

            <div className="flex items-center justify-center text-green-600 dark:text-green-400 font-medium">
              <span>Rejoindre</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganisationChoice;
