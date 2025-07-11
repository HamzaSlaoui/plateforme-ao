import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";

function Home({ onNavigate, currentPage }) {
  const handleNavigate = (section) => {
    console.log("Navigation vers:", section);

    // Gestion spéciale pour login/signup
    if (section === "login" || section === "signup") {
      if (onNavigate) {
        onNavigate(section);
      }
      return;
    }

    // Mapping des sections vers les IDs
    const sectionMapping = {
      home: "home",
      features: "features",
    };

    // Scroll vers la section
    const targetId = sectionMapping[section];
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }

    // Mettre à jour l'état
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      <Hero onNavigate={onNavigate} />
      <Features />
      <Footer />
    </div>
  );
}

export default Home;
