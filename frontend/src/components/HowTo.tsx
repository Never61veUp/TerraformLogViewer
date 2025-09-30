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
        <section id="how" className="mt-32 mb-32 relative overflow-hidden">
            {/* Живые blobs */}
            <motion.div
                aria-hidden
                className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full blur-3xl opacity-20"
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 10 }}
            />
            <motion.div
                aria-hidden
                className="absolute -bottom-32 right-0 w-[28rem] h-[28rem] bg-gradient-to-tr from-[var(--accent)] to-[var(--primary)] rounded-full blur-3xl opacity-20"
                animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
                transition={{ repeat: Infinity, duration: 12 }}
            />

            {/* Заголовок */}
            <motion.h2
                className="text-4xl md:text-5xl font-extrabold text-center mb-20 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                    Как это работает
                </span>
            </motion.h2>

            {/* Шаги */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 px-6 relative z-10">
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        className="group relative p-10 rounded-2xl bg-white/40 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-500"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.2 }}
                        whileHover={{ scale: 1.03 }}
                    >
                        {/* Большая цифра */}
                        <div className="absolute top-6 right-8 text-6xl font-extrabold text-[var(--primary)]/10 select-none">
                            {`0${index + 1}`}
                        </div>

                        {/* Анимированная иконка */}
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--background)] mb-6 shadow-inner"
                        >
                            <CheckCircle className="w-8 h-8 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                        </motion.div>

                        {/* Текст */}
                        <h3 className="text-xl font-semibold mb-3 text-[var(--text)]">
                            {step.title}
                        </h3>
                        <p className="text-[rgba(14,20,18,0.75)] leading-relaxed">
                            {step.desc}
                        </p>

                        {/* Hover-свет */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-[var(--primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
