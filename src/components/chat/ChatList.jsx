"use client";

import { useEffect, useMemo, useState } from "react";

import {
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  getConversations,
  deleteConversation,
} from "@/services/chatApi";

import useChatStore from "@/store/chatStore";

import {
  getSocket,
  connectSocket,
} from "@/socket/socket";

export default function ChatList({
  selectedChat,
  onSelect,
}) {
  // =========================
  // ZUSTAND
  // =========================

  const conversations = useChatStore(
    (state) => state.conversations
  );

  const setConversations = useChatStore(
    (state) => state.setConversations
  );

  // =========================
  // LOCAL STATE
  // =========================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("all");

  const [menuOpenId, setMenuOpenId] =
    useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  // =========================
  // LOAD CONVERSATIONS
  // =========================

  useEffect(() => {
    const fetchConversations =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getConversations();

          console.log(
            "Conversations from backend:",
            data
          );

          setConversations(
            data.conversations || []
          );
        } catch (error) {
          console.error(
            "Failed to fetch conversations:",
            error.response?.data ||
              error.message
          );

          setError(
            error.response?.data?.message ||
              "Failed to load conversations."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchConversations();
  }, [setConversations]);

  // =========================
// CLOSE MENU ON OUTSIDE CLICK
// =========================

useEffect(() => {
  const handleOutsideClick = (event) => {
    if (!event.target.closest(".chat-more-wrapper")) {
      setMenuOpenId(null);
    }
  };

  document.addEventListener("click", handleOutsideClick);

  return () => {
    document.removeEventListener("click", handleOutsideClick);
  };
}, []);

  // =========================
  // DELETE CHAT
  // =========================

  const handleDeleteConversation =
    async (conversationId) => {
      if (!conversationId) {
        return;
      }

      if (deletingId) {
        return;
      }

      const confirmed = window.confirm(
        "Delete this chat? All messages in this conversation will be deleted."
      );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(conversationId);
        setMenuOpenId(null);

        await deleteConversation(
          conversationId
        );

        // ------------------------------------------
        // Remove instantly from Zustand
        // No refresh required
        // ------------------------------------------

        setConversations(
          (currentConversations) =>
            currentConversations.filter(
              (conversation) =>
                conversation._id !==
                conversationId
            )
        );

        // ------------------------------------------
        // If currently selected chat was deleted
        // clear selected chat
        // ------------------------------------------

        if (
          selectedChat?._id ===
          conversationId
        ) {
          onSelect(null);
        }
      } catch (error) {
        console.error(
          "Failed to delete conversation:",
          error.response?.data ||
            error.message
        );

        alert(
          error.response?.data?.message ||
            "Failed to delete chat."
        );
      } finally {
        setDeletingId(null);
      }
    };

  // =========================
  // REAL-TIME CONVERSATION UPDATE
  // =========================

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) {
      connectSocket();
    }

    // =========================
    // NEW MESSAGE / UPDATE
    // =========================

    const handleConversationUpdated =
      (data) => {
        console.log(
          "Conversation updated:",
          data
        );

        const conversationId =
          data?.conversationId;

        if (!conversationId) {
          return;
        }

        setConversations(
          (currentConversations) => {
            const existingConversation =
              currentConversations.find(
                (conversation) =>
                  conversation._id ===
                  conversationId
              );

            // ------------------------------------------
            // Conversation doesn't exist
            // ------------------------------------------

            if (!existingConversation) {
              return currentConversations;
            }

            // ------------------------------------------
            // Update conversation
            // ------------------------------------------

            const updatedConversation = {
              ...existingConversation,

              lastMessage:
                data.message ||
                existingConversation.lastMessage,

              lastMessageAt:
                data.message?.createdAt ||
                existingConversation.lastMessageAt,

              unreadCount:
                typeof data.unreadCount ===
                "number"
                  ? data.unreadCount
                  : existingConversation.unreadCount,
            };

            // ------------------------------------------
            // Move to top
            // ------------------------------------------

            const otherConversations =
              currentConversations.filter(
                (conversation) =>
                  conversation._id !==
                  conversationId
              );

            return [
              updatedConversation,
              ...otherConversations,
            ];
          }
        );
      };

    // =========================
    // DELETE CONVERSATION
    // =========================

    const handleConversationDeleted =
      (data) => {
        console.log(
          "Conversation deleted:",
          data
        );

        const conversationId =
          data?.conversationId;

        if (!conversationId) {
          return;
        }

        // ------------------------------------------
        // Remove instantly from sidebar
        // ------------------------------------------

        setConversations(
          (currentConversations) =>
            currentConversations.filter(
              (conversation) =>
                conversation._id !==
                conversationId
            )
        );

        // ------------------------------------------
        // Clear currently open chat
        // ------------------------------------------

        if (
          selectedChat?._id ===
          conversationId
        ) {
          onSelect(null);
        }
      };

    // =========================
    // LISTENERS
    // =========================

    socket.on(
      "conversation:updated",
      handleConversationUpdated
    );

    socket.on(
      "conversation:deleted",
      handleConversationDeleted
    );

    // =========================
    // CLEANUP
    // =========================

    return () => {
      socket.off(
        "conversation:updated",
        handleConversationUpdated
      );

      socket.off(
        "conversation:deleted",
        handleConversationDeleted
      );
    };
  }, [
    setConversations,
    selectedChat,
    onSelect,
  ]);

  // =========================
  // SEARCH CONVERSATIONS
  // =========================

  const filteredConversations =
    useMemo(() => {
      let result = conversations;

      // ------------------------------------------
      // Unread filter
      // ------------------------------------------

      if (activeTab === "unread") {
        result = result.filter(
          (conversation) =>
            conversation.unreadCount > 0
        );
      }

      // ------------------------------------------
      // Search filter
      // ------------------------------------------

      if (search.trim()) {
        const query =
          search.toLowerCase();

        result = result.filter(
          (conversation) =>
            conversation.participants?.some(
              (user) =>
                user.name
                  ?.toLowerCase()
                  .includes(query) ||
                user.username
                  ?.toLowerCase()
                  .includes(query)
            )
        );
      }

      return result;
    }, [
      conversations,
      search,
      activeTab,
    ]);

  // =========================
  // GET OTHER USER
  // =========================

  const getOtherUser = (
    conversation
  ) => {
    const currentUser =
      useChatStore.getState()
        .currentUser;

    return conversation.participants?.find(
      (user) =>
        user._id !==
        currentUser?._id
    );
  };

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate =
      new Date(date);

    const now = new Date();

    const isToday =
      messageDate.toDateString() ===
      now.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit",
        }
      );
    }

    return messageDate.toLocaleDateString(
      [],
      {
        day: "numeric",
        month: "short",
      }
    );
  };

  // =========================
  // UI
  // =========================

  return (
    <aside className="chat-list">
      {/* =========================
          HEADER
      ========================= */}

      <div className="chat-list-header">
        <div>
          <h2>Messages</h2>

          <span>
            {conversations.length}{" "}
            conversations
          </span>
        </div>

        {/* <button
          type="button"
          className="round-button"
        >
          <Plus size={18} />
        </button> */}
      </div>

      {/* =========================
          SEARCH
      ========================= */}

      <div className="chat-search">
        <Search size={16} />

        <input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* =========================
          TABS
      ========================= */}

      <div className="chat-tabs">
        <button
          type="button"
          className={
            activeTab === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("all")
          }
        >
          All
        </button>

        <button
          type="button"
          className={
            activeTab === "unread"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("unread")
          }
        >
          Unread
        </button>
      </div>

      {/* =========================
          CHAT ITEMS
      ========================= */}

      <div className="chat-items">
        {/* Loading */}

        {loading && (
          <div className="chat-empty-state">
            Loading conversations...
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="chat-empty-state">
            {error}
          </div>
        )}

        {/* Empty */}

        {!loading &&
          !error &&
          filteredConversations.length ===
            0 && (
            <div className="chat-empty-state">
              {search
                ? "No conversations found."
                : "No conversations yet."}
            </div>
          )}

        {/* Conversations */}

        {!loading &&
          !error &&
          filteredConversations.map(
            (conversation) => {
              const user =
                getOtherUser(
                  conversation
                );

              if (!user) {
                return null;
              }

              const initials =
                user.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "?";

              const unreadCount =
                conversation.unreadCount ||
                0;

              const isUnread =
                unreadCount > 0;

              const isMenuOpen =
                menuOpenId ===
                conversation._id;

              const isDeleting =
                deletingId ===
                conversation._id;

              return (
                <div
                  key={conversation._id}
                  className={`chat-item ${
                    selectedChat?._id ===
                    conversation._id
                      ? "active"
                      : ""
                  } ${
                    isUnread
                      ? "has-unread"
                      : ""
                  }`}
                  onClick={() => {
                    if (isDeleting) {
                      return;
                    }

                    onSelect(
                      conversation
                    );
                    setMenuOpenId(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " "
                    ) {
                      e.preventDefault();

                      if (!isDeleting) {
                        onSelect(
                          conversation
                        );
                        setMenuOpenId(null);
                      }
                    }
                  }}
                >
                  {/* =========================
                      AVATAR
                  ========================= */}

                  <div className="avatar-wrapper">
                    <span className="avatar purple">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={
                            user.name ||
                            "User"
                          }
                        />
                      ) : (
                        initials
                      )}
                    </span>

                    {user.isOnline && (
                      <span className="online-dot" />
                    )}
                  </div>

                  {/* =========================
                      CHAT INFO
                  ========================= */}

                  <div className="chat-item-info">
                    {/* TOP */}

                    <div className="chat-item-top">
                      <strong>
                        {user.name}
                      </strong>

                      <small
                        className={
                          isUnread
                            ? "unread-time"
                            : ""
                        }
                      >
                        {formatTime(
                          conversation.lastMessageAt
                        )}
                      </small>
                    </div>

                    {/* BOTTOM */}

                    <div className="chat-item-bottom">
                      <span
                        className={
                          isUnread
                            ? "unread-message"
                            : ""
                        }
                      >
                        {conversation
                          .lastMessage
                          ?.text ||
                          "Start a conversation"}
                      </span>

                      {/* UNREAD BADGE */}

                      {isUnread && (
                        <b className="unread-badge">
                          {unreadCount >
                          99
                            ? "99+"
                            : unreadCount}
                        </b>
                      )}
                    </div>
                  </div>

                  {/* =========================
                      MORE BUTTON
                  ========================= */}

                  <div className="chat-more-wrapper">
                    <button
                      type="button"
                      className="chat-more-button"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (isDeleting) {
                          return;
                        }

                        setMenuOpenId(
                          isMenuOpen
                            ? null
                            : conversation._id
                        );
                      }}
                      aria-label="Chat options"
                    >
                      {isDeleting ? (
                        <span className="chat-delete-loading">
                          ...
                        </span>
                      ) : (
                        <MoreHorizontal
                          size={17}
                        />
                      )}
                    </button>

                    {/* =========================
                        DELETE MENU
                    ========================= */}

                    {isMenuOpen &&
                      !isDeleting && (
                        <div
                          className="chat-options-menu"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          <button
                            type="button"
                            className="chat-delete-option"
                            onClick={() =>
                              handleDeleteConversation(
                                conversation._id
                              )
                            }
                          >
                            <Trash2
                              size={16}
                            />

                            <span>
                              Delete Chat
                            </span>
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              );
            }
          )}
      </div>
    </aside>
  );
}