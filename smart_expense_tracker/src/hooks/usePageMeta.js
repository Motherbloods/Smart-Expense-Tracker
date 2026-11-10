import { useEffect } from "react";

const SITE_URL = (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
    element.setAttribute(selector.includes("property=") ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
};

const setCanonical = (path) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!SITE_URL) {
    if (link) link.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", `${SITE_URL}${path}`);
};

export default function usePageMeta({ title, description, robots = "index,follow", path = "/" }) {
  useEffect(() => {
    document.title = title;
    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
    }
    setMeta('meta[name="robots"]', "content", robots);
    setMeta('meta[property="og:title"]', "content", title);
    setCanonical(path);
  }, [title, description, robots, path]);
}
