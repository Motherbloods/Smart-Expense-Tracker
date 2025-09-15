const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// const extractAmount = (text) => {
//   const amountMatch = text.match(
//     /(\d+(?:[.,]\d+)?)(rb|k|ribu|jt|juta|m|juta rupiah)?/i
//   );

//   if (!amountMatch) return 0;

//   let amountStr = amountMatch[0];
//   let numPart, multiplier;

//   if (/k|K|ribu/i.test(amountStr)) {
//     numPart = amountStr.replace(/k|K|ribu/gi, "").trim();

//     if (/\d+[.]\d{3}/.test(numPart)) {
//       numPart = numPart.replace(/\./g, "");
//     }

//     if (parseFloat(numPart.replace(/\./g, "").replace(/,/g, ".")) >= 1000) {
//       multiplier = 1;
//     } else {
//       multiplier = 1000;
//     }
//   } else if (/jt|juta/i.test(amountStr)) {
//     numPart = amountStr.replace(/jt|juta/gi, "").trim();

//     if (parseFloat(numPart) >= 1000000) {
//       multiplier = 1;
//     } else {
//       multiplier = 1000000;
//     }
//   } else if (/m|M/i.test(amountStr)) {
//     numPart = amountStr.replace(/m|M/gi, "").trim();

//     if (parseFloat(numPart) >= 1000000) {
//       multiplier = 1;
//     } else {
//       multiplier = 1000000;
//     }
//   } else {
//     // Tidak ada penanda satuan
//     console.log("else");
//     numPart = amountStr;
//     multiplier = 1;
//   }
//   console.log(numPart, multiplier);

//   return parseFloat(numPart) * multiplier;
// };

const extractAmount = (text) => {
  const match = text.match(
    /(\d+(?:[.,]\d+)?)(\s*(rb|k|ribu|jt|juta|m|juta rupiah))?/i
  );
  if (!match) return 0;

  // let number = match[1].replace(/,/g, ".");
  // let unit = match[3] ? match[3].toLowerCase() : "";
  // let multiplier = 1;

  let rawNumber = match[1];
  let unit = match[3] ? match[3].toLowerCase() : "";
  let multiplier = 1;

  // Kalau mengandung titik dan tidak koma ribuan, anggap desimal (misal: 1.2jt → 1.2 * 1jt)
  if (rawNumber.includes(".") && !/\d{1,3}\.\d{3}/.test(rawNumber)) {
    number = rawNumber.replace(/,/g, ".");
  } else {
    // Format seperti 15.000 atau 1,000 → hapus semua pemisah
    number = rawNumber.replace(/[.,]/g, "");
  }

  switch (unit) {
    case "rb":
    case "k":
    case "ribu":
      multiplier = 1000;
      break;
    case "jt":
    case "juta":
    case "m":
    case "juta rupiah":
      multiplier = 1000000;
      break;
  }

  return parseFloat(number) * multiplier;
};

// const cleanDescription = (text) => {
//   return text
//     .replace(
//       /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
//       ""
//     )
//     .trim();
// };

// const extractIncomeSource = (text) => {
//   const amountPattern = /(\d+(?:[.,]\d+)?)(rb|k|ribu|jt|juta|m|juta rupiah)?/i;

//   // Find the amount match to determine where it ends
//   const amountMatch = text.match(amountPattern);
//   if (!amountMatch) return null;

//   // Get the position where the amount ends
//   const amountEndIndex = amountMatch.index + amountMatch[0].length;

//   // Extract everything after the amount as potential income source
//   const afterAmount = text.slice(amountEndIndex).trim();

//   // Return the income source if it exists and is not empty
//   if (afterAmount && afterAmount.length > 0) {
//     return afterAmount;
//   }

//   return null;
// };

const cleanDescription = (text, incomeSource = "") => {
  const amountPattern =
    /(\s*Rp\.?\s*)?\d{1,3}(?:[.,]?\d{3})*(?:[.,]?\d+)?(\s*(rb|k|ribu|jt|juta|m|juta rupiah))?/gi;

  let cleaned = text.replace(amountPattern, "").trim();

  if (incomeSource) {
    const escaped = incomeSource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cleaned = cleaned.replace(new RegExp("\\s*" + escaped, "i"), "").trim();
  }

  return cleaned;
};

const extractIncomeSource = (text) => {
  const match = text.match(
    /(\d+(?:[.,]\d+)?)(\s*(rb|k|ribu|jt|juta|m|juta rupiah))?/i
  );
  if (!match) return null;

  const endIndex = match.index + match[0].length;
  const afterAmount = text.slice(endIndex).trim();

  return afterAmount.length ? afterAmount : null;
};

const parseExpenseWithIncome = (text) => {
  const amount = extractAmount(text);
  const incomeSource = extractIncomeSource(text);
  const description = cleanDescription(text, incomeSource);

  return {
    description,
    amount,
    incomeSource,
  };
};

// const testCases = [
//   "beli cilok 10k gaji bulanan",
//   "transfer 500 ribu bonus akhir tahun",
//   "nonton bioskop 75rb",
//   "beli kopi 15.000 dari uang jajan",
//   "bayar kost 1.2jt",
//   "topup gopay Rp 200.000 THR",
// ];

// for (const text of testCases) {
//   console.log(`\nInput: "${text}"`);
//   console.log(parseExpenseWithIncome(text));
// }

module.exports = {
  capitalizeWords,
  extractAmount,
  cleanDescription,
  parseExpenseWithIncome,
};
