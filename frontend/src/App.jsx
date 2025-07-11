import React, { useState } from "react";
import Home from "./pages/Home";

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");

  const handleNavigate = (page) => {
    console.log("Navigation vers:", page);
    setCurrentPage(page);
  };

  return <Home onNavigate={handleNavigate} currentPage={currentPage} />;
};

export default App;
