function validateCategory(category) {
  const trimmed = category.trim();
  const tooLong = trimmed.length > 25;
  const isLink = trimmed.includes("http");
  const isNumber = /^[0-9]+$/.test(trimmed);
  const tooManyWords = trimmed.split(" ").length > 3;

  if (tooLong || isLink || isNumber || tooManyWords) {
    return {
      valid: false,
      reason: `Kategori "${category}" tidak valid`,
    };
  }

  return { valid: true };
}

module.exports = validateCategory;
