const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"'`]/g, (char) => HTML_ESCAPES[char]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

export const escapeDeep = (value) => {
  if (typeof value === "string") return escapeHtml(value);
  if (Array.isArray(value)) return value.map(escapeDeep);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [escapeHtml(key), escapeDeep(item)]));
  }
  return value;
};

export const stylesheetLinks = () => {
  if (typeof document === "undefined") return "";
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((link) => link.href)
    .filter((href) => href.startsWith(window.location.origin))
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
    .join("");
};
