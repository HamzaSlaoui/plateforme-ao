import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ScrapingForm from "../components/ScrapingForm";
import MarcheTable from "../components/MarcheTable";

export default function Marches() {
  const [resultats, setResultats] = useState([]);

  const handleScrapingResults = (data) => {
    setResultats(data);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recherche de marchés publics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Remplis les champs ci-dessous pour lancer une recherche.
          </p>
        </div>

        <ScrapingForm onResults={handleScrapingResults} />

        {resultats.length > 0 && (
          <>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {resultats.length} marché{resultats.length > 1 ? "s" : ""}{" "}
                trouvé
              </div>
            </div>

            <MarcheTable marches={resultats} />
          </>
        )}
      </main>
    </div>
  );
}
