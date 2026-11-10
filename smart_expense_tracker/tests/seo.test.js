import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import seoPlugin from "../vite.seo.js";

const baseHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const runPlugin = (siteUrl) => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
  const plugin = seoPlugin(siteUrl);
  plugin.configResolved({ root: outDir, build: { outDir: "." } });
  const transformed = plugin.transformIndexHtml.handler(baseHtml);
  fs.writeFileSync(path.join(outDir, "index.html"), transformed);
  plugin.closeBundle();
  return { outDir, transformed };
};

test("with a site url: canonical, sitemap, robots and valid json-ld", () => {
  const { outDir, transformed } = runPlugin("https://app.example.test/");
  const read = (file) => fs.readFileSync(path.join(outDir, file), "utf8");

  assert.ok(read("robots.txt").includes("Sitemap: https://app.example.test/sitemap.xml"));
  const sitemap = read("sitemap.xml");
  assert.ok(sitemap.includes("<loc>https://app.example.test/</loc>"));
  assert.ok(sitemap.includes("<loc>https://app.example.test/privasi</loc>"));
  assert.ok(!sitemap.includes("/login"));

  assert.ok(read("login/index.html").includes('content="noindex,follow"'));
  assert.ok(read("login/index.html").includes('href="https://app.example.test/login"'));
  assert.ok(read("privasi/index.html").includes('href="https://app.example.test/privasi"'));
  assert.ok(read("index.html").includes('href="https://app.example.test/"'));

  const ld = transformed.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(ld[1]);
  const types = data["@graph"].map((node) => node["@type"]);
  assert.deepEqual(types, ["WebSite", "WebApplication", "Person"]);
  assert.ok(!ld[1].includes("aggregateRating") && !ld[1].includes("offers"));
  assert.ok(!transformed.includes("%SITE_URL%"));
});

test("without a site url nothing absolute is invented", () => {
  const { outDir, transformed } = runPlugin("");
  assert.ok(!fs.existsSync(path.join(outDir, "sitemap.xml")));
  assert.ok(!fs.readFileSync(path.join(outDir, "robots.txt"), "utf8").includes("Sitemap"));
  assert.ok(!transformed.includes("%SITE_URL%"));
  assert.ok(!transformed.includes("canonical"));
  assert.ok(!transformed.includes("og:image"));
  assert.ok(!transformed.includes("ld+json"));
});

test("invalid site urls are ignored", () => {
  const { transformed } = runPlugin("javascript:alert(1)");
  assert.ok(!transformed.includes("javascript:"));
  assert.ok(!transformed.includes("canonical"));
});
