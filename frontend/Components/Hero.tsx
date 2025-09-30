"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";

interface ChartPoint {
    x: string;
    y: number;
}

interface LiveMiniChartProps {
    data: ChartPoint[];
}

const LiveMiniChart = dynamic<LiveMiniChartProps>(
    () =>
        import("recharts").then((mod) => {
            const { LineChart, Line, ResponsiveContainer } = mod;
            return function Chart({ data }: LiveMiniChartProps) {
                return (
                    <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={data}>
                            <Line
                                dataKey="y"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                dot={false}
                                animationDuration={300}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
            };
        }),
    { ssr: false }
);

export default function Hero() {
    const [lines, setLines] = useState<string[]>([]);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);

    useEffect(() => {
        let counter = 0;
        const interval = setInterval(() => {
            counter += 1;
            const time = new Date().toLocaleTimeString();
            setLines((prev) => [
                `${time} ▶ terraform.apply: module.webserver (${
                    Math.random() > 0.9
                        ? "ERROR"
                        : Math.random() > 0.7
                            ? "WARNING"
                            : "INFO"
                }) — line ${counter}`,
                ...prev.slice(0, 24),
            ]);
            setChartData((prev) => [
                { x: String(counter), y: Math.round(10 + Math.random() * 60) },
                ...prev.slice(0, 19),
            ]);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-28 md:pt-32">
            {/* blobs */}
            <div
                aria-hidden
                className="absolute right-[-6rem] top-8 blob w-72 h-72 rounded-full bg-[var(--primary)] opacity-20"
            />
            <div
                aria-hidden
                className="absolute left-[-6rem] bottom-4 blob w-56 h-56 rounded-full bg-[var(--accent)] opacity-10"
            />

            <div className="md:col-span-7">
                <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl leading-tight font-extrabold text-[var(--text)]"
                >
                    Terraform LogViewer
                    <br />{" "}
                    <span className="text-[var(--primary)]">
                        от хаоса к порядку
                    </span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 max-w-xl text-lg text-[rgba(14,20,18,0.75)]"
                >
                    Автоматическая диагностика, понятные визуализации и real-time
                    стриминг логов для быстрого реагирования и стабильных релизов.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="mt-6 flex gap-3"
                >
                    <Link
                        href="/LogExplorer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--primary)] text-[var(--background)] font-semibold"
                    >
                        Начать работу
                    </Link>
                    <a
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[rgba(14,20,18,0.1)] text-sm text-[var(--text)]"
                        href="#"
                    >
                        Посмотреть демо
                    </a>
                </motion.div>
            </div>

            <aside className="md:col-span-5">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl border border-[rgba(14,20,18,0.1)] bg-[rgba(0,0,0,0.02)] p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-[rgba(14,20,18,0.6)]">
                            Live log stream
                        </div>
                        <div className="text-xs text-[var(--primary)]">
                            connected
                        </div>
                    </div>
                    <div className="h-44 overflow-hidden rounded-md bg-[rgba(255,255,255,0.7)] p-3 text-[12px] font-mono leading-snug text-[var(--text)]">
                        <div className="flex flex-col-reverse gap-2">
                            {lines.map((ln, idx) => {
                                let className = "truncate text-[rgba(14,20,18,0.8)]";
                                if (ln.includes("ERROR")) {
                                    className =
                                        "truncate text-[var(--error)] font-semibold";
                                } else if (ln.includes("WARNING")) {
                                    className =
                                        "truncate text-[var(--warning)] font-medium";
                                }
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className={className}
                                    >
                                        {ln}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mt-4">
                        <LiveMiniChart data={chartData.slice().reverse()} />
                    </div>
                </motion.div>
                <div className="mt-4 text-sm text-[rgba(14,20,18,0.7)]">
                    Быстрый предварительный просмотр: тренды, всплески ошибок и
                    рекомендации — всё на одном экране.
                </div>
            </aside>
        </section>
    );
}
