import usePageMeta from "../hooks/usePageMeta";
import { PublicShell } from "../components/PublicLayout";

const sections = [
  {
    id: "data-disimpan",
    title: "Data yang disimpan",
    items: [
      "ID Telegram dan username Telegram Anda, diambil saat Anda mengirim /start ke bot.",
      "Pengeluaran: nama, jumlah, kategori, tanggal, sumber pemasukan, dan tingkat keyakinan prediksi kategori.",
      "Pemasukan: nama, sumber, jumlah, sisa dana, catatan, dan tanggal.",
      "Anggaran bulanan yang Anda tetapkan.",
      "Log aktivitas berisi tindakan menambah, mengubah, dan menghapus pengeluaran atau pemasukan.",
      "Kode login sementara dalam bentuk hash. Kode berlaku 5 menit, hanya bisa dipakai sekali, lalu dihapus otomatis.",
    ],
  },
  {
    id: "penggunaan",
    title: "Cara data digunakan",
    items: [
      "Menampilkan pengeluaran, pemasukan, anggaran, dan laporan di dashboard Anda.",
      "Menentukan kategori pengeluaran dari teks yang Anda kirim ke bot. Teks tersebut diproses oleh layanan klasifikasi yang dijalankan pengembang.",
      "Koreksi kategori yang Anda kirim lewat bot dapat dicatat untuk memperbaiki prediksi.",
      "Administrator aplikasi dapat melihat data pengguna dalam laporan keseluruhan dan log aktivitas.",
    ],
  },
  {
    id: "pihak-ketiga",
    title: "Layanan pihak ketiga",
    items: [
      "Telegram: pesan yang Anda kirim ke bot melewati server Telegram.",
      "Pusher: mengirim notifikasi pembaruan langsung ke dashboard Anda melalui channel privat yang hanya bisa diakses setelah Anda masuk.",
      "Google Fonts: huruf halaman dimuat dari server Google, sehingga alamat IP Anda diterima Google.",
    ],
  },
  {
    id: "penyimpanan-browser",
    title: "Penyimpanan di browser",
    items: [
      "Cookie HttpOnly untuk sesi login. Cookie ini tidak dapat dibaca oleh JavaScript halaman.",
      "localStorage menyimpan ID Telegram, username, dan peran akun untuk mengatur tampilan. Data ini dihapus saat Anda keluar.",
      "Aplikasi tidak memasang analytics atau pelacak iklan.",
    ],
  },
  {
    id: "kendali",
    title: "Kendali Anda",
    items: [
      "Pengeluaran dan pemasukan dapat dihapus dari dashboard.",
      "Belum ada fitur hapus akun otomatis. Permintaan penghapusan akun dapat disampaikan kepada pengembang melalui bot Telegram.",
      "Belum ada kebijakan penghapusan otomatis untuk data lama.",
    ],
  },
];

export default function Privasi() {
  usePageMeta({
    title: "Kebijakan Privasi | Smart Expense Tracker",
    description:
      "Data apa saja yang disimpan Smart Expense Tracker, bagaimana digunakan, layanan pihak ketiga yang terlibat, dan kendali yang Anda miliki.",
    robots: "index,follow",
    path: "/privasi",
  });

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight">Kebijakan privasi</h1>
        <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
          Smart Expense Tracker menyimpan data keuangan pribadi. Halaman ini menjelaskan apa yang
          disimpan dan bagaimana data tersebut diperlakukan sesuai cara aplikasi bekerja saat ini.
        </p>
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id} className="mt-10">
            <h2 id={section.id} className="text-xl font-extrabold">{section.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-[var(--ink-soft)]">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </PublicShell>
  );
}
