"use client";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function HowTo() {
    const steps = [
        {
            title: "Регистрация",
            desc: "Создайте аккаунт и настройте проект за пару минут.",
        },
        {
            title: "Загрузка логов",
            desc: "Загрузите Terraform-логи или подключите поток через WebSocket / syslog.",
        },
        {
            title: "Аналитика",
            desc: "Получите автоматические рекомендации, визуализации и прогнозы ошибок.",
        },
    ];

    return (
        <section id="how" className="relative py-20 md:py-28 overflow-visible">
            {/* Фоновые blobs */}
            <motion.div
                aria-hidden
                className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full blur-3xl opacity-20"
                animate={{ x: [0, 30, 0], y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 12 }}
            />
            <motion.div
                aria-hidden
                className="absolute -bottom-32 right-0 w-[24rem] h-[24rem] bg-gradient-to-tr from-[var(--accent)] to-[var(--primary)] rounded-full blur-3xl opacity-20"
                animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
                transition={{ repeat: Infinity, duration: 14 }}
            />

            {/* Заголовок в стиле "Возможности" */}
            <motion.h2
                className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-[var(--text)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                    Как это работает
                </span>
            </motion.h2>

            {/* Шаги */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 px-4 md:px-0 relative z-10">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        className="group relative p-8 md:p-10 rounded-2xl bg-white/20 backdrop-blur-md shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.15 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--background)] mb-5 shadow-inner"
                        >
                            <CheckCircle className="w-8 h-8 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                        </motion.div>

                        <h3 className="text-lg md:text-xl font-semibold mb-2 text-[var(--text)]">
                            {step.title}
                        </h3>
                        <p className="text-[rgba(14,20,18,0.7)] leading-relaxed text-sm md:text-base">
                            {step.desc}
                        </p>

                        {/* Лёгкий hover градиент */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-[var(--primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
