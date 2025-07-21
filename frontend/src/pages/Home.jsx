import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
// import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <Hero />
      <Features />
      {/* <Footer /> */}
    </div>
  );
}

export default Home;
