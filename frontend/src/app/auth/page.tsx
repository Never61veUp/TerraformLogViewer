"use client";
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { login, register } from "@/lib/api";
import { setTokenCookie } from "@/lib/cookie";
import {setUserEmail} from "@/lib/auth";

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<null | { type: "success" | "error"; message: string }>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const spotlightRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        if (spotlightRef.current) {
            spotlightRef.current.style.background = `radial-gradient(140px at ${clientX}px ${clientY}px, var(--accent), transparent 70%)`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (mode === "login") {
                const data = await login(email, password);

                localStorage.setItem("token", data.access_token);
                setTokenCookie(data.access_token);
                setUserEmail(email);

                setStatus({ type: "success", message: "Успешный вход!" });
                router.push("/");
            } else {
                await register(email, password);
                setStatus({ type: "success", message: "Регистрация успешна! Войдите." });
                setMode("login");
            }
        } catch (err: any) {
            console.error(err);
            setStatus({ type: "error", message: err.message || "Ошибка" });
        }
    };

    return (
        <section
            className="relative flex min-h-screen bg-[var(--background)] overflow-hidden text-[var(--text)]"
            onMouseMove={handleMouseMove}
        >
            <div ref={spotlightRef} className="pointer-events-none absolute inset-0 transition duration-300 animate-[pulse_4s_ease-in-out_infinite]" />

            <div className="hidden md:flex md:w-1/2 relative items-center justify-center p-12 overflow-hidden">
                <motion.div
                    aria-hidden
                    className="absolute top-[-10rem] left-[-8rem] w-[28rem] h-[28rem] rounded-full bg-[var(--primary)]/30 blur-3xl"
                    animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    aria-hidden
                    className="absolute bottom-[-6rem] right-[-6rem] w-[22rem] h-[22rem] rounded-full bg-[var(--secondary)]/25 blur-2xl"
                    animate={{ y: [0, 15, 0], scale: [1, 0.95, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center max-w-md"
                >
                    <h1 className="text-4xl font-extrabold leading-tight mb-6 text-[var(--text)]">
                        Terraform LogViewer
                    </h1>
                    <p className="text-lg text-[rgba(14,20,18,0.75)] mb-8">
                        От хаоса к порядку: анализируй Terraform-логи, получай подсказки и будь на шаг впереди.
                    </p>
                </motion.div>
            </div>

            {/* форма */}
            <div className="flex w-full md:w-1/2 items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative w-full max-w-md rounded-2xl border border-[rgba(14,20,18,0.1)] bg-[rgba(255,255,255,0.6)] backdrop-blur-xl p-8 shadow-2xl"
                >
                    <h2 className="text-2xl font-bold text-center mb-8">
                        {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
                    </h2>

                    <div className="flex justify-center gap-4 mb-10">
                        <button
                            onClick={() => setMode("login")}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                                mode === "login"
                                    ? "bg-[var(--primary)] text-[var(--background)] shadow-lg"
                                    : "text-[rgba(14,20,18,0.6)] hover:text-[var(--text)]"
                            }`}
                        >
                            Войти
                        </button>
                        <button
                            onClick={() => setMode("register")}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                                mode === "register"
                                    ? "bg-[var(--primary)] text-[var(--background)] shadow-lg"
                                    : "text-[rgba(14,20,18,0.6)] hover:text-[var(--text)]"
                            }`}
                        >
                            Регистрация
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm mb-2">Почта</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(14,20,18,0.6)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-[rgba(14,20,18,0.15)] bg-[rgba(255,255,255,0.9)] pl-10 pr-4 py-3 text-sm outline-none focus:border-[var(--primary)] transition"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm mb-2">Пароль</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(14,20,18,0.6)]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-[rgba(14,20,18,0.15)] bg-[rgba(255,255,255,0.9)] pl-10 pr-10 py-3 text-sm outline-none focus:border-[var(--primary)] transition"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(14,20,18,0.6)] hover:text-[var(--text)]"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            className="w-full rounded-lg bg-[var(--primary)] py-3 font-semibold text-[var(--background)] hover:opacity-90 transition"
                        >
                            {mode === "login" ? "Войти" : "Зарегистрироваться"}
                        </motion.button>
                    </form>

                    {/* статус */}
                    {status && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`mt-6 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                                status.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                            {status.type === "success" ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" /> {status.message}
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4" /> {status.message}
                                </>
                            )}
                        </motion.div>
                    )}

                    {mode === "login" && (
                        <p className="mt-6 text-center text-sm text-[rgba(14,20,18,0.7)]">
                            Нет аккаунта?{" "}
                            <button onClick={() => setMode("register")} className="text-[var(--primary)] hover:underline">
                                Зарегистрируйтесь
                            </button>
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
