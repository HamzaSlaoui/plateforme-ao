import React from "react";

const STATUS_LABELS = {
  en_cours: "En cours",
  soumis: "Soumis",
  gagne: "Gagné",
  perdu: "Perdu",
};

const FolderInfo = ({ folder }) => {
  const infoItems = [
    {
      label: "Client",
      value: folder.client_name || "—",
    },
    {
      label: "Statut",
      value: STATUS_LABELS[folder.status] || folder.status,
    },
    {
      label: "Date de soumission",
      value: folder.submission_deadline
        ? new Date(folder.submission_deadline).toLocaleDateString("fr-FR")
        : "—",
    },
    {
      label: "Créé le",
      value: new Date(folder.created_at).toLocaleDateString("fr-FR"),
    },
    {
      label: "Nombre de documents",
      value: folder.document_count || 0,
    },
  ];

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-25 dark:from-gray-800 dark:to-gray-750 border border-blue-200 dark:border-gray-600 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-bold text-blue-800 dark:text-white mb-4">
          Informations sur le dossier
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-200">
          {infoItems.map((item, index) => (
            <div key={index}>
              <span className="font-semibold">{item.label} :</span>{" "}
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FolderInfo;
