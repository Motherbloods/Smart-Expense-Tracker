const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const extractAmount = (text) => {
  const amountMatch = text.match(
    /(\d+(?:[.,]\d+)?)(rb|k|ribu|jt|juta|m|juta rupiah)?/i
  );

  if (!amountMatch) return 0;

  let amountStr = amountMatch[0];
  let numPart, multiplier;

  if (/k|K|ribu/i.test(amountStr)) {
    numPart = amountStr.replace(/k|K|ribu/gi, "").trim();

    if (/\d+[.]\d{3}/.test(numPart)) {
      numPart = numPart.replace(/\./g, "");
    }

    if (parseFloat(numPart.replace(/\./g, "").replace(/,/g, ".")) >= 1000) {
      multiplier = 1;
    } else {
      multiplier = 1000;
    }
  } else if (/jt|juta/i.test(amountStr)) {
    numPart = amountStr.replace(/jt|juta/gi, "").trim();

    if (parseFloat(numPart) >= 1000000) {
      multiplier = 1;
    } else {
      multiplier = 1000000;
    }
  } else if (/m|M/i.test(amountStr)) {
    numPart = amountStr.replace(/m|M/gi, "").trim();

    if (parseFloat(numPart) >= 1000000) {
      multiplier = 1;
    } else {
      multiplier = 1000000;
    }
  } else {
    // Tidak ada penanda satuan
    console.log("else");
    numPart = amountStr;
    multiplier = 1;
  }
  console.log(numPart, multiplier);

  return parseFloat(numPart) * multiplier;
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
