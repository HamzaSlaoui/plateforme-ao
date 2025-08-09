// pages/ChatbotPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar";
import DocumentViewerPanel from "../components/DocumentViewerPanel";
import DocumentPreview from "../components/DocumentPreview";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";

const ChatbotPage = () => {
  const { dossierId } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // États principaux
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
  const [mode, setMode] = useState("rag");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Chargement des données du dossier
  useEffect(() => {
    const fetchFolderInfo = async () => {
      try {
        const response = await api.get(`/tender-folders/${dossierId}`);
        setFolderInfo(response.data);
      } catch (err) {
        setError("Impossible de charger les informations du dossier");
      }
    };

    if (dossierId) {
      fetchFolderInfo();
    }
  }, [dossierId, api]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Envoi de message
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
        question: inputMessage,
        dossier_id: dossierId,
        mode,
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: response.data.reponse,
        isUser: false,
        timestamp: new Date().toISOString(),
        sources: response.data.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
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

  // Gestion des touches
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Sélection de document
  const handleDocumentSelect = (doc) => {
    setSelectedDoc(doc);
  };

  // Affichage d'erreur
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isPanelVisible ? 'mr-80' : 'mr-0'}`}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-gray-900 dark:text-white">
                    Assistant IA
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {folderInfo?.name || "Chargement..."} • Mode {mode === "llm" ? "LLM natif" : "RAG"}
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mode :
                </label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="rag">RAG</option>
                  <option value="llm">LLM natif</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
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

        {/* Chat Input */}
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          isLoading={isLoading}
        />
      </div>

      {/* Document Viewer Panel */}
      <DocumentViewerPanel
        documents={folderInfo?.documents || []}
        onSelect={handleDocumentSelect}
        isVisible={isPanelVisible}
        onToggle={() => setIsPanelVisible(!isPanelVisible)}
      />

      {/* Document Preview Modal */}
      {selectedDoc && (
        <DocumentPreview
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
};

export default ChatbotPage;