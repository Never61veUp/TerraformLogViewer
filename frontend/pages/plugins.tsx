// pages/plugins.tsx
"use client";
import React from "react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

export default function PluginsPage() {
    // здесь показаны примеры: загрузка плагина, демонстрация запроса к gRPC gateway (mock)
    return (
        <>
            <Header />
            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Плагины / Integrations (mock)</h1>
                <p className="mb-4 text-gray-600">
                    Здесь можно подключать gRPC-плагины, которые будут фильтровать/агрегировать логи.
                    Пока — демонстрация концепции и пример curl.
                </p>

                <section className="bg-white p-4 rounded shadow-sm mb-4">
                    <h2 className="font-semibold mb-2">Пример: вызвать фильтр-плагин (mock)</h2>
                    <p className="text-sm text-gray-700 mb-2">
                        Предположим, есть gRPC gateway на <code>http://localhost:8080/plugin/filter</code>.
                        Можно вызвать его через curl:
                    </p>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST http://localhost:8080/plugin/filter \\
  -H "Content-Type: application/json" \\
  -d '{"level": "ERROR", "min_count": 2}'`}
          </pre>
                    <p className="text-sm text-gray-600 mt-2">В реальной реализации сервер проксирует gRPC вызов к плагину.</p>
                </section>

                <section className="bg-white p-4 rounded shadow-sm">
                    <h2 className="font-semibold mb-2">Что реализовать дальше</h2>
                    <ul className="list-disc pl-6 text-gray-700">
                        <li>gRPC server + gateway (envoy/grpc-gateway) для плагинов.</li>
                        <li>front-end: регистрация плагина, параметры фильтра.</li>
                        <li>демонстрация: подключить плагин, показать результаты фильтрации.</li>
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}
