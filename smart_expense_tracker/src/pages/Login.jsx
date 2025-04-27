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
            const token = await loginToDashboard(telegramId);
            localStorage.setItem("token", token.token);
            localStorage.setItem("telegramId", telegramId);
            navigate("/");
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-bold text-blue-500 text-center">Login</h2>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Enter your Telegram ID"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <span
                        onClick={openTelegram}
                        className="text-sm text-blue-500 hover:underline cursor-pointer text-right"
                    >
                        Get your Telegram ID?
                    </span>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login with Telegram"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
