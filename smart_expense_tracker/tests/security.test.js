import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { escapeHtml, escapeDeep } from "../src/utils/escapeHtml.js";
import { toSafeCsvCell, toCsvField } from "../src/utils/csv.js";

const payload = '<img src=x onerror=alert(1)>"\'`&';

test("escapeHtml neutralises markup characters", () => {
  const escaped = escapeHtml(payload);
  assert.ok(!/[<>"'`]/.test(escaped.replace(/&(amp|lt|gt|quot|#39|#96);/g, "")));
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(25000), "25000");
});

test("escapeDeep escapes nested strings and keys but keeps numbers", () => {
  const result = escapeDeep({
    list: [{ name: payload, amount: 5 }],
    [payload]: { total: 10, count: 2 },
    nested: [["<b>", { total: 1 }]],
  });
  assert.equal(result.list[0].amount, 5);
  assert.ok(!result.list[0].name.includes("<"));
  assert.ok(Object.keys(result).every((key) => !key.includes("<")));
  assert.equal(result.nested[0][1].total, 1);
  assert.ok(!result.nested[0][0].includes("<"));
});

test("print windows never write unescaped user input", async () => {
  let written = "";
  globalThis.alert = () => {};
  globalThis.window = {
    location: { origin: "https://app.test" },
    open: () => ({
      document: {
        write: (html) => {
          written = html;
        },
        close: () => {},
        getElementById: () => null,
      },
    }),
  };
  globalThis.document = { querySelectorAll: () => [] };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "print-"));
  const utils = new URL("../src/utils/", import.meta.url);
  fs.copyFileSync(new URL("escapeHtml.js", utils), path.join(tmp, "escapeHtml.js"));
  const source = fs.readFileSync(new URL("userPrintUtils.js", utils), "utf8").replace('"./escapeHtml"', '"./escapeHtml.js"');
  fs.writeFileSync(path.join(tmp, "userPrintUtils.js"), source);
  const { openUserPrintWindow } = await import(pathToFileURL(path.join(tmp, "userPrintUtils.js")).href);
  openUserPrintWindow({
    selectedMonth: 0,
    selectedYear: 2026,
    totalIncomes: 100,
    totalExpenses: 50,
    netIncome: 50,
    monthlyBudget: 100,
    budgetPercentage: 50,
    filteredIncomes: [{ name: payload, source: payload, amount: 100, date: "2026-01-01T00:00:00.000Z", notes: payload }],
    filteredExpenses: [
      { name: payload, category: payload, amount: 50, date: "2026-01-01T00:00:00.000Z", incomeId: { name: payload } },
    ],
    categoryBreakdown: { [payload]: { total: 50, count: 1 } },
    monthNames: ["Januari"],
  });

  assert.ok(written.length > 0);
  assert.ok(!written.includes("<img src=x"));
  assert.ok(!written.includes("cdn.tailwindcss.com"));
  assert.ok(!written.includes("onclick="));
  assert.ok(written.includes("&lt;img src=x"));
});

test("csv cells cannot start a spreadsheet formula", () => {
  for (const value of ["=HYPERLINK(\"http://x\")", "+1+1", "-2+3", "@SUM(A1)", "\tcmd"]) {
    assert.ok(toSafeCsvCell(value).startsWith("'"), value);
  }
  assert.equal(toSafeCsvCell(-5), "-5");
  assert.equal(toSafeCsvCell("Makanan"), "Makanan");
  assert.equal(toCsvField('a,"b"'), '"a,""b"""');
});
