import { Link } from "react-router-dom";

export const BOT_URL = import.meta.env.VITE_TELEGRAM_BOT_LINK || "";

export function PublicHeader() {
  return (
    <header className="shrink-0 border-b border-[var(--line)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="text-base font-extrabold tracking-tight text-[var(--ink)]">
          Smart Expense <span className="text-[var(--brand)]">Tracker</span>
        </Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-5 text-sm font-semibold">
          <Link to="/privasi" className="text-[var(--ink-soft)] hover:text-[var(--ink)]">
            Privasi
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-[var(--brand)] px-4 py-2 text-white hover:bg-[var(--brand-dark)]"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter({ compact = false }) {
  return (
    <footer
      className={`${compact ? "shrink-0" : "mt-20"} border-t border-[var(--line)] bg-[var(--surface-alt)]`}
    >
      <div
        className={`mx-auto flex max-w-5xl flex-col gap-3 px-5 ${
          compact ? "py-4" : "py-8"
        } text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between`}
      >
        <p>
          Dikembangkan oleh Habib Risky Kurniawan (motherbloodss).
        </p>
        <nav aria-label="Tautan footer" className="flex gap-5 font-semibold">
          <Link to="/privasi" className="hover:text-[var(--ink)]">Kebijakan privasi</Link>
          <Link to="/login" className="hover:text-[var(--ink)]">Masuk</Link>
        </nav>
      </div>
    </footer>
  );
}

export function PublicShell({ children, fitScreen = false }) {
  return (
    <div className={fitScreen ? "fit-screen bg-[var(--surface)]" : "min-h-screen bg-[var(--surface)]"}>
      <a href="#konten" className="skip-link">Lewati ke konten</a>
      <PublicHeader />
      <main id="konten" className={fitScreen ? "flex min-h-0 flex-1 items-center" : undefined}>
        {children}
      </main>
      <PublicFooter compact={fitScreen} />
    </div>
  );
}