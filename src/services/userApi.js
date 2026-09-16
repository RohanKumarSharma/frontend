import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export const searchUsers = async (query) => {
  const response = await axios.get(
    `${API}/users/search`,
    {
      params: { q: query },
      withCredentials: true,
    }
  );

  return response.data;
};

export const getUserProfile = async (username) => {
  const response = await axios.get(
    `${API}/users/${username}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};