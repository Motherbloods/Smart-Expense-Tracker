const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const extractAmount = (text) => {
  const amountMatch = text.match(
    /(\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/i
  );

  if (!amountMatch) return 0;

  let amountStr = amountMatch[0].replace(/\./g, "").replace(/,/g, ".");

  // Handle Indonesian currency abbreviations
  if (/k|K|ribu/i.test(text)) {
    const numPart = amountStr.replace(/k|K|ribu/gi, "").trim();
    return parseFloat(numPart) * 1000;
  } else if (/jt|juta/i.test(text)) {
    const numPart = amountStr.replace(/jt|juta/gi, "").trim();
    return parseFloat(numPart) * 1000000;
  } else if (/m|M/i.test(text)) {
    const numPart = amountStr.replace(/m|M/gi, "").trim();
    return parseFloat(numPart) * 1000000;
  }

  return parseFloat(amountStr);
};

const cleanDescription = (text) => {
  return text
    .replace(
      /(\s*Rp\.?\s*\d{1,3}(?:[\.,]?\d{3})*(?:[\.,]?\d+)?|\s*\d+[.,]?\d*\s*(rb|k|K|ribu|jt|juta|m|M|juta rupiah)?)/gi,
      ""
    )
    .trim();
};

module.exports = {
  capitalizeWords,
  extractAmount,
  cleanDescription,
};
