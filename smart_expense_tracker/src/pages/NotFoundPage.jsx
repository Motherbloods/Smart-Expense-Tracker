import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { PublicShell } from "../components/PublicLayout";

export default function NotFoundPage() {
  usePageMeta({
    title: "Halaman tidak ditemukan | Smart Expense Tracker",
    description: "Halaman yang Anda cari tidak tersedia.",
    robots: "noindex,nofollow",
    path: "/404",
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-5 py-24">
        <p className="font-mono-num text-sm font-bold text-[var(--brand)]">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-[var(--ink-soft)]">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p>
        <Link to="/" className="mt-6 inline-block font-bold text-[var(--brand)] underline underline-offset-4">
          Kembali ke beranda
        </Link>
      </div>
    </PublicShell>
  );
}
