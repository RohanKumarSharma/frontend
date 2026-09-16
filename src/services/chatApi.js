import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

// ======================================================
// CONVERSATIONS
// ======================================================

export const getConversations = async () => {
  const response = await axios.get(`${API}/conversations`, {
    withCredentials: true,
  });

  return response.data;
};

export const createConversation = async (userId) => {
  const response = await axios.post(
    `${API}/conversations/${userId}`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ======================================================
// DELETE CONVERSATION
// ======================================================

export const deleteConversation = async (conversationId) => {
  const response = await axios.delete(
    `${API}/conversations/${conversationId}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ======================================================
// MESSAGES
// ======================================================

export const getMessages = async (
  conversationId,
  page = 1
) => {
  const response = await axios.get(
    `${API}/messages/${conversationId}?page=${page}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const sendMessage = async (
  conversationId,
  text,
  replyTo = null
) => {
  const response = await axios.post(
    `${API}/messages`,
    {
      conversationId,
      text,
      replyTo,
    },
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ======================================================
// DELETE MESSAGE
// ======================================================

export const deleteMessage = async (messageId) => {
  const response = await axios.delete(
    `${API}/messages/${messageId}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ======================================================
// MESSAGE REACTION
// ======================================================

export const reactToMessage = async (
  messageId,
  emoji
) => {
  const response = await axios.post(
    `${API}/messages/${messageId}/reaction`,
    {
      emoji,
    },
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// ======================================================
// READ RECEIPTS
// ======================================================

export const markMessagesRead = async (
  conversationId
) => {
  const response = await axios.patch(
    `${API}/messages/${conversationId}/read`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};