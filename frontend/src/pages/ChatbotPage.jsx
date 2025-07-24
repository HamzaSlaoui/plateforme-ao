import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, ArrowLeft, FileText, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";

const ChatbotPage = () => {
  const { dossierId } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      message:
        "Bonjour ! Je suis votre assistant IA pour ce dossier. Je peux répondre à vos questions sur les documents, les exigences, et vous aider dans votre préparation. Comment puis-je vous aider ?",
      isUser: false,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [folderInfo, setFolderInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFolderInfo = async () => {
      try {
        const response = await api.get(`/tender-folders/${dossierId}`);
        setFolderInfo(response.data);
      } catch (err) {
        console.error("Erreur lors de la récupération du dossier:", err);
        setError("Impossible de charger les informations du dossier");
      }
    };

    if (dossierId) {
      fetchFolderInfo();
    }
  }, [dossierId, api]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/chatbot/chat", {
        message: inputMessage,
        folder_id: dossierId,
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: response.data.response,
        isUser: false,
        timestamp: new Date().toISOString(),
        sources: response.data.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        message:
          "Désolé, une erreur s'est produite lors du traitement de votre message. Veuillez réessayer.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Bot className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Erreur
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900 dark:text-white">
                    Assistant IA - {folderInfo?.name || "Chargement..."}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chatbot RAG pour ce dossier
                  </p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {folderInfo && (
                <span>
                  {folderInfo.document_count} document
                  {folderInfo.document_count !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-2xl p-4 rounded-lg ${
                  message.isUser
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                }
                `}
              >
                <div className="flex items-start space-x-3">
                  {!message.isUser && (
                    <Bot className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.message}
                    </p>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Sources consultées:
                        </p>
                        <div className="space-y-1">
                          {message.sources.map((source, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 text-xs"
                            >
                              <FileText className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {source}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p
                      className={`text-xs mt-2 opacity-70 ${
                        message.isUser
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.isUser && (
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      L'assistant réfléchit...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question sur ce dossier..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {isLoading ? "Envoi..." : "Envoyer"}
              </span>
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() =>
                setInputMessage(
                  "Quels sont les critères d'évaluation de cet appel d'offres ?"
                )
              }
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Critères d'évaluation
            </button>
            <button
              onClick={() =>
                setInputMessage("Quelle est la date limite de soumission ?")
              }
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Date limite
            </button>
            <button
              onClick={() =>
                setInputMessage("Quels documents dois-je fournir ?")
              }
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Documents requis
            </button>
            <button
              onClick={() =>
                setInputMessage("Résume-moi les points clés de ce dossier")
              }
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Points clés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
