import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginToDashboard } from "../api/loginService";
import usePageMeta from "../hooks/usePageMeta";
import { PublicShell, BOT_URL } from "../components/PublicLayout";

export default function Login() {
  usePageMeta({
    title: "Masuk | Smart Expense Tracker",
    description: "Masuk ke dashboard Smart Expense Tracker dengan ID Telegram dan kode login dari bot.",
    robots: "noindex,follow",
    path: "/login",
  });

  const navigate = useNavigate();
  const [telegramId, setTelegramId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^\d{1,20}$/.test(telegramId.trim())) {
      setError("ID Telegram hanya berisi angka.");
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Kode login terdiri dari 6 angka.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginToDashboard(telegramId.trim(), code.trim());
      if (result.success) {
        navigate(result.user?.role === "admin" ? "/aktivitas-pengguna" : "/", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
        <PublicShell fitScreen>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-8 md:grid-cols-[1fr_1.1fr] md:gap-12">   <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Masuk ke dashboard</h1>
          <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
            Login memakai ID Telegram dan kode sekali pakai yang dikirim oleh bot.
          </p>
          <ol className="mt-8 space-y-4 text-[var(--ink-soft)]">
            <li className="flex gap-4">
              <span className="font-mono-num font-bold text-[var(--brand)]">01</span>
              <span>
                Buka bot Telegram
                {BOT_URL && (
                  <>
                    {" "}
                    (
                    <a
                      href={BOT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[var(--brand)] underline underline-offset-4"
                    >
                      buka bot
                    </a>
                    )
                  </>
                )}{" "}
                dan kirim <code className="font-mono-num">/start</code> atau{" "}
                <code className="font-mono-num">/login</code>.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono-num font-bold text-[var(--brand)]">02</span>
              <span>Salin ID Telegram dan kode 6 angka dari balasan bot. Kode berlaku 5 menit.</span>
            </li>
            <li className="flex gap-4">
              <span className="font-mono-num font-bold text-[var(--brand)]">03</span>
              <span>Isi keduanya pada formulir ini.</span>
            </li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-describedby={error ? "login-error" : undefined}>
          <div>
            <label htmlFor="telegramId" className="mb-1 block text-sm font-bold">
              ID Telegram
            </label>
            <input
              id="telegramId"
              name="telegramId"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ""))}
              placeholder="Contoh: 123456789"
              maxLength={20}
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-4 py-3 font-mono-num"
            />
          </div>
          <div>
            <label htmlFor="code" className="mb-1 block text-sm font-bold">
              Kode login
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 angka"
              maxLength={6}
              required
              className="w-full rounded-md border border-[var(--line)] bg-white px-4 py-3 font-mono-num tracking-[0.3em]"
            />
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-sm font-semibold text-[var(--danger)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--brand)] px-6 py-3 font-bold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
          <p className="text-sm text-[var(--ink-soft)]">
            Dengan masuk, Anda menyetujui penggunaan data seperti dijelaskan di{" "}
            <Link to="/privasi" className="font-bold text-[var(--brand)] underline underline-offset-4">
              kebijakan privasi
            </Link>
            .
          </p>
        </form>
      </div>
    </PublicShell>
  );
}
