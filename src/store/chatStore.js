import { create } from "zustand";

const useChatStore = create((set) => ({
  // =========================
  // USER
  // =========================

  currentUser: null,

  // =========================
  // CONVERSATIONS
  // =========================

  conversations: [],

  activeConversation: null,

  // =========================
  // MESSAGES
  // =========================

  messages: [],

  // =========================
  // ONLINE USERS
  // =========================

  onlineUsers: [],

  // =========================
  // LAST SEEN
  // =========================

  lastSeenUsers: {},

  // =========================
  // SET CURRENT USER
  // =========================

  setCurrentUser: (user) =>
    set({
      currentUser: user,
    }),

  // =========================
  // SET CONVERSATIONS
  // =========================

  setConversations: (conversations) =>
    set((state) => {
      // Support functional updates
      if (typeof conversations === "function") {
        const updatedConversations =
          conversations(
            state.conversations
          );

        return {
          conversations: Array.isArray(
            updatedConversations
          )
            ? updatedConversations
            : state.conversations,
        };
      }

      // Normal array update
      return {
        conversations: Array.isArray(
          conversations
        )
          ? conversations
          : [],
      };
    }),

  // =========================
  // SET ACTIVE CONVERSATION
  // =========================

  setActiveConversation: (conversation) =>
    set({
      activeConversation: conversation,
    }),

  // =========================
  // SET MESSAGES
  // =========================

  setMessages: (messages) =>
    set((state) => {
      if (typeof messages === "function") {
        const updatedMessages =
          messages(state.messages);

        return {
          messages: Array.isArray(
            updatedMessages
          )
            ? updatedMessages
            : state.messages,
        };
      }

      return {
        messages: Array.isArray(messages)
          ? messages
          : [],
      };
    }),

  // =========================
  // ADD MESSAGE
  // =========================

  addMessage: (message) =>
    set((state) => {
      if (!message) {
        return state;
      }

      const messageId = message._id;

      // Prevent duplicate messages
      if (
        messageId &&
        state.messages.some(
          (existingMessage) =>
            existingMessage._id ===
            messageId
        )
      ) {
        return state;
      }

      return {
        messages: [
          ...state.messages,
          message,
        ],
      };
    }),

  // =========================
  // MARK MESSAGES AS READ
  // =========================

  markMessagesAsRead: (
    conversationId,
    readerUserId
  ) =>
    set((state) => ({
      messages: state.messages.map(
        (message) => {
          // Get conversation ID
          const messageConversationId =
            typeof message.conversation ===
            "string"
              ? message.conversation
              : message.conversation?._id;

          // Ignore other conversations
          if (
            messageConversationId !==
            conversationId
          ) {
            return message;
          }

          // Get sender ID
          const senderId =
            typeof message.sender ===
            "string"
              ? message.sender
              : message.sender?._id;

          /*
           * If User 2 is reading the chat,
           * only User 1's messages should
           * become read.
           *
           * User 2's own messages should
           * NOT be changed here.
           */
          if (
            readerUserId &&
            senderId !== readerUserId
          ) {
            return {
              ...message,
              isRead: true,
            };
          }

          return message;
        }
      ),
    })),

  // =========================
  // SET ONLINE USERS
  // =========================

  setOnlineUsers: (users) =>
    set({
      onlineUsers: Array.isArray(users)
        ? users
        : [],
    }),

  // =========================
  // ADD ONLINE USER
  // =========================

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: [
        ...new Set([
          ...state.onlineUsers,
          userId,
        ]),
      ],
    })),

  // =========================
  // REMOVE ONLINE USER
  // =========================

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers:
        state.onlineUsers.filter(
          (id) => id !== userId
        ),
    })),

  // =========================
  // SET LAST SEEN
  // =========================

  setLastSeen: (userId, lastSeen) =>
    set((state) => ({
      lastSeenUsers: {
        ...state.lastSeenUsers,
        [userId]: lastSeen,
      },
    })),
}));

export default useChatStore;