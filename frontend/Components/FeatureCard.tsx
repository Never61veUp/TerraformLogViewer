"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { Zap, FileText, Database, GitBranch } from "lucide-react";

export default function Features() {
    const features = useMemo(
        () => [
            {
                title: "Автоматическая диагностика",
                desc: "Идентификация типичных ошибок Terraform и подсказки по исправлению.",
                icon: Zap,
            },
            {
                title: "Визуализация логов",
                desc: "Графики и временные ряды для быстрого понимания состояния.",
                icon: FileText,
            },
            {
                title: "Real-time стриминг",
                desc: "WebSocket-подключение для получения логов и уведомлений.",
                icon: Database,
            },
            {
                title: "Рекомендации и прогнозы",
                desc: "ML-движок анализирует ошибки и предлагает меры.",
                icon: GitBranch,
            },
        ],
        []
    );

    return (
        <section id="features" className="relative mt-32 mb-32">
            <motion.h2
                className="text-3xl md:text-4xl font-bold text-center mb-16 text-[var(--text)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Возможности
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto px-6">
                {features.map((f, index) => {
                    const Icon = f.icon;
                    return (
                        <Tilt
                            key={f.title}
                            tiltMaxAngleX={12}
                            tiltMaxAngleY={12}
                            perspective={1000}
                            glareEnable={true}
                            glareMaxOpacity={0.15}
                            className="w-full"
                        >
                            <motion.div
                                className="relative flex flex-col p-8 rounded-2xl border border-[rgba(14,20,18,0.1)] bg-[rgba(255,255,255,0.6)] backdrop-blur-md shadow-md hover:shadow-xl transition-shadow duration-500 overflow-hidden group min-h-[260px]"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                            >
                                {/* Анимированный градиент */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-[var(--primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                {/* Иконка */}
                                <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--secondary)]/40 border border-[var(--accent)] mb-4">
                                    <Icon className="w-7 h-7 text-[var(--accent)]" />
                                </div>

                                {/* Текст */}
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <h3 className="text-xl font-semibold mb-2 text-[var(--text)]">
                                        {f.title}
                                    </h3>
                                    <p className="text-[rgba(14,20,18,0.7)] leading-relaxed flex-1">
                                        {f.desc}
                                    </p>
                                </div>
                            </motion.div>
                        </Tilt>
                    );
                })}
            </div>
        </section>
    );
}
