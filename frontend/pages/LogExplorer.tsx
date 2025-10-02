"use client";
import React, {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
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
    action: "plan" | "apply" | "other";
    level: "INFO" | "WARN" | "ERROR";
    section?: "plan" | "apply" | "other";
    message: string;
    details?: any;
    tf_resource_type: string;
}

interface TerraformOperationBlockDto {
    type: "plan" | "apply" | "other";
    logs?: ProcessedLogsDto;
    logCount: number;
    startTime: Date;
    endTime: Date;
    id: string;
}

// Детали лога, соответствующие C# ProcessedLogsDto
interface ProcessedLogsDto {
    // Основные системные поля
    "@level"?: string;
    "@message"?: string;
    "@timestamp"?: string;
    
    // Модули и компоненты
    "@module"?: string;
    "@caller"?: string;
    
    // RPC и идентификаторы
    tf_rpc?: string;
    tf_req_id?: string;
    tf_proto_version?: string;
    
    // Ресурсы и провайдеры
    tf_provider_addr?: string;
    tf_resource_type?: string;
    
    // Поля плагинов
    path?: string;
    pid?: number;
    args?: string[];
    plugin?: string;
    id?: string;
    address?: string;
    network?: string;
    version?: number;
    
    // Диагностика и ошибки
    diagnostic_error_count?: number;
    diagnostic_warning_count?: number;
    err?: string;
    
    // Временные метки и производительность
    timestamp?: string; // дублирующее поле
    tf_req_duration_ms?: number;
    tf_data_source_type?: string;
    
    // Capabilities
    tf_server_capability_get_provider_schema_optional?: boolean;
    tf_server_capability_move_resource_state?: boolean;
    tf_server_capability_plan_destroy?: boolean;
    tf_client_capability_write_only_attributes_allowed?: boolean;
    
    // Дополнительные поля
    additionalData?: Record<string, any>;
    timestampParsed?: string;
    levelParsed?: LogLevel;
}

// Enum для уровня логов
enum LogLevel {
    Unknown = "unknown",
    Trace = "trace",
    Debug = "debug",
    Info = "info",
    Warn = "warn",
    Error = "error"
}

export default function LogExplorer() {
    const [logs, setLogs] = useState<TerraformOperationBlockDto[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [read, setRead] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [grouped, setGrouped] = useState(false);
    const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

    const [searchQuery, setSearchQuery] = useState("");
    const [tfTypeFilter, setTfTypeFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [timestampRange, setTimestampRange] = useState<[string | null, string | null]>([null, null]);

    const API_URL = "https://cjyajo-5-166-53-171.ru.tuna.am";

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

    const normalizeAction = (action: any): "plan" | "apply" | "other" => {
        if (typeof action === "string") {
            const normalized = action.toLowerCase().trim();
            return normalized === "apply" ? "apply" : "plan";
        }
        return "other"; // значение по умолчанию
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

        const reader = new FileReader();
        setStatus("loading");

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
                    const normalized: TerraformOperationBlockDto[] = data.map((block: any) => ({
                        id: block.Id || block.id,
                        type: block.Type || block.type || "other",
                        logs: (block.Logs || block.logs || []).map((log: any) => ({
                            // Основные системные поля
                            "@level": log["@level"],
                            "@message": log["@message"],
                            "@timestamp": log["@timestamp"],
                            
                            // Модули и компоненты
                            "@module": log["@module"],
                            "@caller": log["@caller"],
                            
                            // RPC и идентификаторы
                            tf_rpc: log.tf_rpc,
                            tf_req_id: log.tf_req_id,
                            tf_proto_version: log.tf_proto_version,
                            
                            // Ресурсы и провайдеры
                            tf_provider_addr: log.tf_provider_addr,
                            tf_resource_type: log.tf_resource_type,
                            
                            // Поля плагинов
                            path: log.path,
                            pid: log.pid,
                            args: log.args,
                            plugin: log.plugin,
                            id: log.id,
                            address: log.address,
                            network: log.network,
                            version: log.version,
                            
                            // Диагностика и ошибки
                            diagnostic_error_count: log.diagnostic_error_count,
                            diagnostic_warning_count: log.diagnostic_warning_count,
                            err: log.err,
                            
                            // Временные метки и производительность
                            timestamp: log.timestamp,
                            tf_req_duration_ms: log.tf_req_duration_ms,
                            tf_data_source_type: log.tf_data_source_type,
                            
                            // Capabilities
                            tf_server_capability_get_provider_schema_optional: log.tf_server_capability_get_provider_schema_optional,
                            tf_server_capability_move_resource_state: log.tf_server_capability_move_resource_state,
                            tf_server_capability_plan_destroy: log.tf_server_capability_plan_destroy,
                            tf_client_capability_write_only_attributes_allowed: log.tf_client_capability_write_only_attributes_allowed,
                            
                            // Дополнительные поля
                            additionalData: log.additionalData,
                            timestampParsed: log.timestampParsed,
                            levelParsed: log.levelParsed,
                            
                            // Все остальные поля
                            ...log
                            })),
                            logCount: block.LogCount || block.logCount || 0,
                            startTime: block.StartTime || block.startTime || block.FirstTimeStamp,
                            endTime: block.EndTime || block.endTime || block.LastTimeStamp,
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
    const filteredLogs = logs.filter((operationBlock) => {
        if (read.has(operationBlock.id)) return false;

        const logArray = operationBlock.logs;
        if (!Array.isArray(logArray) || logArray.length === 0) return false;

        return logArray.some((log) => {
            const matchesSearch =
                (log["@message"]?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (log.tf_req_id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = tfTypeFilter
                ? log.tf_resource_type?.toLowerCase() === tfTypeFilter.toLowerCase()
                : true;

            const matchesLevel = levelFilter
                ? log["@level"]?.toLowerCase() === levelFilter.toLowerCase()
                : true;

            const matchesAction = actionFilter
                ? log.tf_rpc === actionFilter
                : true;

            const matchesTimestamp = (() => {
                if (!timestampRange) return true;
                const [start, end] = timestampRange;
                const operationStart = new Date(operationBlock.startTime);
                const operationEnd = new Date(operationBlock.endTime);

                if (start && end) {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    return operationStart <= endDate && operationEnd >= startDate;
                } else if (start) {
                    return operationEnd >= new Date(start);
                } else if (end) {
                    return operationStart <= new Date(end);
                }
                return true;
            })();

            return matchesSearch && matchesType && matchesLevel && matchesAction && matchesTimestamp;
        });
    });


    // ======= Grouping =======
    const groupedLogs: TerraformOperationBlockDto[][] = grouped
        ? Array.from(
            filteredLogs.reduce<Map<string, TerraformOperationBlockDto[]>>((map, operationBlock) => {
                const reqId = operationBlock.logs?.tf_req_id || operationBlock.id;
                if (!map.has(reqId)) map.set(reqId, []);
                map.get(reqId)!.push(operationBlock);
                return map;
            }, new Map())
        ).map(([_, operationBlocks]) =>
            operationBlocks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        )
        : [filteredLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())];

    // ======= Timeline Data =======
    const timelineData = filteredLogs.map((operationBlock) => ({
        name: operationBlock.logs?.tf_req_id || operationBlock.id,
        timestamp: new Date(operationBlock.startTime).getTime(),
        level: operationBlock.logs?.["@level"] || "unknown",
        action: operationBlock.logs?.tf_rpc || operationBlock.type,
        endTime: new Date(operationBlock.endTime).getTime(),
        duration: operationBlock.logs?.tf_req_duration_ms || 
            (new Date(operationBlock.endTime).getTime() - new Date(operationBlock.startTime).getTime())
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
                                <option value="trace">TRACE</option>
                                <option value="debug">DEBUG</option>
                                <option value="info">INFO</option>
                                <option value="warn">WARN</option>
                                <option value="error">ERROR</option>
                            </select>
                            <select
                                className="px-3 py-2 border rounded-lg"
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                            >
                                <option value="">Все действия</option>
                                <option value="ApplyResourceChange">ApplyResourceChange</option>
                                <option value="PlanResourceChange">PlanResourceChange</option>
                                <option value="ReadResource">ReadResource</option>
                                <option value="ConfigureProvider">ConfigureProvider</option>
                            </select>
                            <input
                                type="date"
                                className="px-3 py-2 border rounded-lg"
                                onChange={(e) =>
                                    setTimestampRange((prev) => [e.target.value || null, prev ? prev[1] : null])
                                }
                            />
                            <input
                                type="date"
                                className="px-3 py-2 border rounded-lg"
                                onChange={(e) =>
                                    setTimestampRange((prev) => [prev ? prev[0] : null, e.target.value || null])
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
                                            Группа tf_req_id: {group[0]?.logs?.tf_req_id || group[0]?.id}
                                        </h2>
                                    )}
                                    {group.map((operationBlock) => {
                                        const isExpanded = expanded === operationBlock.id;
                                        const isRead = read.has(operationBlock.id);
                                        const logData = operationBlock.logs;

                                        return (
                                            <motion.div
                                                key={operationBlock.id}
                                                layout
                                                className={`rounded-xl border p-4 transition cursor-pointer ${
                                                    isRead
                                                        ? "opacity-50 border-gray-300"
                                                        : `border-l-4 ${
                                                            operationBlock.type === "plan"
                                                                ? "border-blue-400"
                                                                : operationBlock.type === "apply"
                                                                    ? "border-purple-400"
                                                                    : "border-gray-200"
                                                        }`
                                                }`}
                                                onClick={() =>
                                                    setExpanded(isExpanded ? null : operationBlock.id)
                                                }
                                            >
                                                <div className="flex items-center justify-between flex-wrap gap-2">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span
                                                            className={`text-xs font-bold px-2 py-1 rounded ${
                                                                logData?.["@level"] === "info" || !logData?.["@level"]
                                                                    ? "bg-green-100 text-green-800"
                                                                    : logData?.["@level"] === "warn"
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {operationBlock?.type?.toUpperCase() || "UNKNOWN"}
                                                        </span>
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded ${
                                                                operationBlock.type === "plan"
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : operationBlock.type === "apply"
                                                                        ? "bg-purple-100 text-purple-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                            }`}
                                                        >
                                                            {operationBlock.type}
                                                        </span>
                                                        <span className="text-sm font-mono text-gray-600">
                                                            {new Date(operationBlock.startTime).toLocaleString()}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                            req_id: {logData?.tf_req_id || "N/A"}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                            type: {logData?.tf_resource_type || "N/A"}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                            logs: {operationBlock.logCount}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                            duration: {logData?.tf_req_duration_ms || 
                                                                (new Date(operationBlock.endTime).getTime() - 
                                                                 new Date(operationBlock.startTime).getTime())
                                                            }ms
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRead(operationBlock.id);
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

                                                <AnimatePresence>
                                                    {isExpanded && logData && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-3 rounded bg-gray-50 border text-sm overflow-x-auto"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="font-bold mb-3">Подробнее о блоке:</div>
                                                            <div className="grid grid-cols-2 gap-1 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                <div><strong>Id:</strong> {operationBlock.id}</div>
                                                                <div><strong>Время начала:</strong> {new Date(operationBlock.startTime).toLocaleString()}</div>
                                                                <div><strong>Тип:</strong> {operationBlock.type}</div>
                                                                <div><strong>Время конца:</strong> {new Date(operationBlock.endTime).toLocaleString()}</div>
                                                                <div><strong>Кол-во логов:</strong> {operationBlock.logCount}</div>
                                                            </div>

                                                            <div className="font-bold mb-3">Логи:</div>
                                                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                {Object.entries(logData)
                                                                    .filter(([key]) => !key.startsWith('@') && key !== 'additionalData')
                                                                    .map(([key, value]) => (


                                                                            <JsonViewer
                                                                                data={value}
                                                                                depth={0}
                                                                                key={key}
                                                                            />
                                                                    ))}
                                                            </div>

                                                            {/* Additional Data */}
                                                            {logData.additionalData && Object.keys(logData.additionalData).length > 0 && (
                                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                                    <div className="font-bold text-sm mb-2 text-blue-800">Additional Data:</div>
                                                                    {Object.entries(logData.additionalData).map(([key, value]) => (
                                                                        <div key={key} className="mb-2 p-2 bg-white rounded border">
                                                                            <span className="font-mono text-blue-600 mr-1">
                                                                                {key}:
                                                                            </span>
                                                                            <JsonViewer
                                                                                data={value}
                                                                                depth={0}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
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
                                    formatter={(value, name) => {
                                        if (name === "timestamp") {
                                            return [new Date(Number(value)).toLocaleString("ru-RU"), "Start Time"];
                                        }
                                        if (name === "duration") {
                                            return [`${value}ms`, "Duration"];
                                        }
                                        return [value, name];
                                    }}
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