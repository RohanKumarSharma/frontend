import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export const sendFriendRequest = async (receiverId) => {
  const response = await axios.post(
    `${API}/friends/request`,
    { receiverId },
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const getFriends = async () => {
  const response = await axios.get(
    `${API}/friends`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const getFriendRequests = async () => {
  const response = await axios.get(
    `${API}/friends/requests`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const acceptFriendRequest = async (
  requestId
) => {
  const response = await axios.post(
    `${API}/friends/${requestId}/accept`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const rejectFriendRequest = async (
  requestId
) => {
  const response = await axios.post(
    `${API}/friends/${requestId}/reject`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const removeFriend = async (userId) => {
  const response = await axios.delete(
    `${API}/friends/${userId}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};