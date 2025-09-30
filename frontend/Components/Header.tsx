"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUserEmail, signOut } from "../lib/auth";

export default function Header() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const email = getUserEmail();
        if (email) setUserEmail(email);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setUserEmail(null);
        router.push("/auth");
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50 py-6 px-6 md:px-12 flex items-center justify-between bg-[rgba(255,255,255,0.1)] backdrop-blur-md shadow-md">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--secondary)] shadow-lg">
                    <strong className="text-[12px]">TLV</strong>
                </div>
                <nav className="hidden md:flex gap-8 text-sm font-medium text-[var(--primary)]">
                    <Link className="hover:underline" href="/">Главная</Link>
                    <Link className="hover:underline" href="/docs">Документация</Link>
                    <Link className="hover:underline" href="/#how">Как работать</Link>
                </nav>
            </div>

            <div className="flex items-center gap-3">
                {!userEmail ? (
                    <>
                        <Link
                            className="text-sm px-4 py-2 rounded-md border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.05)] transition"
                            href="/auth"
                        >
                            Вход
                        </Link>
                        <Link
                            className="text-sm px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--background)] font-semibold hover:opacity-90 transition"
                            href="/auth?mode=register"
                        >
                            Начать работу
                        </Link>
                    </>
                ) : (
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{userEmail}</span>
                        <button
                            onClick={handleSignOut}
                            className="text-sm px-4 py-2 rounded-md bg-red-500 text-white font-semibold hover:bg-red-700 transition"
                        >
                            Выйти
                        </button>
                        <Link
                            className="text-sm px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--background)] font-semibold hover:opacity-90 transition"
                            href="/auth?mode=register"
                        >
                            Начать работу
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
