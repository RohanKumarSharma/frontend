"use client";

import {
  Image,
  Paperclip,
  Send,
  Smile,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { sendMessage } from "@/services/chatApi";
import { getSocket } from "@/socket/socket";

import useChatStore from "@/store/chatStore";

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😢",
  "😭",
  "😡",
  "👍",
  "👏",
  "🙏",
  "❤️",
  "🔥",
  "🎉",
  "💯",
  "✨",
  "🙌",
  "👌",
  "👀",
  "🚀",
  "💀",
  "🤝",
  "😴",
  "❤️‍🔥",
];

export default function MessageInput({
  conversationId,
  replyingTo,
  onCancelReply,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);

  // Zustand
  const addMessage = useChatStore(
    (state) => state.addMessage
  );

  // ======================================================
  // FOCUS INPUT WHEN REPLY IS SELECTED
  // ======================================================

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  // ======================================================
  // CLEANUP
  // ======================================================

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ======================================================
  // CLOSE EMOJI PICKER
  // ======================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [showEmojiPicker]);

  // ======================================================
  // TYPING
  // ======================================================

  const handleTyping = (e) => {
    const value = e.target.value;

    setMessage(value);

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    // Backend expects conversationId directly
    socket.emit(
      "typing:start",
      conversationId
    );

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket.connected) {
        // Backend expects conversationId directly
        socket.emit(
          "typing:stop",
          conversationId
        );
      }
    }, 1000);
  };

  // ======================================================
  // SEND MESSAGE
  // ======================================================

  const handleSendMessage = async () => {
    const text = message.trim();

    if (!text || sending) {
      return;
    }

    try {
      setSending(true);

      const socket = getSocket();

      if (!socket.connected) {
        socket.connect();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Stop typing
      socket.emit(
        "typing:stop",
        conversationId
      );

      const replyToId =
        replyingTo?._id || null;

      console.log("Sending message:", {
        conversationId,
        text,
        replyTo: replyToId,
      });

      // Send to backend
      const response = await sendMessage(
        conversationId,
        text,
        replyToId
      );

      console.log(
        "Message sent successfully:",
        response
      );

      // ==================================================
      // IMPORTANT
      // Add returned message immediately to UI
      // ==================================================

      const newMessage = response?.message;

      if (newMessage) {
        addMessage(newMessage);
      }

      // Clear input
      setMessage("");

      // Close emoji picker
      setShowEmojiPicker(false);

      // Exit reply mode
      onCancelReply?.();
    } catch (error) {
      console.error(
        "Send message error:",
        error.response?.data ||
          error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  // ======================================================
  // EMOJI
  // ======================================================

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => `${prev}${emoji}`);

    setShowEmojiPicker(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // ======================================================
  // ENTER
  // ======================================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      handleSendMessage();
    }
  };

  // ======================================================
  // REPLY USER
  // ======================================================

  const replyUserName =
    replyingTo?.senderInfo?.name ||
    replyingTo?.sender?.name ||
    "User";

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="message-input-area">
      {/* REPLY PREVIEW */}

      {replyingTo && (
        <div className="replying-to">
          <div className="replying-to-content">
            <span>
              Replying to{" "}
              <strong>
                {replyUserName}
              </strong>
            </span>

            <p>
              {replyingTo.text}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* EMOJI PICKER */}

      {showEmojiPicker && (
        <div
          className="emoji-picker"
          ref={emojiPickerRef}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() =>
                handleEmojiClick(emoji)
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* INPUT */}

      <div className="message-input">
        <button
          type="button"
          disabled={sending}
          aria-label="Attach file"
        >
          <Paperclip size={16} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={
            replyingTo
              ? "Write a reply..."
              : "Write a message..."
          }
          disabled={sending}
          maxLength={2000}
        />

        <button
          type="button"
          disabled={sending}
          aria-label="Add image"
        >
          <Image size={16} />
        </button>

        <button
          type="button"
          disabled={sending}
          aria-label="Add emoji"
          onClick={() =>
            setShowEmojiPicker(
              (prev) => !prev
            )
          }
        >
          <Smile size={16} />
        </button>

        <button
          type="button"
          className="send-button"
          onClick={handleSendMessage}
          disabled={
            sending || !message.trim()
          }
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>

      {/* <p>Press Enter to send</p> */}
    </div>
  );
}