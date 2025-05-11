// ✅ GUNAKAN axiosInstance
import axiosInstance from "./axiosInstance"; // pastikan import path-nya sesuai

export const loginToDashboard = async (telegramId) => {
  try {
    const response = await axiosInstance.post("/login", { telegramId });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Login failed. Please try again.");
  }
};

export const updateMonthlyBudget = async (budget, telegramId) => {
  try {
    const response = await axiosInstance.patch("/update-budget", {
      telegramId,
      budget,
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update budget. Please try again.");
  }
};

export const getUserData = (telegramId) => {
  return axiosInstance.get(`/getUser/${telegramId}`);
};
