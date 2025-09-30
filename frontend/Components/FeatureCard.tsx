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
        <section id="features" className="relative py-24 md:py-32 overflow-visible">
            <motion.h2
                className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-[var(--text)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="bg-gradient-to-r from-[var(--primary)]/90 to-[var(--accent)]/90 bg-clip-text ">
                    Возможности
                </span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 max-w-6xl mx-auto px-4 md:px-0 relative z-10">
                {features.map((f, index) => {
                    const Icon = f.icon;
                    return (
                        <Tilt
                            key={f.title}
                            tiltMaxAngleX={10}
                            tiltMaxAngleY={10}
                            perspective={1000}
                            glareEnable={true}
                            glareMaxOpacity={0.05}
                            className="w-full"
                        >
                            <motion.div
                                className="group relative flex flex-col p-8 md:p-10 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-500 min-h-[260px]"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                {/* Слабый hover градиент */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-[var(--primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl" />

                                {/* Иконка */}
                                <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--background)]/50 mb-4 shadow-inner">
                                    <Icon className="w-7 h-7 text-[var(--primary)]" />
                                </div>

                                {/* Текст */}
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <h3 className="text-xl font-semibold mb-2 text-[var(--text)]">
                                        {f.title}
                                    </h3>
                                    <p className="text-[rgba(14,20,18,0.7)] leading-relaxed flex-1 text-sm md:text-base">
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
