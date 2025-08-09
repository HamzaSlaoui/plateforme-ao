// components/ChatMessage.jsx
import React from "react";
import { Bot, User, FileText } from "lucide-react";

const ChatMessage = ({ message }) => {
  return (
    <div className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-2xl rounded-2xl shadow-lg ${
          message.isUser
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
        }`}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {!message.isUser && (
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            
            <div className="flex-1">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.message}
              </p>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>Sources consultées:</span>
                  </p>
                  <div className="space-y-2">
                    {message.sources.map((src, idx) => {
                      const label = typeof src === "string" ? src : src.document;
                      return (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg"
                        >
                          <FileText className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {message.isUser && (
              <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <p className={`text-xs mt-3 opacity-70 ${
            message.isUser ? "text-blue-100 text-right" : "text-gray-500 dark:text-gray-400"
          }`}>
            {new Date(message.timestamp).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;