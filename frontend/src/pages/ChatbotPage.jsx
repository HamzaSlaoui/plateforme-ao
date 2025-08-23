import React, { useState, useEffect, useRef } from "react";
import { Bot, Loader2, RotateCcw } from "lucide-react";
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

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [folderInfo, setFolderInfo] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("rag");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

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

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!dossierId) return;

      try {
        setIsLoadingHistory(true);
        const response = await api.get(`/chat/${dossierId}/history`);

        if (response.data.messages && response.data.messages.length > 0) {
          const formattedMessages = response.data.messages.map((msg) => ({
            id: msg.id,
            message: msg.content,
            isUser: msg.role === "user",
            timestamp: msg.created_at,
            sources: msg.sources || [],
          }));
          setMessages(formattedMessages);
        } else {
          setMessages([
            {
              id: "welcome",
              message:
                "Bonjour ! Je suis votre assistant IA pour ce dossier. Je peux répondre à vos questions sur les documents, les exigences, et vous aider dans votre préparation. Comment puis-je vous aider ?",
              isUser: false,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l'historique:", err);
        setMessages([
          {
            id: "welcome",
            message:
              "Bonjour ! Je suis votre assistant IA pour ce dossier. Comment puis-je vous aider ?",
            isUser: false,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchChatHistory();
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
      id: `temp-${Date.now()}`,
      message: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await api.post(`/chat/${dossierId}/message`, {
        question: currentMessage,
        mode,
      });

      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => !msg.id.startsWith("temp-"));
        return [
          ...withoutTemp,
          {
            id: response.data.user_message.id,
            message: response.data.user_message.content,
            isUser: true,
            timestamp: response.data.user_message.created_at,
          },
          {
            id: response.data.assistant_message.id,
            message: response.data.assistant_message.content,
            isUser: false,
            timestamp: response.data.assistant_message.created_at,
            sources: response.data.sources || [],
            mode: response.data.mode,
          },
        ];
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => !msg.id.startsWith("temp-"));
        return [
          ...withoutTemp,
          {
            id: `error-${Date.now()}`,
            message:
              "Désolé, une erreur s'est produite lors du traitement de votre message. Veuillez réessayer.",
            isUser: false,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (isLoading) return;

    try {
      await api.delete(`/chat/${dossierId}/session`);
      setMessages([
        {
          id: "welcome-new",
          message:
            "Nouvelle conversation commencée ! Comment puis-je vous aider avec ce dossier ?",
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Erreur lors de la suppression de la session:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDocumentSelect = (doc) => {
    setSelectedDoc(doc);
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isPanelVisible ? "mr-80" : "mr-0"
        }`}
      >
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
                    {folderInfo?.name || "Chargement..."} • Mode{" "}
                    {mode === "llm" ? "LLM natif" : "RAG"}
                    {messages.length > 1 && ` • ${messages.length} messages`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewConversation}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                title="Nouvelle conversation"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau</span>
              </button>

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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">
                Chargement de l'historique...
              </span>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

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

        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          isLoading={isLoading}
        />
      </div>

      <DocumentViewerPanel
        documents={folderInfo?.documents || []}
        onSelect={handleDocumentSelect}
        isVisible={isPanelVisible}
        onToggle={() => setIsPanelVisible(!isPanelVisible)}
      />

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
