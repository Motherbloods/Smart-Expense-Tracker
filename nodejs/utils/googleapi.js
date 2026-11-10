const { google } = require("googleapis");

const SHEET_NAME = "Sheet1";

const buildAuth = () => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(raw),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } catch (error) {
    console.error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
    return null;
  }
};

const appendFeedback = async (feedback) => {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const auth = buildAuth();
  if (!auth || !spreadsheetId) return false;

  try {
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: "RAW",
      resource: {
        values: [
          [feedback.user_input, feedback.prediction, feedback.correct, new Date().toISOString()],
        ],
      },
    });
    return true;
  } catch (err) {
    console.error("Failed to append feedback to Google Sheets:", err.message);
    return false;
  }
};

module.exports = appendFeedback;
