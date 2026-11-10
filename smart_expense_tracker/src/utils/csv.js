const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export const toSafeCsvCell = (cell) => {
  const text = String(cell ?? "");
  if (typeof cell === "string" && FORMULA_PREFIX.test(text)) {
    return `'${text}`;
  }
  return text;
};

export const toCsvField = (cell) => {
  const text = toSafeCsvCell(cell);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
