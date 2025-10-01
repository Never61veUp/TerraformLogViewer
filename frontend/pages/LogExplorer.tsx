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
    X,
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
    tf_resource_type: string;
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
    const [filtersOpen, setFiltersOpen] = useState(false);

    const normalizeLevel = (level: any): "INFO" | "WARN" | "ERROR" => {
        if (typeof level !== "string") return "INFO";
        const upper = level.toUpperCase();
        if (["INFO", "WARN", "ERROR"].includes(upper)) return upper as any;
        return "INFO";
    };

    const normalizeAction = (action: any): "plan" | "apply" => {
        return action === "apply" ? "apply" : "plan";
    };

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
                        tf_resource_type: log.tf_resource_type || "—",
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

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.message.toLowerCase().includes(search.toLowerCase()) ||
            log.tf_req_id.toLowerCase().includes(search.toLowerCase());
        const matchesResource = filters.tf_resource_type
            ?log.tf_resource_type
                .toLowerCase()
                .includes(filters.tf_resource_type.toLowerCase())
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

    const groupedLogs = grouped
        ? Object.values(
            filteredLogs.reduce<Record<string, LogEntry[]>>((acc, log) => {
                if (!acc[log.tf_req_id]) acc[log.tf_req_id] = [];
                acc[log.tf_req_id].push(log);
                return acc;
            }, {})
        )
        : [filteredLogs];

    const activeFiltersCount =
        (filters.tf_resource_type ? 1 : 0) +
        (filters.from ? 1 : 0) +
        (filters.to ? 1 : 0) +
        filters.levels.length +
        filters.sections.length;

    return (
        <>
            <Header />
            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Log Explorer</h1>

                <div className="mb-6 flex flex-wrap justify-between items-center">
                    <div className="flex gap-4">

                        <label className="h-11 px-4 py-2 flex items-center gap-2 rounded-lg border bg-white hover:bg-gray-100 cursor-pointer transition">
                            {status === "loading" ? (
                                <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                            ) : (
                                <Upload className="w-5 h-5 text-[var(--primary)]" />
                            )}
                            <span>
                {status === "loading" ? "Загрузка..." : "Загрузить JSON"}
              </span>
                            <input
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>

                        <button
                            onClick={() => setGrouped((g) => !g)}
                            className={`h-11 px-4 py-2 flex items-center gap-2 rounded-lg border transition ${
                                grouped
                                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                    : "bg-white hover:bg-gray-100"
                            }`}
                        >
                            <Group className="w-5 h-5" />
                            {grouped ? "Группировка включена" : "Группировать по tf_req_id"}
                        </button>
                    </div>

                    {/* фильтры */}
                    <button
                        onClick={() => setFiltersOpen(true)}
                        className="relative h-11 px-4 py-2 flex items-center gap-2 rounded-lg border bg-white hover:bg-gray-100 transition"
                    >
                        <Filter className="w-5 h-5 text-[var(--primary)]" />
                        Фильтры
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                {activeFiltersCount}
              </span>
                        )}
                    </button>
                </div>

                {/* поиски */}
                {logs.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">

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


                        <div className="flex items-center rounded-lg border px-3 bg-[var(--background)]">
                            <Search className="w-4 h-4 text-[var(--primary)] mr-2" />
                            <input
                                type="text"
                                placeholder="Поиск по tf_resource_type..."
                                value={filters.tf_resource_type}
                                onChange={(e) =>
                                    setFilters((f) => ({
                                        ...f,
                                        tf_resource_type: e.target.value,
                                    }))
                                }
                                className="flex-1 py-2 bg-transparent outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* логи */}
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
                                            onClick={() =>
                                                setExpanded(isExpanded ? null : log.id)
                                            }
                                        >
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
                                                    {/* tf_req_id и tf_resource_type рядом */}
                                                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                            req_id: {log.tf_req_id}
                          </span>
                                                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                            type: {log.tf_resource_type}
                          </span>
                                                    <span className="text-xs text-gray-500">
                            ID: {log.id}
                          </span>
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
                                                                isRead
                                                                    ? "text-[var(--primary)]"
                                                                    : "text-gray-400"
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

                                            {/* сообщение */}
                                            <div className="mt-2">{log.message}</div>

                                            {/* детали JSON */}
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

            {/* боковая панель фильтров */}
            <AnimatePresence>
                {filtersOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setFiltersOpen(false)}
                        />
                        <motion.div
                            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-lg z-50 flex flex-col"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >

                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <h2 className="text-lg font-semibold">Фильтры</h2>
                                <button onClick={() => setFiltersOpen(false)}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto space-y-6">
                                {/* уровни */}
                                <div>
                                    <p className="text-sm font-medium mb-2">Уровни логов</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {Array.from(new Set(logs.map((log) => log.level))).map(
                                            (lvl) => {
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
                                                        className={`px-3 py-1 text-xs rounded-full border ${
                                                            active
                                                                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                                                : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                                                        }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>

                                {/* секции */}
                                <div>
                                    <p className="text-sm font-medium mb-2">Секции</p>
                                    <div className="flex gap-2">
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
                                                    className={`px-3 py-1 text-xs rounded-full border ${
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

                                {/* даты */}
                                <div className="space-y-3">
                                    <input
                                        type="datetime-local"
                                        value={filters.from}
                                        onChange={(e) =>
                                            setFilters((f) => ({ ...f, from: e.target.value }))
                                        }
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={filters.to}
                                        onChange={(e) =>
                                            setFilters((f) => ({ ...f, to: e.target.value }))
                                        }
                                        className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                                    />
                                </div>
                            </div>

                            {/* кнопки */}
                            <div className="p-4 border-t flex justify-between">
                                <button
                                    onClick={() =>
                                        setFilters({
                                            tf_resource_type: "",
                                            from: "",
                                            to: "",
                                            levels: [],
                                            sections: [],
                                        })
                                    }
                                    className="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200 text-sm"
                                >
                                    Сбросить
                                </button>
                                <button
                                    onClick={() => setFiltersOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm"
                                >
                                    Применить
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
