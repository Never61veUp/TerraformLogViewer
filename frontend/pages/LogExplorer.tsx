"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    Search,
    CheckCircle,
    Upload,
    Loader2,
    Filter,
    Group,
} from "lucide-react";
import Header from "../Components/Header";
import Footer from "../Components/Footer";

interface LogEntry {
    id: string;
    tf_req_id: string;
    timestamp: string;
    action: "plan" | "apply";
    level: "INFO" | "WARN" | "ERROR";
    message: string;
    details?: object;
    tf_resource_type?: string;
}

export default function LogExplorer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [read, setRead] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState({
        tf_resource_type: "",
        from: "",
        to: "",
        levels: [] as string[],
        sections: [] as string[],
    });
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
        "idle"
    );
    const [grouped, setGrouped] = useState(false);

    // Защищённая нормализация уровня логов
    const normalizeLevel = (level: any): "INFO" | "WARN" | "ERROR" => {
        if (typeof level !== "string") return "INFO";
        const upper = level.toUpperCase();
        if (["INFO", "WARN", "ERROR"].includes(upper)) return upper as any;
        return "INFO";
    };

    // Нормализация действия
    const normalizeAction = (action: any): "plan" | "apply" => {
        return action === "apply" ? "apply" : "plan";
    };

    // Загрузка
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("loading");

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;

                let parsed: any[] = [];
                if (text.trim().startsWith("[")) {
                    parsed = JSON.parse(text);
                } else {
                    parsed = text
                        .split("\n")
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0)
                        .map((line) => JSON.parse(line));
                }

                if (Array.isArray(parsed)) {
                    const normalized: LogEntry[] = parsed.map((log, i) => ({
                        id: log.id || `${i}`,
                        tf_req_id: log.tf_req_id || "unknown",
                        timestamp: log.timestamp
                            ? new Date(log.timestamp).toISOString()
                            : new Date().toISOString(),
                        action: normalizeAction(log.action),
                        level: normalizeLevel(log.level),
                        message: log.message || "",
                        details: log.details || log,
                        tf_resource_type: log.tf_resource_type || "",
                    }));
                    setLogs(normalized);
                    setStatus("done");
                }
            } catch (err) {
                console.error("Ошибка парсинга файла:", err);
                setStatus("error");
            }
        };
        reader.readAsText(file);
    };

    const toggleRead = (id: string) => {
        setRead((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    // Фильтрация логов
    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.message.toLowerCase().includes(search.toLowerCase()) ||
            log.tf_req_id.toLowerCase().includes(search.toLowerCase());
        const matchesResource = filters.tf_resource_type
            ? log.tf_resource_type === filters.tf_resource_type
            : true;
        const ts = new Date(log.timestamp).getTime();
        const fromOk = filters.from ? ts >= new Date(filters.from).getTime() : true;
        const toOk = filters.to ? ts <= new Date(filters.to).getTime() : true;
        const levelOk =
            filters.levels.length > 0 ? filters.levels.includes(log.level) : true;
        const sectionOk =
            filters.sections.length > 0 ? filters.sections.includes(log.action) : true;

        return (
            matchesSearch && matchesResource && fromOk && toOk && levelOk && sectionOk
        );
    });

    // Группировка
    const groupedLogs = grouped
        ? Object.values(
            filteredLogs.reduce<Record<string, LogEntry[]>>((acc, log) => {
                if (!acc[log.tf_req_id]) acc[log.tf_req_id] = [];
                acc[log.tf_req_id].push(log);
                return acc;
            }, {})
        )
        : [filteredLogs];

    return (
        <>
            <Header />
            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Log Explorer</h1>

                {/* Загрузка файла и группировка */}
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-[var(--secondary)]/30">
                        <Upload className="w-5 h-5" />
                        <span>Загрузить JSON</span>
                        <input
                            type="file"
                            accept="application/json"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>

                    <button
                        onClick={() => setGrouped((g) => !g)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                            grouped ? "bg-[var(--primary)] text-white" : "hover:bg-gray-100"
                        }`}
                    >
                        <Group className="w-5 h-5" />
                        {grouped ? "Группировка включена" : "Группировать по tf_req_id"}
                    </button>
                </div>

                {/* Панель фильтров */}
                {logs.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl border bg-white/60 backdrop-blur shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="w-5 h-5 text-[var(--primary)]" />
                            <span className="font-semibold text-gray-700">Фильтры</span>
                        </div>

                        <div className="flex flex-wrap gap-8">
                            {/* Уровни логов */}
                            <div>
                <span className="block text-sm font-medium text-gray-600 mb-2">
                  Log Levels
                </span>
                                <div className="flex gap-3 flex-wrap">
                                    {Array.from(new Set(logs.map((log) => log.level))).map((lvl) => {
                                        const colors =
                                            lvl === "INFO"
                                                ? "bg-green-100 text-green-700 border-green-300"
                                                : lvl === "WARN"
                                                    ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                                    : "bg-red-100 text-red-700 border-red-300";
                                        const active = filters.levels.includes(lvl);
                                        return (
                                            <button
                                                key={lvl}
                                                onClick={() =>
                                                    setFilters((f) => ({
                                                        ...f,
                                                        levels: active
                                                            ? f.levels.filter((x) => x !== lvl)
                                                            : [...f.levels, lvl],
                                                    }))
                                                }
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                                                    active
                                                        ? colors
                                                        : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                                                }`}
                                            >
                                                {lvl}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Секции */}
                            <div>
                <span className="block text-sm font-medium text-gray-600 mb-2">
                  Sections
                </span>
                                <div className="flex gap-3">
                                    {["plan", "apply"].map((sec) => {
                                        const active = filters.sections.includes(sec);
                                        return (
                                            <button
                                                key={sec}
                                                onClick={() =>
                                                    setFilters((f) => ({
                                                        ...f,
                                                        sections: active
                                                            ? f.sections.filter((x) => x !== sec)
                                                            : [...f.sections, sec],
                                                    }))
                                                }
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                                                    active
                                                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                                        : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                                                }`}
                                            >
                                                {sec}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Статус */}
                {status === "loading" && (
                    <div className="flex items-center gap-2 text-[var(--primary)] mb-6">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Анализ файла...</span>
                    </div>
                )}
                {status === "done" && (
                    <p className="text-green-600 mb-6">
                        ✅ Файл успешно загружен и проанализирован
                    </p>
                )}
                {status === "error" && (
                    <p className="text-red-600 mb-6">❌ Ошибка анализа файла</p>
                )}

                {/* Поиск */}
                {logs.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center rounded-lg border px-3 bg-[var(--background)]">
                            <Search className="w-4 h-4 text-[var(--primary)] mr-2" />
                            <input
                                type="text"
                                placeholder="Поиск по tf_req_id или сообщению..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 py-2 bg-transparent outline-none"
                            />
                        </div>

                        <input
                            type="text"
                            placeholder="tf_resource_type"
                            value={filters.tf_resource_type}
                            onChange={(e) =>
                                setFilters((f) => ({ ...f, tf_resource_type: e.target.value }))
                            }
                            className="rounded-lg border px-3 py-2 bg-[var(--background)]"
                        />

                        <input
                            type="datetime-local"
                            value={filters.from}
                            onChange={(e) =>
                                setFilters((f) => ({ ...f, from: e.target.value }))
                            }
                            className="rounded-lg border px-3 py-2 bg-[var(--background)]"
                        />

                        <input
                            type="datetime-local"
                            value={filters.to}
                            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                            className="rounded-lg border px-3 py-2 bg-[var(--background)]"
                        />
                    </div>
                )}

                {/* Логи */}
                {logs.length === 0 ? (
                    <p className="text-gray-400">Загрузите JSON с логами для анализа.</p>
                ) : (
                    <div className="space-y-6">
                        {groupedLogs.map((group, i) => (
                            <div key={i} className="space-y-4">
                                {grouped && (
                                    <h2 className="text-lg font-semibold">
                                        Группа tf_req_id: {group[0]?.tf_req_id}
                                    </h2>
                                )}
                                {group.map((log) => {
                                    const isExpanded = expanded === log.id;
                                    const isRead = read.has(log.id);

                                    return (
                                        <motion.div
                                            key={log.id}
                                            layout
                                            className={`rounded-xl border p-4 transition cursor-pointer ${
                                                isRead
                                                    ? "opacity-50 border-gray-300"
                                                    : "border-[var(--primary)]/30"
                                            }`}
                                            onClick={() => setExpanded(isExpanded ? null : log.id)}
                                        >
                                            {/* Заголовок */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-wrap">
                          <span
                              className={`text-xs font-bold px-2 py-1 rounded ${
                                  log.level === "INFO"
                                      ? "bg-green-100 text-green-800"
                                      : log.level === "WARN"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                              }`}
                          >
                            {log.level}
                          </span>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded ${
                                                            log.action === "plan"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-purple-100 text-purple-800"
                                                        }`}
                                                    >
                            {log.action}
                          </span>
                                                    <span className="text-sm font-mono text-gray-600">
                            {log.timestamp}
                          </span>
                                                    {log.tf_resource_type && (
                                                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                              {log.tf_resource_type}
                            </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">ID: {log.id}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleRead(log.id);
                                                        }}
                                                        className="p-1 hover:text-[var(--primary)]"
                                                    >
                                                        <CheckCircle
                                                            className={`w-5 h-5 ${
                                                                isRead ? "text-[var(--primary)]" : "text-gray-400"
                                                            }`}
                                                        />
                                                    </button>
                                                    <ChevronDown
                                                        className={`w-5 h-5 transition ${
                                                            isExpanded ? "rotate-180" : ""
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Сообщение */}
                                            <div className="mt-2">{log.message}</div>

                                            {/* Детали JSON */}
                                            <AnimatePresence>
                                                {isExpanded && log.details && (
                                                    <motion.pre
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-3 p-3 rounded bg-gray-50 border text-sm overflow-x-auto"
                                                    >
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </motion.pre>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
