import React from "react";
import { Search, FileText, Bot, BarChart, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";

function Features() {
  const features = [
    {
      icon: Search,
      title: "Veille Automatisée",
      description:
        "Notre IA surveille en permanence les nouvelles opportunités d'appels d'offres selon vos critères personnalisés.",
      color: "text-blue-600",
    },
    {
      icon: FileText,
      title: "Génération de Documents",
      description:
        "Créez automatiquement tous vos documents de soumission avec une intelligence artificielle spécialisée.",
      color: "text-green-600",
    },
    {
      icon: Bot,
      title: "Chatbot Intelligent",
      description:
        "Posez des questions sur vos dossiers et obtenez des réponses instantanées grâce à notre chatbot RAG.",
      color: "text-purple-600",
    },
    {
      icon: BarChart,
      title: "Suivi des Performances",
      description:
        "Analysez vos taux de succès et optimisez votre stratégie avec des tableaux de bord détaillés.",
      color: "text-orange-600",
    },
    {
      icon: Clock,
      title: "Gestion des Échéances",
      description:
        "Ne manquez plus jamais une date limite avec nos alertes automatiques et notre calendrier intégré.",
      color: "text-red-600",
    },
    {
      icon: Shield,
      title: "Sécurité Avancée",
      description:
        "Vos données sont protégées par un chiffrement de niveau entreprise et des protocoles de sécurité stricts.",
      color: "text-indigo-600",
    },
  ];

  return (
    <div id="features" className="bg-white dark:bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Fonctionnalités Avancées
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Découvrez comment notre plateforme révolutionne la gestion des
            appels d'offres avec des outils intelligents et automatisés.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition-shadow group"
            >
              <div className={`${feature.color} mb-4`}>
                <feature.icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Prêt à transformer votre processus d'appels d'offres ?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Rejoignez des centaines d'entreprises qui ont déjà automatisé
              leurs processus.
            </p>
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Commencer maintenant
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Features;
