const fs = require("fs");
const path = require("path");

const saveCorrectionsToFile = (corrections) => {
  const dirPath = path.join(__dirname, "..", "data");
  const filePath = path.join(dirPath, "corrections.json");

  // Buat folder 'data' jika belum ada
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Baca data lama jika ada
  let existingCorrections = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, "utf8").trim();
    if (fileData) {
      try {
        existingCorrections = JSON.parse(fileData);
      } catch (err) {
        console.warn(
          "⚠️ Failed to parse corrections.json. Replacing with empty array."
        );
        existingCorrections = [];
      }
    }
  }

  // Gabungkan koreksi baru dengan yang lama
  existingCorrections.push(...corrections);

  // Simpan ke file
  fs.writeFileSync(
    filePath,
    JSON.stringify(existingCorrections, null, 2),
    "utf8"
  );
};

module.exports = saveCorrectionsToFile;
