"use client";
import React from "react";

export default function Footer() {
    return (
        <footer
            className="border-t py-8 px-6 md:px-12 text-sm"
            style={{
                borderColor: "var(--secondary)",
                color: "rgba(14, 20, 18, 0.6)", // = var(--text) с прозрачностью
            }}
        >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    © {new Date().getFullYear()} Terraform LogViewer — все права защищены
                </div>
                <div className="flex gap-4">
                    <a href="#" style={{ color: "var(--primary)" }}>
                        Политика конфиденциальности
                    </a>
                    <a href="#" style={{ color: "var(--primary)" }}>
                        Контакты
                    </a>
                </div>
            </div>
        </footer>
    );
}
