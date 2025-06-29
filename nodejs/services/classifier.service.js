const axios = require("axios");
const FLASK_API_URL = process.env.FLASK_API_URL;

const predictCategory = async (activity) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/predict`, { activity });
    return response.data;
  } catch (error) {
    console.error("Error predicting category:", error);
    return null;
  }
};

const predictBatchCategories = async (activities) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/batch-predict`, {
      activities,
    });
    return response.data;
  } catch (error) {
    console.error("Error predicting batch categories:", error);
    return null;
  }
};

module.exports = {
  predictCategory,
  predictBatchCategories,
};
