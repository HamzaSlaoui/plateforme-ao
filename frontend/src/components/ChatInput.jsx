// components/ChatInput.jsx
import React from "react";
import { Send, Loader2 } from "lucide-react";

const ChatInput = ({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  onKeyPress, 
  isLoading 
}) => {
  const suggestions = [
    "Quels sont les critères d'évaluation ?",
    "Date limite de soumission ?",
    "Documents requis ?",
    "Résumé du dossier",
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
      {/* Input Area */}
      <div className="flex space-x-4">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Posez votre question sur ce dossier..."
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
          disabled={isLoading}
        />
        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span className="hidden sm:inline font-medium">
            {isLoading ? "Envoi..." : "Envoyer"}
          </span>
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => setInputMessage(suggestion)}
            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatInput;