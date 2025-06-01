const { google } = require("googleapis");
const { capitalizeWords } = require("./text-formatter");

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = "Sheet1";

async function appendFeedback(feedback) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

  feedback.user_input = capitalizeWords(feedback.user_input);
  feedback.prediction = capitalizeWords(feedback.prediction);
  feedback.correct = capitalizeWords(feedback.correct);

  const now = new Date().toISOString();
  const values = [
    [feedback.user_input, feedback.prediction, feedback.correct, now],
  ];

  const resource = {
    values,
  };

  try {
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: "USER_ENTERED",
      resource,
    });

    console.log("✅ Feedback berhasil disimpan ke Google Sheets.");
  } catch (err) {
    console.error("❌ Gagal menyimpan ke Sheets:", err);
  }
}

module.exports = appendFeedback;
