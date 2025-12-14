const axios = require("axios");
const http = require("http");
const https = require("https");

// Setup HTTP agents dengan Keep-Alive
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

// Create axios instance dengan agents
const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000,
});

const handleSingleExpense = async (inputText, requestNum) => {
  try {
    const webhookUrl =
      "https://n8n-ku.motherbloodss.site/webhook-test/29f54df7-988e-4e2b-bb13-03835331f9e8";

    const timerLabel = `N8N Webhook Time #${requestNum}`;
    console.time(timerLabel);
    const n8nResponse = await axiosInstance.post(webhookUrl, {
      inputText,
    });
    console.timeEnd(timerLabel);

    const data = n8nResponse.data;
    console.log({
      teks_asli: data.teks_asli,
      harga: data.teks_parsing.harga,
      nama_pengeluaran: data.teks_parsing.nama_pengeluaran,
    });
    console.log("---");
  } catch (error) {
    console.error("Error in handleSingleExpense:", error.message);
  }
};

// Test dengan multiple requests
const testMultipleRequests = async () => {
  console.log("🚀 Starting requests with Keep-Alive...\n");

  const expenses = [
    "bensin 50000",
    "beli celana di warung 25000",
    "makan nasi goreng 15000",
    "beli buku 75000",
    "makan sate 30000",
  ];

  for (let i = 0; i < expenses.length; i++) {
    console.log(`\n📝 Request ${i + 1}/${expenses.length}:`);
    await handleSingleExpense(expenses[i], i + 1);
    // Optional: delay antara requests
    // await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// Single test
const testSingleRequest = async () => {
  console.log("🚀 Testing single request...\n");
  await handleSingleExpense("beli celana di warung 25000");
};

// Run test
testMultipleRequests().catch(console.error);
