import React from "react";
import { ArrowRight, Bot, FileText, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Automatisez vos{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  appels d&apos;offres
                </span>{" "}
                grâce à l&apos;IA
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                Révolutionnez votre processus de gestion des marchés publics
                avec notre plateforme intelligente qui automatise la recherche,
                le suivi et la préparation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <span>IA Intégrée</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span>Automatisation</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span>Efficacité</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-1 transition-transform">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Appel d&apos;offres - La défense
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Échéance: 15 jours
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Recherche automatique activée
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Chatbot intelligent intégré
                      </span>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        Prêt pour soumission
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
