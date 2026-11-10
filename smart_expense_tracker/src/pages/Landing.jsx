import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { PublicShell, BOT_URL } from "../components/PublicLayout";

const steps = [
  {
    title: "Mulai dari bot Telegram",
    text: "Buka bot Smart Expense Tracker lalu kirim /start. Akun dibuat otomatis dan bot mengirim ID Telegram beserta kode login sekali pakai.",
  },
  {
    title: "Catat lewat pesan biasa",
    text: "Tulis nama pengeluaran dan nominalnya. Beberapa pengeluaran bisa dikirim sekaligus dengan memisahkannya dengan koma atau baris baru.",
  },
  {
    title: "Pantau di dashboard",
    text: "Masuk dengan ID Telegram dan kode dari bot untuk melihat ringkasan, anggaran bulanan, dan laporan.",
  },
];

const features = [
  ["Catat dari Telegram", "Kirim pengeluaran sebagai pesan, satu per satu atau beberapa sekaligus."],
  ["Kategori otomatis", "Kategori diprediksi dari nama pengeluaran. Jika kurang yakin, Anda bisa mengoreksinya langsung di chat."],
  ["Pemasukan dan sumber dana", "Catat pemasukan dengan perintah /pemasukan. Setiap pengeluaran mengurangi sisa dari sumber pemasukan yang dipakai."],
  ["Anggaran bulanan", "Tetapkan anggaran per bulan dan lihat berapa yang sudah terpakai."],
  ["Laporan", "Lihat ringkasan per periode, unduh sebagai CSV, atau cetak."],
  ["Pembaruan langsung", "Pengeluaran yang dicatat lewat Telegram muncul di dashboard tanpa perlu memuat ulang halaman."],
];

export default function Landing() {
  usePageMeta({
    title: "Smart Expense Tracker: Catat Pengeluaran Lewat Telegram",
    description:
      "Aplikasi pencatat pengeluaran pribadi. Catat pengeluaran dan pemasukan lewat bot Telegram, atur anggaran bulanan, dan pantau laporan di dashboard.",
    robots: "index,follow",
    path: "/",
  });

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-5xl gap-12 px-5 pb-6 pt-14 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pt-20">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[var(--brand)]">
            Pencatat pengeluaran pribadi
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Catat pengeluaran dari obrolan Telegram.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ink-soft)]">
            Kirim pesan seperti biasa, kategorinya ditentukan otomatis, lalu lihat ringkasan
            pengeluaran, pemasukan, dan anggaran bulanan Anda di satu dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/login"
              className="rounded-md bg-[var(--brand)] px-6 py-3 font-bold text-white hover:bg-[var(--brand-dark)]"
            >
              Masuk ke dashboard
            </Link>
            {BOT_URL && (
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[var(--brand)] underline underline-offset-4"
              >
                Buka bot Telegram
              </a>
            )}
          </div>
        </div>

        <figure className="font-mono-num text-sm" aria-labelledby="contoh-caption">
          <div className="border-l-4 border-[var(--brand)] bg-[var(--surface-alt)] p-5">
            <p className="mb-1 text-xs uppercase tracking-widest text-[var(--ink-soft)]">Pesan ke bot</p>
            <p className="text-base font-medium">makan siang 25000</p>
            <div className="my-4 border-t border-dashed border-[var(--line)]" />
            <p className="mb-2 text-xs uppercase tracking-widest text-[var(--ink-soft)]">Tercatat</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
              <dt className="text-[var(--ink-soft)]">Nama</dt>
              <dd className="text-right">Makan siang</dd>
              <dt className="text-[var(--ink-soft)]">Kategori</dt>
              <dd className="text-right">Makanan</dd>
              <dt className="text-[var(--ink-soft)]">Jumlah</dt>
              <dd className="text-right font-bold">Rp 25.000</dd>
            </dl>
          </div>
          <figcaption id="contoh-caption" className="mt-2 text-xs text-[var(--ink-soft)]">
            Contoh ilustrasi alur pencatatan, bukan data pengguna.
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto max-w-5xl px-5 pt-20" aria-labelledby="cara-kerja">
        <h2 id="cara-kerja" className="text-2xl font-extrabold tracking-tight">Cara memulai</h2>
        <ol className="mt-8 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-[var(--ink)] pt-4">
              <span className="font-mono-num text-sm font-bold text-[var(--brand)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-[var(--ink-soft)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-5 pt-20" aria-labelledby="fitur">
        <h2 id="fitur" className="text-2xl font-extrabold tracking-tight">Fitur yang tersedia</h2>
        <dl className="mt-8 grid gap-x-12 gap-y-7 md:grid-cols-2">
          {features.map(([name, text]) => (
            <div key={name} className="border-b border-[var(--line)] pb-6">
              <dt className="font-bold">{name}</dt>
              <dd className="mt-1 leading-relaxed text-[var(--ink-soft)]">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-5xl px-5 pt-20" aria-labelledby="data-anda">
        <h2 id="data-anda" className="text-2xl font-extrabold tracking-tight">Data Anda</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--ink-soft)]">
          Aplikasi ini menyimpan data keuangan pribadi, sehingga halaman dashboard tidak ditampilkan di
          mesin pencari dan hanya bisa dibuka setelah masuk dengan kode dari bot Telegram. Rincian data
          yang disimpan dan pihak yang memprosesnya ada di{" "}
          <Link to="/privasi" className="font-bold text-[var(--brand)] underline underline-offset-4">
            kebijakan privasi
          </Link>
          .
        </p>
      </section>
    </PublicShell>
  );
}
