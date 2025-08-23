import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ScrapingForm from "../components/ScrapingForm";
import MarcheTable from "../components/MarcheTable";

export default function Marches() {
  const [resultats, setResultats] = useState(null);

  const handleScrapingResults = (data) => {
    console.log("📥 Données reçues dans handleScrapingResults:", data);
    setResultats(data);
  };

  // Déterminer s'il y a des marchés à afficher
  const hasMarches = resultats && Array.isArray(resultats) && resultats.length > 0;

  console.log("📊 État actuel - resultats:", resultats, "hasMarches:", hasMarches);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recherche de marchés publics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Remplis les champs ci-dessous pour lancer une recherche avec pagination.
          </p>
        </div>

        <ScrapingForm onResults={handleScrapingResults} />

        {hasMarches && (
          <>
            <MarcheTable marches={resultats} />
          </>
        )}
      </main>
    </div>
  );
}

