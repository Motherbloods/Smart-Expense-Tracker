import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginToDashboard } from "../api/loginService";

function Login() {
    const [telegramId, setTelegramId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!telegramId.trim()) {
            setError("Please enter your Telegram ID.");
            return;
        }

        setLoading(true);

        try {
            const response = await loginToDashboard(telegramId);

            // ✅ Token sudah disimpan di HttpOnly cookies oleh backend
            // ✅ Hanya simpan data non-sensitif ke localStorage
            localStorage.setItem("telegramId", telegramId);
            localStorage.setItem("userData", JSON.stringify(response.user));
            console.log("ini reols", response.user.role);

            // ✅ Redirect berdasarkan role
            if (response.user.role === 'admin') {
                navigate("/aktivitas-pengguna");
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error(err);
            setError("Login failed. Please check your Telegram ID and try again.");
        } finally {
            setLoading(false);
        }
    };

    const openTelegram = () => {
        window.open(import.meta.env.VITE_TELEGRAM_BOT_LINK, "_blank");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white font-bold text-2xl">ET</span>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Welcome Back
                    </h2>
                    <p className="text-gray-600 mt-2">Login to manage your expenses</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telegram ID
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your Telegram ID"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={loading}
                        />
                    </div>

                    <div className="text-right">
                        <button
                            type="button"
                            onClick={openTelegram}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                        >
                            Don't have Telegram ID? Get it here →
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Logging in...
                            </span>
                        ) : (
                            "Login with Telegram"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Secure login with HttpOnly cookies
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;