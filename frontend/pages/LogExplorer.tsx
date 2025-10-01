"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    CheckCircle,
    Upload,
    Loader2,
    Group,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

import Header from "../Components/Header";
import Footer from "../Components/Footer";
import JsonViewer from "../Components/JsonViewer";

interface LogEntry {
    id: string;
    tf_req_id: string;
    timestamp: string;
    action: "plan" | "apply";
    level: "INFO" | "WARN" | "ERROR";
    section?: "plan" | "apply" | null;
    message: string;
    details?: any;
    tf_resource_type: string;
}

export default function LogExplorer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [read, setRead] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [grouped, setGrouped] = useState(false);
    const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

    const [searchQuery, setSearchQuery] = useState("");
    const [tfTypeFilter, setTfTypeFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [timestampRange, setTimestampRange] = useState<[string, string] | null>(null);

    const API_URL = "https://api.terraformlogviewer.ru";

    // ======= Helpers =======
    const normalizeLevel = (level: any, message?: string): "INFO" | "WARN" | "ERROR" => {
        if (typeof level === "string" && ["INFO", "WARN", "ERROR"].includes(level.toUpperCase()))
            return level.toUpperCase() as any;
        if (message) {
            if (/error/i.test(message)) return "ERROR";
            if (/warn/i.test(message)) return "WARN";
        }
        return "INFO";
    };

    const normalizeAction = (action: any): "plan" | "apply" => {
        return action === "apply" ? "apply" : "plan";
    };

    const extractTimestamp = (msg: string): string => {
        const tsRegex = /\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/;
        const match = msg.match(tsRegex);
        return match ? new Date(match[0]).toISOString() : new Date().toISOString();
    };

    const detectTerraformSection = (msg: string): "plan" | "apply" | null => {
        if (/^Terraform Plan/i.test(msg)) return "plan";
        if (/^Terraform Apply/i.test(msg)) return "apply";
        return null;
    };

    // ======= File Upload =======
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("loading");

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;

                const formData = new FormData();
                const blob = new Blob([text], { type: "application/json" });
                formData.append("file", blob, file.name);

                const res = await fetch(`${API_URL}/api/logs/terraform/upload-log-json`, {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error("Ошибка загрузки на сервер");

                const data = await res.json();

                if (Array.isArray(data)) {
                    const normalized: LogEntry[] = data.map((log: any, i: number) => ({
                        id: log.id || `${i}`,
                        tf_req_id: log.tf_req_id?.trim() ? log.tf_req_id : log.id,
                        timestamp: log.timestamp
                            ? new Date(log.timestamp).toISOString()
                            : extractTimestamp(log.message || ""),
                        action: normalizeAction(log.action),
                        level: normalizeLevel(log.level, log.message),
                        section: detectTerraformSection(log.message || ""),
                        message: log.message || "",
                        details: log.details || log,
                        tf_resource_type: log.tf_resource_type || "—",
                    }));
                    setLogs(normalized);
                    setStatus("done");
                } else {
                    throw new Error("Сервер вернул неожиданный формат");
                }
            } catch (err) {
                console.error("Ошибка загрузки или обработки файла:", err);
                setStatus("error");
            }
        };

        reader.readAsText(file);
    };

    // ======= Mark as Read =======
    const toggleRead = (id: string) => {
        setRead((prev) => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    // ======= Filtering =======
    const filteredLogs = logs.filter((log) => {
        if (read.has(log.id)) return false;

        const matchesSearch =
            log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.tf_req_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = tfTypeFilter ? log.tf_resource_type === tfTypeFilter : true;
        const matchesLevel = levelFilter ? log.level === levelFilter : true;
        const matchesAction = actionFilter ? log.action === actionFilter : true;

        const matchesTimestamp =
            timestampRange
                ? new Date(log.timestamp) >= new Date(timestampRange[0]) &&
                new Date(log.timestamp) <= new Date(timestampRange[1])
                : true;

        return matchesSearch && matchesType && matchesLevel && matchesAction && matchesTimestamp;
    });

    // ======= Grouping =======
    const groupedLogs: LogEntry[][] = grouped
        ? Array.from(
            filteredLogs.reduce<Map<string, LogEntry[]>>((map, log) => {
                if (!map.has(log.tf_req_id)) map.set(log.tf_req_id, []);
                map.get(log.tf_req_id)!.push(log);
                return map;
            }, new Map())
        ).map(([_, logs]) =>
            logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        )
        : [filteredLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())];

    // ======= Timeline Data =======
    const timelineData = filteredLogs.map((log) => ({
        name: log.tf_req_id,
        timestamp: new Date(log.timestamp).getTime(),
        level: log.level,
        action: log.action,
    }));

    // ======= Render =======
    return (
        <>
            <Header />
            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Log Explorer</h1>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-4 py-2 rounded-lg ${
                            activeTab === "list"
                                ? "bg-[var(--primary)] text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                        }`}
                    >
                        Список
                    </button>
                    <button
                        onClick={() => setActiveTab("timeline")}
                        className={`px-4 py-2 rounded-lg ${
                            activeTab === "timeline"
                                ? "bg-[var(--primary)] text-white"
                                : "bg-gray-100 hover:bg-gray-200"
                        }`}
                    >
                        Timeline
                    </button>
                </div>

                {activeTab === "list" && (
                    <div>
                        {/* Панель загрузки и фильтров */}
                        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex gap-4 flex-wrap">
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

                            {/* Фильтры */}
                            <div className="flex gap-2 flex-wrap items-center">
                                <input
                                    type="text"
                                    placeholder="Полнотекстовый поиск..."
                                    className="px-3 py-2 border rounded-lg min-w-[200px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="tf_resource_type"
                                    className="px-3 py-2 border rounded-lg min-w-[150px]"
                                    value={tfTypeFilter}
                                    onChange={(e) => setTfTypeFilter(e.target.value)}
                                />
                                <select
                                    className="px-3 py-2 border rounded-lg"
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                >
                                    <option value="">Все уровни</option>
                                    <option value="INFO">INFO</option>
                                    <option value="WARN">WARN</option>
                                    <option value="ERROR">ERROR</option>
                                </select>
                                <select
                                    className="px-3 py-2 border rounded-lg"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="">Все действия</option>
                                    <option value="plan">plan</option>
                                    <option value="apply">apply</option>
                                </select>
                                <input
                                    type="date"
                                    className="px-3 py-2 border rounded-lg"
                                    onChange={(e) =>
                                        setTimestampRange((prev) => [
                                            e.target.value,
                                            prev ? prev[1] : e.target.value,
                                        ])
                                    }
                                />
                                <input
                                    type="date"
                                    className="px-3 py-2 border rounded-lg"
                                    onChange={(e) =>
                                        setTimestampRange((prev) => [
                                            prev ? prev[0] : e.target.value,
                                            e.target.value,
                                        ])
                                    }
                                />
                            </div>
                        </div>

                        {logs.length === 0 ? (
                            <p className="text-gray-400">Загрузите JSON для анализа.</p>
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
                                                            : `border-l-4 ${
                                                                log.section === "plan"
                                                                    ? "border-blue-400"
                                                                    : log.section === "apply"
                                                                        ? "border-purple-400"
                                                                        : "border-gray-200"
                                                            }`
                                                    }`}
                                                    onClick={() =>
                                                        setExpanded(isExpanded ? null : log.id)
                                                    }
                                                >
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
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
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                                req_id: {log.tf_req_id}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                                type: {log.tf_resource_type}
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
                                                    <div className="mt-2">{log.message}</div>

                                                    <AnimatePresence>
                                                        {isExpanded && log.details && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="mt-3 p-3 rounded bg-gray-50 border text-sm overflow-x-auto"
                                                            >
                                                                {log.details.tf_http_req_body && (
                                                                    <>
                                                                        <div className="font-bold text-xs mb-1">
                                                                            tf_http_req_body
                                                                        </div>
                                                                        <JsonViewer
                                                                            data={log.details.tf_http_req_body}
                                                                            depth={0}
                                                                        />
                                                                    </>
                                                                )}
                                                                {log.details.tf_http_res_body && (
                                                                    <>
                                                                        <div className="font-bold text-xs mt-2 mb-1">
                                                                            tf_http_res_body
                                                                        </div>
                                                                        <JsonViewer
                                                                            data={log.details.tf_http_res_body}
                                                                            depth={0}
                                                                        />
                                                                    </>
                                                                )}
                                                                {/* Остальные детали */}
                                                                {Object.keys(log.details)
                                                                    .filter(
                                                                        (k) =>
                                                                            k !== "tf_http_req_body" &&
                                                                            k !== "tf_http_res_body"
                                                                    )
                                                                    .map((k) => (
                                                                        <div key={k}>
                                                                            <span className="font-mono text-gray-600 mr-1">
                                                                                {k}:
                                                                            </span>
                                                                            <JsonViewer
                                                                                data={log.details[k]}
                                                                                depth={0}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "timeline" && (
                    <div>
                        {timelineData.length === 0 ? (
                            <p className="text-gray-400">Загрузите логи, чтобы увидеть хронологию.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={timelineData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={(ts) =>
                                            new Date(ts).toLocaleTimeString("ru-RU")
                                        }
                                    />
                                    <YAxis dataKey="name" type="category" />
                                    <Tooltip
                                        labelFormatter={(ts) =>
                                            new Date(Number(ts)).toLocaleString("ru-RU")
                                        }
                                    />
                                    <Bar dataKey="timestamp" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
