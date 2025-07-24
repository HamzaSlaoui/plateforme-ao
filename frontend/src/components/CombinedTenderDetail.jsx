// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   Calendar,
//   FileText,
//   Download,
//   Bot,
//   User,
//   Send,
//   Loader2,
//   AlertCircle,
//   Clock,
//   GripVertical,
//   CheckCircle,
// } from "lucide-react";
// import Sidebar from "../components/Sidebar";
// import { useAuth } from "../hooks/useAuth";

// const CombinedTenderDetail = () => {
//   const { dossierId } = useParams();
//   const navigate = useNavigate();
//   const { api } = useAuth();

//   // Resize functionality
//   const [rightPanelWidth, setRightPanelWidth] = useState(50); // percentage
//   const [isResizing, setIsResizing] = useState(false);
//   const resizeRef = useRef(null);

//   // Navigation helpers
//   const onBack = () => navigate(-1);
//   const onNavigate = (to) => {
//     if (to === "dashboard") navigate("/dashboard");
//     else navigate(to);
//   };

//   const [tender, setTender] = useState(null);
//   const [loadingTender, setLoadingTender] = useState(true);
//   const [errorTender, setErrorTender] = useState("");
//   const [daysUntilDeadline, setDaysUntilDeadline] = useState(0);

//   const [messages, setMessages] = useState([
//     {
//       id: "1",
//       message:
//         "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider sur ce dossier ?",
//       isUser: false,
//       timestamp: new Date().toISOString(),
//     },
//   ]);
//   const [inputMessage, setInputMessage] = useState("");
//   const [loadingChat, setLoadingChat] = useState(false);
//   const [errorChat, setErrorChat] = useState("");

//   const messagesEndRef = useRef(null);
//   const scrollToBottom = () =>
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

//   // Mouse resize handlers
//   const handleMouseDown = (e) => {
//     setIsResizing(true);
//     e.preventDefault();
//   };

//   const handleMouseMove = (e) => {
//     if (!isResizing) return;

//     const containerRect =
//       resizeRef.current?.parentElement?.getBoundingClientRect();
//     if (!containerRect) return;

//     const newWidth =
//       ((containerRect.right - e.clientX) / containerRect.width) * 100;
//     const clampedWidth = Math.min(Math.max(newWidth, 25), 75); // Min 25%, Max 75%
//     setRightPanelWidth(clampedWidth);
//   };

//   const handleMouseUp = () => {
//     setIsResizing(false);
//   };

//   useEffect(() => {
//     if (isResizing) {
//       document.addEventListener("mousemove", handleMouseMove);
//       document.addEventListener("mouseup", handleMouseUp);
//       return () => {
//         document.removeEventListener("mousemove", handleMouseMove);
//         document.removeEventListener("mouseup", handleMouseUp);
//       };
//     }
//   }, [isResizing]);

//   // Fetch tender details
//   useEffect(() => {
//     const fetchTender = async () => {
//       try {
//         const res = await api.get(`/tender-folders/${dossierId}`);
//         setTender(res.data);
//       } catch (err) {
//         console.error(err);
//         setErrorTender("Impossible de charger les détails du dossier.");
//       } finally {
//         setLoadingTender(false);
//       }
//     };
//     fetchTender();
//   }, [api, dossierId]);

//   // Compute days until deadline
//   useEffect(() => {
//     if (tender && tender.deadline) {
//       const diffMs = new Date(tender.deadline).getTime() - new Date().getTime();
//       setDaysUntilDeadline(Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
//     }
//   }, [tender]);

//   // Helpers for status display
//   const getStatusLabel = (status) => {
//     switch (status) {
//       case "en_cours":
//         return "En cours";
//       case "soumis":
//         return "Soumis";
//       case "gagne":
//         return "Gagné";
//       case "perdu":
//         return "Perdu";
//       default:
//         return status;
//     }
//   };
//   const getStatusColor = (status) => {
//     switch (status) {
//       case "en_cours":
//         return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400";
//       case "soumis":
//         return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400";
//       case "gagne":
//         return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400";
//       case "perdu":
//         return "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400";
//       default:
//         return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400";
//     }
//   };
//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "en_cours":
//         return <Clock className="w-4 h-4" />;
//       case "soumis":
//         return <Clock className="w-4 h-4" />;
//       case "gagne":
//         return <CheckCircle className="w-4 h-4" />;
//       case "perdu":
//         return <XCircle className="w-4 h-4" />;
//       default:
//         return <Clock className="w-4 h-4" />;
//     }
//   };

//   // Handle chat send
//   const handleSend = async () => {
//     if (!inputMessage.trim()) return;
//     const userMsg = {
//       id: Date.now().toString(),
//       message: inputMessage,
//       isUser: true,
//       timestamp: new Date().toISOString(),
//     };
//     setMessages((prev) => [...prev, userMsg]);
//     setInputMessage("");
//     setLoadingChat(true);
//     setErrorChat("");
//     try {
//       const res = await api.post("/chatbot/chat", {
//         message: userMsg.message,
//         folder_id: dossierId,
//       });
//       const aiMsg = {
//         id: (Date.now() + 1).toString(),
//         message: res.data.response,
//         isUser: false,
//         timestamp: new Date().toISOString(),
//         sources: res.data.sources || [],
//       };
//       setMessages((prev) => [...prev, aiMsg]);
//     } catch (e) {
//       console.error(e);
//       setErrorChat("Erreur lors de l'envoi du message.");
//     } finally {
//       setLoadingChat(false);
//     }
//   };

//   if (loadingTender)
//     return (
//       <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
//         <Loader2 className="animate-spin w-12 h-12 text-gray-400" />
//       </div>
//     );

//   if (errorTender)
//     return (
//       <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
//         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
//           <p className="text-red-600 dark:text-red-400">{errorTender}</p>
//           <button
//             onClick={onBack}
//             className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
//           >
//             Retour
//           </button>
//         </div>
//       </div>
//     );

//   return (
//     <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
//       <Sidebar />
//       <div className="flex-1 flex overflow-hidden" ref={resizeRef}>
//         {/* Left Panel - Main Detail */}
//         <div
//           className="flex overflow-hidden bg-white dark:bg-gray-800"
//           style={{ width: `${100 - rightPanelWidth}%` }}
//         >
//           <div className="flex-1 overflow-auto">
//             <div className="p-8">
//               {/* Header */}
//               <div className="mb-8">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//                       {tender.title}
//                     </h1>
//                     <div className="flex items-center space-x-4 mb-4">
//                       <span
//                         className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(
//                           tender.status
//                         )}`}
//                       >
//                         {getStatusIcon(tender.status)}
//                         <span>{getStatusLabel(tender.status)}</span>
//                       </span>
//                       <span className="text-sm text-gray-600 dark:text-gray-400">
//                         Créé le{" "}
//                         {new Date(tender.createdAt).toLocaleDateString("fr-FR")}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <Calendar className="w-5 h-5 text-blue-600" />
//                         <span className="font-medium text-gray-900 dark:text-white">
//                           Échéance
//                         </span>
//                       </div>
//                       <p className="text-lg font-bold text-gray-900 dark:text-white">
//                         {new Date(tender.deadline).toLocaleDateString("fr-FR")}
//                       </p>
//                       <p
//                         className={`text-sm ${
//                           daysUntilDeadline <= 7
//                             ? "text-red-600"
//                             : "text-gray-600 dark:text-gray-400"
//                         }`}
//                       >
//                         {daysUntilDeadline > 0
//                           ? `${daysUntilDeadline} jours restants`
//                           : "Échéance dépassée"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               {/* Description */}
//               <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm p-6 mb-6">
//                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                   Description du projet
//                 </h2>
//                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
//                   {tender.description}
//                 </p>
//               </div>
//               {/* Attachments */}
//               <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//                   Pièces jointes ({tender.attachments.length})
//                 </h3>
//                 <div className="space-y-3">
//                   {tender.attachments.map((attachment, idx) => (
//                     <div
//                       key={idx}
//                       className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg"
//                     >
//                       <div className="flex items-center space-x-3">
//                         <FileText className="w-5 h-5 text-blue-600" />
//                         <span className="text-gray-900 dark:text-white font-medium">
//                           {attachment}
//                         </span>
//                       </div>
//                       <button
//                         onClick={() => window.open(attachment, "_blank")}
//                         className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
//                       >
//                         <Download className="w-4 h-4" />
//                         <span>Télécharger</span>
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Resize Handle */}
//         <div
//           className="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize relative group transition-colors"
//           onMouseDown={handleMouseDown}
//         >
//           <div className="absolute inset-y-0 -inset-x-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//             <GripVertical className="w-4 h-4 text-white" />
//           </div>
//         </div>

//         {/* Right Panel - Chat */}
//         <div
//           className="bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden"
//           style={{ width: `${rightPanelWidth}%` }}
//         >
//           <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
//             <div className="flex items-center space-x-2">
//               <Bot className="w-6 h-6 text-blue-600" />
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
//                 Assistant IA
//               </h2>
//             </div>
//           </div>
//           <div className="flex-1 overflow-y-auto p-4 space-y-4">
//             {messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`flex ${
//                   msg.isUser ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 <div
//                   className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
//                     msg.isUser
//                       ? "bg-blue-600 text-white"
//                       : "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
//                   }`}
//                 >
//                   <div className="flex items-start space-x-2">
//                     {!msg.isUser && (
//                       <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
//                     )}
//                     {msg.isUser && <User className="w-4 h-4 mt-0.5" />}
//                     <p className="text-sm">{msg.message}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {errorChat && <p className="text-red-600 text-sm">{errorChat}</p>}
//             <div ref={messagesEndRef} />
//           </div>
//           <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
//             <div className="flex space-x-2">
//               <input
//                 type="text"
//                 value={inputMessage}
//                 onChange={(e) => setInputMessage(e.target.value)}
//                 onKeyPress={(e) => e.key === "Enter" && handleSend()}
//                 placeholder="Posez votre question sur ce dossier..."
//                 className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
//                 disabled={loadingChat}
//               />
//               <button
//                 onClick={handleSend}
//                 disabled={!inputMessage.trim() || loadingChat}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//               >
//                 {loadingChat ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <Send className="w-4 h-4" />
//                 )}
//                 <span>{loadingChat ? "Envoi..." : "Envoyer"}</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CombinedTenderDetail;
