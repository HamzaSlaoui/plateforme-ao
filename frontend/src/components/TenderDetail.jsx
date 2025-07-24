// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   Calendar,
//   FileText,
//   Download,
//   Clock,
//   User,
//   Building,
// } from "lucide-react";
// import Sidebar from "../components/Sidebar";
// import { useAuth } from "../hooks/useAuth";

// const TenderDetail = () => {
//   const { dossierId } = useParams();
//   const navigate = useNavigate();
//   const { api } = useAuth();

//   const [tender, setTender] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Appel de l'endpoint au chargement
//   useEffect(() => {
//     const fetchTender = async () => {
//       try {
//         const res = await api.get(`/tender-folders/${dossierId}`);
//         console.log("Détails du dossier:", res.data);
//         setTender(res.data);
//       } catch (e) {
//         console.error(e);
//         setError("Impossible de charger les détails du dossier.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTender();
//   }, [api, dossierId]);

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
//         <div className="flex flex-col items-center space-y-4">
//           <div className="relative">
//             <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//             <div
//               className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animate-reverse"
//               style={{ animationDelay: "0.15s" }}
//             />
//           </div>
//           <p className="text-slate-600 dark:text-slate-400 font-medium">
//             Chargement des détails...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
//         <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-red-200 dark:border-red-800">
//           <div className="text-center">
//             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
//               <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
//             </div>
//             <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
//               Erreur de chargement
//             </h3>
//             <p className="text-red-600 dark:text-red-400">{error}</p>
//             <button
//               onClick={() => navigate(-1)}
//               className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
//             >
//               Retour
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "active":
//         return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
//       case "pending":
//         return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
//       case "closed":
//         return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800";
//       default:
//         return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800";
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case "active":
//         return "Actif";
//       case "pending":
//         return "En attente";
//       case "closed":
//         return "Fermé";
//       default:
//         return status;
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
//       <Sidebar />

//       <main className="flex-1 overflow-auto">
//         <div className="max-w-4xl mx-auto p-6 space-y-8">
//           {/* Header Navigation */}
//           <div className="flex items-center justify-between">
//             <button
//               onClick={() => navigate(-1)}
//               className="group flex items-center space-x-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700"
//             >
//               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
//               <span className="font-medium">Retour</span>
//             </button>
//           </div>

//           {/* Main Content Card */}
//           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
//             {/* Header Section */}
//             <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-8 text-white">
//               <div className="absolute inset-0 bg-black/10" />
//               <div className="relative">
//                 <h1 className="text-3xl font-bold mb-4 leading-tight">
//                   {tender.title}
//                 </h1>
//                 <div className="flex flex-wrap items-center gap-4">
//                   <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
//                     <Calendar className="w-4 h-4" />
//                     <span className="text-sm font-medium">
//                       Échéance:{" "}
//                       {new Date(tender.deadline).toLocaleDateString("fr-FR")}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
//                     <Clock className="w-4 h-4" />
//                     <span className="text-sm font-medium">
//                       Créé le:{" "}
//                       {new Date(tender.createdAt).toLocaleDateString("fr-FR")}
//                     </span>
//                   </div>
//                   <div
//                     className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(
//                       tender.status
//                     )}`}
//                   >
//                     <div className="w-2 h-2 rounded-full bg-current mr-2" />
//                     {getStatusText(tender.status)}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Content Sections */}
//             <div className="p-8 space-y-8">
//               {/* Description Section */}
//               <section>
//                 <div className="flex items-center space-x-3 mb-4">
//                   <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
//                     <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
//                   </div>
//                   <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
//                     Description
//                   </h2>
//                 </div>
//                 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
//                   <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
//                     {tender.description}
//                   </p>
//                 </div>
//               </section>

//               {/* Attachments Section */}
//               <section>
//                 <div className="flex items-center space-x-3 mb-4">
//                   <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
//                     <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
//                   </div>
//                   <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
//                     Pièces jointes
//                   </h2>
//                   {tender.attachments && (
//                     <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium px-2 py-1 rounded-lg">
//                       {tender.attachments.length} fichier
//                       {tender.attachments.length > 1 ? "s" : ""}
//                     </span>
//                   )}
//                 </div>
//                 <div className="grid gap-3">
//                   {tender.attachments && tender.attachments.length > 0 ? (
//                     tender.attachments.map((attachment, idx) => (
//                       <div
//                         key={idx}
//                         className="group flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200"
//                       >
//                         <div className="flex items-center space-x-4">
//                           <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
//                             <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//                           </div>
//                           <div>
//                             <p className="font-medium text-slate-900 dark:text-white">
//                               {attachment.split("/").pop() || attachment}
//                             </p>
//                             <p className="text-sm text-slate-500 dark:text-slate-400">
//                               Document PDF
//                             </p>
//                           </div>
//                         </div>
//                         <button
//                           onClick={() => window.open(attachment, "_blank")}
//                           className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group-hover:scale-105"
//                         >
//                           <Download className="w-5 h-5" />
//                         </button>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center py-8 text-slate-500 dark:text-slate-400">
//                       <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
//                       <p>Aucune pièce jointe disponible</p>
//                     </div>
//                   )}
//                 </div>
//               </section>

//               {/* Information Grid */}
//               <section>
//                 <div className="flex items-center space-x-3 mb-4">
//                   <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
//                     <Building className="w-5 h-5 text-amber-600 dark:text-amber-400" />
//                   </div>
//                   <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
//                     Informations complémentaires
//                   </h2>
//                 </div>
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
//                     <div className="flex items-center space-x-3 mb-3">
//                       <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//                       <span className="font-medium text-slate-600 dark:text-slate-400">
//                         Date de création
//                       </span>
//                     </div>
//                     <p className="text-xl font-semibold text-slate-900 dark:text-white">
//                       {new Date(tender.createdAt).toLocaleDateString("fr-FR", {
//                         weekday: "long",
//                         year: "numeric",
//                         month: "long",
//                         day: "numeric",
//                       })}
//                     </p>
//                   </div>
//                   <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
//                     <div className="flex items-center space-x-3 mb-3">
//                       <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
//                       <span className="font-medium text-slate-600 dark:text-slate-400">
//                         Statut actuel
//                       </span>
//                     </div>
//                     <div className="flex items-center space-x-3">
//                       <div
//                         className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold border ${getStatusColor(
//                           tender.status
//                         )}`}
//                       >
//                         <div className="w-3 h-3 rounded-full bg-current mr-2 animate-pulse" />
//                         {getStatusText(tender.status)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default TenderDetail;
