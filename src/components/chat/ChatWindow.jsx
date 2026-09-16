"use client";

import {
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import Message from "./Message";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

import {
  getMessages,
  markMessagesRead as markMessagesReadApi,
} from "@/services/chatApi";

import useChatStore from "@/store/chatStore";

import { getSocket, connectSocket } from "@/socket/socket";

export default function ChatWindow({ chat, onBack }) {
  // =========================
  // ZUSTAND
  // =========================

  const currentUser = useChatStore((state) => state.currentUser);

  const messages = useChatStore((state) => state.messages);

  const setMessages = useChatStore((state) => state.setMessages);

  const addMessage = useChatStore((state) => state.addMessage);

  const markMessagesAsRead = useChatStore(
    (state) => state.markMessagesAsRead
  );

  const onlineUsers = useChatStore(
    (state) => state.onlineUsers
  );

  const lastSeenUsers = useChatStore(
    (state) => state.lastSeenUsers || {}
  );

  // =========================
  // LOCAL STATE
  // =========================

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [isTyping, setIsTyping] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);

  // =========================
  // AUTO SCROLL
  // =========================

  const messagesEndRef = useRef(null);

  // =========================
  // OTHER USER
  // =========================

  const otherUser = useMemo(() => {
    if (!chat?.participants) {
      return null;
    }

    return chat.participants.find(
      (user) => user._id !== currentUser?._id
    );
  }, [chat, currentUser]);

  // =========================
  // ONLINE STATUS
  // =========================

  const isOnline = useMemo(() => {
    if (!otherUser?._id) {
      return false;
    }

    return onlineUsers.includes(otherUser._id);
  }, [onlineUsers, otherUser]);

  // =========================
  // FETCH MESSAGES
  // =========================

  useEffect(() => {
    if (!chat?._id) {
      setMessages([]);
      setReplyingTo(null);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError("");

        setReplyingTo(null);

        const data = await getMessages(chat._id);

        console.log("Messages from backend:", data);

        setMessages(data.messages || []);
      } catch (error) {
        console.error(
          "Failed to fetch messages:",
          error.response?.data || error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load messages."
        );

        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [chat?._id, setMessages]);

  // =========================
  // AUTO SCROLL
  // =========================

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages.length, isTyping, chat?._id]);

  // =========================
  // SOCKET.IO
  // =========================

  useEffect(() => {
    if (!chat?._id || !currentUser?._id) {
      return;
    }

    const socket = getSocket();
    const conversationId = chat._id;

    // =========================
    // JOIN CONVERSATION
    // =========================

    const joinConversation = () => {
      if (!socket.connected) {
        return;
      }

      socket.emit(
        "conversation:join",
        conversationId
      );

      console.log(
        "Joined conversation:",
        conversationId
      );
    };

    // IMPORTANT:
    // Listener pehle register karo
    socket.on("connect", joinConversation);

    // Socket agar already connected hai
    if (socket.connected) {
      joinConversation();
    } else {
      // Socket connected nahi hai
      connectSocket();
    }

    // =========================
    // REAL-TIME MESSAGE
    // =========================

    const handleMessageReceive = async (message) => {
      console.log(
        "Real-time message received:",
        message
      );

      const messageConversationId =
        typeof message.conversation === "string"
          ? message.conversation
          : message.conversation?._id;

      if (messageConversationId !== conversationId) {
        return;
      }

      // Add message to UI
      addMessage(message);

      // =========================
      // CHECK MESSAGE SENDER
      // =========================

      const messageSenderId =
        typeof message.sender === "string"
          ? message.sender
          : message.sender?._id;

      const isFromOtherUser =
        messageSenderId !== currentUser._id;

      // =========================
      // MARK INCOMING MESSAGE READ
      // =========================

      if (isFromOtherUser) {
        console.log(
          "Marking incoming message as read:",
          message._id
        );

        markMessagesAsRead(
          conversationId,
          currentUser._id
        );

        try {
          await markMessagesReadApi(
            conversationId
          );

          console.log(
            "Incoming message marked as read in database"
          );
        } catch (error) {
          console.error(
            "Failed to mark incoming message as read:",
            error.response?.data || error.message
          );
        }

        if (socket.connected) {
          socket.emit(
            "message:read",
            conversationId
          );

          console.log(
            "Read receipt sent:",
            conversationId
          );
        }
      }
    };

    // =========================
    // TYPING START
    // =========================

    const handleTypingStart = (data) => {
      const typingConversationId =
        data?.conversationId;

      const userId = data?.userId;

      if (typingConversationId !== conversationId) {
        return;
      }

      if (userId === currentUser._id) {
        return;
      }

      console.log("User is typing:", userId);

      setIsTyping(true);
    };

    // =========================
    // TYPING STOP
    // =========================

    const handleTypingStop = (data) => {
      const typingConversationId =
        data?.conversationId;

      const userId = data?.userId;

      if (typingConversationId !== conversationId) {
        return;
      }

      if (userId === currentUser._id) {
        return;
      }

      console.log(
        "User stopped typing:",
        userId
      );

      setIsTyping(false);
    };

    // =========================
    // READ RECEIPT
    // =========================

    const handleMessageRead = (data) => {
      const readConversationId =
        data?.conversationId;

      const readerUserId = data?.userId;

      if (readConversationId !== conversationId) {
        return;
      }

      if (!readerUserId) {
        return;
      }

      markMessagesAsRead(
        conversationId,
        readerUserId
      );

      console.log(
        "Messages read by:",
        readerUserId
      );
    };

    // =========================
    // MESSAGE REACTION
    // =========================

    const handleMessageReaction = (data) => {
      const reactionConversationId =
        data?.conversationId;

      const messageId = data?.messageId;

      const reactions = data?.reactions || [];

      if (
        reactionConversationId !== conversationId
      ) {
        return;
      }

      if (!messageId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message._id === messageId
            ? {
                ...message,
                reactions,
              }
            : message
        )
      );

      console.log(
        "Message reaction updated:",
        messageId,
        reactions
      );
    };

    // =========================
    // SOCKET EVENTS
    // =========================

    socket.on(
      "message:receive",
      handleMessageReceive
    );

    socket.on(
      "typing:start",
      handleTypingStart
    );

    socket.on(
      "typing:stop",
      handleTypingStop
    );

    socket.on(
      "message:read",
      handleMessageRead
    );

    socket.on(
      "message:reaction",
      handleMessageReaction
    );

    // =========================
    // CLEANUP
    // =========================

    return () => {
      socket.off(
        "connect",
        joinConversation
      );

      socket.off(
        "message:receive",
        handleMessageReceive
      );

      socket.off(
        "typing:start",
        handleTypingStart
      );

      socket.off(
        "typing:stop",
        handleTypingStop
      );

      socket.off(
        "message:read",
        handleMessageRead
      );

      socket.off(
        "message:reaction",
        handleMessageReaction
      );

      setIsTyping(false);

      if (socket.connected) {
        socket.emit(
          "conversation:leave",
          conversationId
        );
      }

      console.log(
        "Left conversation:",
        conversationId
      );
    };
  }, [
    chat?._id,
    currentUser?._id,
    addMessage,
    markMessagesAsRead,
    setMessages,
  ]);

  // =========================
  // MARK EXISTING MESSAGES
  // AS READ WHEN CHAT OPENS
  // =========================

  useEffect(() => {
    if (!chat?._id || !currentUser?._id) {
      return;
    }

    const markAsRead = async () => {
      try {
        await markMessagesReadApi(chat._id);

        markMessagesAsRead(
          chat._id,
          currentUser._id
        );

        const socket = getSocket();

        if (socket.connected) {
          socket.emit(
            "message:read",
            chat._id
          );
        }

        console.log(
          "Messages marked as read:",
          chat._id
        );
      } catch (error) {
        console.error(
          "Failed to mark messages as read:",
          error.response?.data || error.message
        );
      }
    };

    markAsRead();
  }, [
    chat?._id,
    currentUser?._id,
    markMessagesAsRead,
  ]);

  // =========================
  // UPDATE REACTION FROM MESSAGE
  // =========================

  const handleReaction = (
    messageId,
    reactions
  ) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message._id === messageId
          ? {
              ...message,
              reactions,
            }
          : message
      )
    );
  };

  // =========================
  // FORMAT MESSAGES
  // =========================

  const formattedMessages = messages.map(
    (message) => ({
      ...message,

      id: message._id,

      /*
       * Keep original sender information.
       *
       * Important for Reply preview.
       */
      senderInfo: message.sender,

      sender:
        message.sender?._id === currentUser?._id
          ? "me"
          : "other",

      time: new Date(
        message.createdAt
      ).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),

      read: message.isRead,
    })
  );

  // =========================
  // REPLY
  // =========================

  const handleReply = (message) => {
    setReplyingTo(message);

    console.log("Replying to:", message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // =========================
  // NO CHAT SELECTED
  // =========================

  if (!chat) {
    return (
      <section className="chat-window empty-chat">
        <div className="empty-chat-icon">
          N
        </div>

        <h2>Your conversations</h2>

        <p>
          Select a conversation to start chatting.
        </p>
      </section>
    );
  }

  // =========================
  // USER INFO
  // =========================

  const userName =
    otherUser?.name || "Unknown User";

  const username =
    otherUser?.username || "";

  const avatar =
    userName.charAt(0).toUpperCase();

  // =========================
  // LAST SEEN
  // =========================

  const lastSeen =
    lastSeenUsers[otherUser?._id] ||
    otherUser?.lastSeen;

  const getLastSeenText = () => {
    if (!lastSeen) {
      return "Offline";
    }

    const lastSeenDate =
      new Date(lastSeen);

    if (
      Number.isNaN(
        lastSeenDate.getTime()
      )
    ) {
      return "Offline";
    }

    return `Last seen ${lastSeenDate.toLocaleString(
      [],
      {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }
    )}`;
  };

  // =========================
  // UI
  // =========================

  return (
    <section className="chat-window">
      {/* =========================
          HEADER
      ========================= */}

      <header className="chat-header">
        <button
          type="button"
          className="mobile-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={19} />
        </button>

        <div className="chat-header-user">
          <div className="avatar-wrapper">
            <span className="avatar purple">
              {otherUser?.avatar ? (
                <img
                  src={otherUser.avatar}
                  alt={userName}
                />
              ) : (
                avatar
              )}
            </span>

            {isOnline && (
              <span className="online-dot" />
            )}
          </div>

          <div>
            <h3>{userName}</h3>

            <span>
              {isTyping
                ? "typing..."
                : isOnline
                ? "Active now"
                : getLastSeenText()}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
  <button type="button">
    <MoreHorizontal size={20} />
  </button>
</div>
      </header>

      {/* =========================
          CHAT BODY
      ========================= */}

      <div className="chat-body">
        <div className="chat-date">
          <span>Today</span>
        </div>

        {/* Conversation Start */}

        <div className="conversation-start">
          <div className="avatar large purple">
            {otherUser?.avatar ? (
              <img
                src={otherUser.avatar}
                alt={userName}
              />
            ) : (
              avatar
            )}
          </div>

          <h2>{userName}</h2>

          <p>@{username}</p>

          <span className="conversation-note">
            This is the beginning of your
            conversation.
          </span>
        </div>

        {/* =========================
            MESSAGES
        ========================= */}

        <div className="messages">
          {loading && (
            <div className="chat-message-status">
              Loading messages...
            </div>
          )}

          {!loading && error && (
            <div className="chat-message-status">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            formattedMessages.length === 0 && (
              <div className="chat-message-status">
                No messages yet.
              </div>
            )}

          {!loading &&
            !error &&
            formattedMessages.map(
              (message) => (
                <Message
                  key={message.id}
                  message={message}
                  onReply={handleReply}
                  onReaction={handleReaction}
                />
              )
            )}

          {/* Typing Indicator */}

          <TypingIndicator
            userName={userName}
            isTyping={isTyping}
          />

          {/* Auto Scroll */}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* =========================
          MESSAGE INPUT
      ========================= */}

      <MessageInput
        conversationId={chat._id}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </section>
  );
}