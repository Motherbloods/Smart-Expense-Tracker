import fs from "node:fs";
import path from "node:path";

const PAGES = [
  {
    route: "/",
    title: "Smart Expense Tracker: Catat Pengeluaran Lewat Telegram",
    description:
      "Aplikasi pencatat pengeluaran pribadi. Catat pengeluaran dan pemasukan lewat bot Telegram, atur anggaran bulanan, dan pantau laporan di dashboard.",
    robots: "index,follow",
    sitemap: true,
  },
  {
    route: "/login",
    title: "Masuk | Smart Expense Tracker",
    description: "Masuk ke dashboard Smart Expense Tracker dengan ID Telegram dan kode login dari bot.",
    robots: "noindex,follow",
    sitemap: false,
  },
  {
    route: "/privasi",
    title: "Kebijakan Privasi | Smart Expense Tracker",
    description:
      "Data apa saja yang disimpan Smart Expense Tracker, bagaimana digunakan, layanan pihak ketiga yang terlibat, dan kendali yang Anda miliki.",
    robots: "index,follow",
    sitemap: true,
  },
];

const escapeAttr = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const normalizeSiteUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return `${url.origin}`;
  } catch {
    return "";
  }
};

const applySiteUrl = (html, siteUrl) => {
  if (!siteUrl) {
    return html
      .replace(/^[ \t]*<(?:link|meta)[^>]*data-site-url[^>]*\/>\r?\n/gm, "")
      .replace(/^[ \t]*<script[^>]*data-site-url[^>]*>[\s\S]*?<\/script>\r?\n/gm, "");
  }
  return html.replace(/%SITE_URL%/g, siteUrl).replace(/ data-site-url/g, "");
};

const applyPage = (html, page, siteUrl) => {
  let output = html;
  const title = escapeAttr(page.title);
  const description = escapeAttr(page.description);
  output = output.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  output = output.replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`);
  output = output.replace(/(<meta name="robots" content=")[^"]*(")/, `$1${page.robots}$2`);
  output = output.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`);
  output = output.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`);
  output = output.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`);
  output = output.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`);
  if (siteUrl) {
    const url = page.route === "/" ? `${siteUrl}/` : `${siteUrl}${page.route}`;
    output = output.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
    output = output.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  }
  return output;
};

export default function seoPlugin(rawSiteUrl) {
  const siteUrl = normalizeSiteUrl(rawSiteUrl);
  let outDir = "dist";

  return {
    name: "smart-expense-seo",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return applySiteUrl(html, siteUrl);
      },
    },
    closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const base = fs.readFileSync(indexPath, "utf8");

      for (const page of PAGES) {
        const html = applyPage(base, page, siteUrl);
        if (page.route === "/") {
          fs.writeFileSync(indexPath, html);
        } else {
          const dir = path.join(outDir, page.route.slice(1));
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, "index.html"), html);
        }
      }

      const robots = ["User-agent: *", "Allow: /"];
      if (siteUrl) robots.push("", `Sitemap: ${siteUrl}/sitemap.xml`);
      fs.writeFileSync(path.join(outDir, "robots.txt"), `${robots.join("\n")}\n`);

      if (siteUrl) {
        const urls = PAGES.filter((page) => page.sitemap)
          .map((page) => `  <url>\n    <loc>${siteUrl}${page.route === "/" ? "/" : page.route}</loc>\n  </url>`)
          .join("\n");
        fs.writeFileSync(
          path.join(outDir, "sitemap.xml"),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
        );
      }
    },
  };
}
