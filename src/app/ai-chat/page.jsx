"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  Trash2,
  User,
  Paperclip,
  FileText,
  X,
  Upload,
} from "lucide-react";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function AIChatPage() {
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState(null);

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ======================================================
  // LOAD CHAT HISTORY
  // ======================================================

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoadingHistory(true);

        const response = await fetch(`${API_URL}/ai-chat`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load AI chat");
        }

        if (Array.isArray(data?.messages)) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Failed to load AI chat:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [API_URL]);

  // ======================================================
  // AUTO SCROLL
  // ======================================================

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;

    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  };

  useEffect(() => {
    if (!loadingHistory) {
      scrollToBottom("smooth");
    }
  }, [messages, loading, loadingHistory, selectedFile]);

  // ======================================================
  // TEXTAREA
  // ======================================================

  const handleInputChange = (e) => {
    setInput(e.target.value);

    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  };

  // ======================================================
  // SEND MESSAGE
  // ======================================================

  const handleSend = async (e) => {
    e?.preventDefault();

    const text = input.trim();

    if (!text || loading || loadingHistory) {
      return;
    }

    const userMessage = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setTimeout(() => {
      scrollToBottom("smooth");
    }, 50);

    try {
      const response = await fetch(`${API_URL}/ai-chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "AI request failed");
      }

      const assistantMessage = {
        _id: data?.savedMessage?._id || undefined,

        role: "assistant",

        content: data?.message || "I couldn't generate a response.",

        createdAt: data?.savedMessage?.createdAt || new Date().toISOString(),

        rag: data?.rag || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CLEAR CHAT
  // ======================================================

  const handleClearChat = async () => {
    if (messages.length === 0 || loading || loadingHistory) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/ai-chat`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to clear AI chat");
      }

      setMessages([]);
    } catch (error) {
      console.error("Clear AI Chat Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // FILE SELECT
  // ======================================================

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const isPDF = file.type === "application/pdf";

    const isTXT = file.type === "text/plain";

    if (!isPDF && !isTXT) {
      alert("Only PDF and TXT files are supported.");

      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");

      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  // ======================================================
  // UPLOAD DOCUMENT
  // ======================================================

  const handleUploadDocument = async () => {
    if (!selectedFile || uploadingFile) {
      return;
    }

    try {
      setUploadingFile(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/rag/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to upload document");
      }

      setUploadedDocument({
        fileName: data?.document?.fileName || selectedFile.name,

        fileType:
          data?.document?.fileType ||
          (selectedFile.type === "application/pdf" ? "pdf" : "txt"),

        chunks: data?.document?.chunks || 0,
      });

      // 2 seconds ke baad green success bar hata do
      setTimeout(() => {
        setUploadedDocument(null);
      }, 2000);

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("RAG Upload Error:", error);

      alert(error.message || "Failed to upload document");
    } finally {
      setUploadingFile(false);
    }
  };

  // ======================================================
  // REMOVE FILE
  // ======================================================

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ======================================================
  // ENTER KEY
  // ======================================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ======================================================
  // SUGGESTION
  // ======================================================

  const useSuggestion = (text) => {
    setInput(text);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // ======================================================
  // FILE PICKER
  // ======================================================

  const openFilePicker = () => {
    if (loading || loadingHistory || uploadingFile) {
      return;
    }

    fileInputRef.current?.click();
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <main className="ai-chat-page">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="ai-chat-header">
        <div className="ai-chat-header-left">
          <button
            type="button"
            className="ai-chat-back-button"
            onClick={() => router.push("/chat")}
            aria-label="Back to chat"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="ai-chat-avatar">
            <Sparkles size={21} />
          </div>

          <div className="ai-chat-title">
            <div className="ai-chat-title-row">
              <h1>NEXUS AI</h1>

              <span className="ai-online-dot" />
            </div>

            <span>AI Assistant • RAG enabled</span>
          </div>
        </div>

        <button
          type="button"
          className="ai-chat-clear-button"
          onClick={handleClearChat}
          disabled={messages.length === 0 || loading || loadingHistory}
          title="Clear chat"
        >
          <Trash2 size={17} />
          <span>Clear</span>
        </button>
      </header>

      {/* ==================================================
          CHAT AREA
      ================================================== */}

      <section ref={messagesContainerRef} className="ai-chat-messages">
        {loadingHistory ? (
          <div className="ai-chat-loading">
            <div className="ai-loading-orb">
              <Bot size={26} />
            </div>

            <h2>Loading your AI chat</h2>

            <p>Getting your previous conversation...</p>

            <div className="ai-loading-bar">
              <span />
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* ==================================================
             EMPTY STATE
          ================================================== */

          <div className="ai-chat-empty">
            <div className="ai-empty-glow" />

            <div className="ai-chat-empty-icon">
              <Sparkles size={30} />
            </div>

            <div className="ai-empty-badge">
              <span />
              NEXUS INTELLIGENCE
            </div>

            <h2>
              What can I help you
              <br />
              <span>build today?</span>
            </h2>

            <p>
              Ask questions, solve coding problems, learn DSA, or upload a
              document and chat with your own knowledge.
            </p>

            {/* DOCUMENT CARD */}

            <div className="ai-upload-card">
              <div className="ai-upload-top">
                <div className="ai-upload-icon">
                  <FileText size={21} />
                </div>

                <div>
                  <h3>Chat with your document</h3>

                  <p>Upload PDF or TXT • Max 10MB</p>
                </div>
              </div>

              {!selectedFile ? (
                <button
                  type="button"
                  className="ai-upload-label"
                  onClick={openFilePicker}
                >
                  <Paperclip size={17} />
                  <span>Choose PDF or TXT</span>
                </button>
              ) : (
                <SelectedFile
                  file={selectedFile}
                  uploading={uploadingFile}
                  onUpload={handleUploadDocument}
                  onRemove={removeSelectedFile}
                />
              )}

              {uploadedDocument && (
                <UploadedDocument document={uploadedDocument} />
              )}
            </div>

            {/* SUGGESTIONS */}

            <div className="ai-chat-suggestions">
              <button
                type="button"
                onClick={() =>
                  useSuggestion("Explain JavaScript closures in simple words")
                }
              >
                <span>⌘</span>
                Explain JavaScript
              </button>

              <button
                type="button"
                onClick={() =>
                  useSuggestion("Give me a DSA problem to practice")
                }
              >
                <span>◈</span>
                Give me a DSA problem
              </button>

              <button
                type="button"
                onClick={() =>
                  useSuggestion("Help me improve my coding skills")
                }
              >
                <span>✦</span>
                Improve my coding
              </button>
            </div>
          </div>
        ) : (
          /* ==================================================
             MESSAGES
          ================================================== */

          <div className="ai-chat-message-list">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              const sources = message?.rag?.sources || [];

              return (
                <div
                  key={message._id || `${message.role}-${index}`}
                  className={`ai-message ${
                    isUser ? "ai-message-user" : "ai-message-assistant"
                  }`}
                >
                  <div className="ai-message-avatar">
                    {isUser ? <User size={16} /> : <Sparkles size={16} />}
                  </div>

                  <div className="ai-message-content">
                    <div className="ai-message-meta">
                      <span className="ai-message-name">
                        {isUser ? "You" : "NEXUS AI"}
                      </span>

                      {!isUser && <span className="ai-message-label">AI</span>}
                    </div>

                    <div className="ai-message-bubble">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* TYPING */}

            {loading && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-avatar">
                  <Sparkles size={16} />
                </div>

                <div className="ai-message-content">
                  <div className="ai-message-meta">
                    <span className="ai-message-name">NEXUS AI</span>
                  </div>

                  <div className="ai-message-bubble ai-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ==================================================
          SELECTED FILE BAR
          Shows even when chat already has messages
      ================================================== */}

      {messages.length > 0 && selectedFile && (
        <div className="ai-selected-file-floating">
          <SelectedFile
            file={selectedFile}
            uploading={uploadingFile}
            onUpload={handleUploadDocument}
            onRemove={removeSelectedFile}
          />
        </div>
      )}

      {/* ==================================================
          UPLOADED DOCUMENT STATUS
      ================================================== */}

      {messages.length > 0 && uploadedDocument && (
        <div className="ai-uploaded-floating">
          <UploadedDocument document={uploadedDocument} />
        </div>
      )}

      {/* ==================================================
          INPUT
      ================================================== */}

      <div className="ai-chat-input-wrapper">
        <form className="ai-chat-input-area" onSubmit={handleSend}>
          <button
            type="button"
            className="ai-attach-button"
            onClick={openFilePicker}
            title="Upload PDF or TXT"
            disabled={loading || loadingHistory || uploadingFile}
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask NEXUS AI anything..."
            rows={1}
            disabled={loading || loadingHistory}
          />

          <button
            type="submit"
            className="ai-send-button"
            disabled={!input.trim() || loading || loadingHistory}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>

        <div className="ai-input-footer">
          <span>
            <Sparkles size={11} />
            NEXUS AI can make mistakes
          </span>

          <span>Enter to send • Shift + Enter for new line</span>
        </div>
      </div>

      {/* ==================================================
          SINGLE GLOBAL FILE INPUT
      ================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        onChange={handleFileSelect}
        style={{
          display: "none",
        }}
      />
    </main>
  );
}

/* =========================================================
   SELECTED FILE COMPONENT
   ========================================================= */

function SelectedFile({ file, uploading, onUpload, onRemove }) {
  return (
    <div className="ai-selected-file">
      <div className="ai-selected-file-info">
        <div className="ai-file-icon">
          <FileText size={18} />
        </div>

        <div>
          <strong>{file.name}</strong>

          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>

      <div className="ai-file-actions">
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          className="ai-upload-btn"
        >
          <Upload size={15} />

          {uploading ? "Processing..." : "Process"}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="ai-remove-file"
          disabled={uploading}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   UPLOADED DOCUMENT COMPONENT
   ========================================================= */

function UploadedDocument({ document }) {
  return (
    <div className="ai-upload-success">
      <div className="ai-success-check">✓</div>

      <div>
        <strong>{document.fileName}</strong>

        <span>Ready for RAG • {document.chunks} chunks indexed</span>
      </div>
    </div>
  );
}
