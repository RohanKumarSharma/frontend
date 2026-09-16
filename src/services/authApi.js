import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export const registerUser = async (data) => {
  const response = await axios.post(
    `${API}/auth/register`,
    data,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const loginUser = async (data) => {
  const response = await axios.post(
    `${API}/auth/login`,
    data,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const logoutUser = async () => {
  const response = await axios.post(
    `${API}/auth/logout`,
    {},
    {
      withCredentials: true,
    }
  );

  return response.data;
};

// Get currently logged-in user
export const getMe = async () => {
  const response = await axios.get(
    `${API}/auth/me`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};