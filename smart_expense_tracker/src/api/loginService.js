import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const loginToDashboard = async (telegramId) => {
  try {
    const response = await axios.post(
      `${API_URL}/login`,
      {
        telegramId: telegramId,
      },
      { withCredentials: true }
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Login failed. Please try again.");
  }
};

export const updateMonthlyBudget = async (budget, telegramId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/update-budget`,
      {
        telegramId: telegramId,
        budget: budget,
      },
      { withCredentials: true }
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update budget. Please try again.");
  }
};

export const getUserData = (telegramId) => {
  return axios.get(`${API_URL}/getUser/${telegramId}`);
};
