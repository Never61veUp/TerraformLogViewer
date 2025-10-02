"use client";
import React, { useState, useMemo } from "react";
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
    Rectangle,
    ScatterChart,
    Scatter,
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
    logs?: ProcessedLogsDto[];
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

interface TfReqGroup {
    tf_req_id: string;
    startTime: Date;
    endTime: Date;
    logCount: number;
    operations: TerraformOperationBlockDto[];
    allLogs: ProcessedLogsDto[];
    rpcType: string;
    duration: number;
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

    // Состояние для отслеживания раскрытых логов
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    // Функция для переключения раскрытия лога
    const toggleLogExpansion = (logId: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    // Функция для раскрытия/сворачивания всех логов в блоке
    const toggleAllLogsInBlock = (operationBlockId: string, logCount: number) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            const allLogsInBlockExpanded = Array.from({ length: logCount }, (_, i) => 
                `${operationBlockId}-${i}`
            ).every(id => newSet.has(id));

            if (allLogsInBlockExpanded) {
                // Свернуть все
                Array.from({ length: logCount }, (_, i) => 
                    `${operationBlockId}-${i}`
                ).forEach(id => newSet.delete(id));
            } else {
                // Раскрыть все
                Array.from({ length: logCount }, (_, i) => 
                    `${operationBlockId}-${i}`
                ).forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

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
                            startTime: new Date(block.StartTime || block.startTime || block.FirstTimeStamp),
                            endTime: new Date(block.EndTime || block.endTime || block.LastTimeStamp),
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

    // Функция для получения временной метки по приоритету
    const getTimestampFromLog = (log: ProcessedLogsDto): Date | null => {
        // Приоритет: timestampParsed -> "@timestamp" -> timestamp
        if (log.timestampParsed) {
            return new Date(log.timestampParsed);
        } else if (log["@timestamp"]) {
            return new Date(log["@timestamp"]);
        } else if (log.timestamp) {
            return new Date(log.timestamp);
        }
        return null;
    };

    // Функция для группировки логов по tf_req_id
    const getGroupedByTfReqId = useMemo((): TfReqGroup[] => {
        const groupsMap = new Map<string, TfReqGroup>();

        logs.forEach(operationBlock => {
            if (!operationBlock.logs) return;

            operationBlock.logs.forEach(log => {
                const tfReqId = log.tf_req_id;
                if (!tfReqId) return;

                const logTimestamp = getTimestampFromLog(log);
                if (!logTimestamp) return;

                if (!groupsMap.has(tfReqId)) {
                    groupsMap.set(tfReqId, {
                        tf_req_id: tfReqId,
                        startTime: logTimestamp,
                        endTime: logTimestamp,
                        logCount: 0,
                        operations: [],
                        allLogs: [],
                        rpcType: log.tf_rpc || "unknown",
                        duration: 0
                    });
                }

                const group = groupsMap.get(tfReqId)!;
                group.allLogs.push(log);
                group.logCount++;

                // Обновляем временные границы
                if (logTimestamp < group.startTime) {
                    group.startTime = logTimestamp;
                }
                if (logTimestamp > group.endTime) {
                    group.endTime = logTimestamp;
                }

                // Добавляем операцию если еще не добавлена
                if (!group.operations.find(op => op.id === operationBlock.id)) {
                    group.operations.push(operationBlock);
                }
            });
        });

        // Рассчитываем длительность для каждой группы
        Array.from(groupsMap.values()).forEach(group => {
            group.duration = group.endTime.getTime() - group.startTime.getTime();
        });

        // Сортируем по времени начала (хронологический порядок)
        return Array.from(groupsMap.values()).sort((a, b) => 
            a.startTime.getTime() - b.startTime.getTime()
        );
    }, [logs]);

    // Функция для получения цвета по типу RPC
    const getColorByRpcType = (rpcType: string) => {
        const colors: { [key: string]: string } = {
            'GetProviderSchema': '#8884d8',
            'PlanResourceChange': '#82ca9d',
            'ApplyResourceChange': '#ffc658',
            'ReadResource': '#ff8042',
            'ConfigureProvider': '#0088fe',
            'ValidateResourceConfig': '#00C49F',
            'ValidateDataResourceConfig': '#FFBB28',
            'UpgradeResourceState': '#FF8042',
            'ReadDataSource': '#0088FE',
            'unknown': '#cccccc'
        };
        return colors[rpcType] || '#cccccc';
    };

    // Данные для диаграммы Ганта - показываем реальное временное положение
    const ganttData = useMemo(() => {
        if (getGroupedByTfReqId.length === 0) return [];

        // Находим реальный временной диапазон всех запросов
        const allStartTimes = getGroupedByTfReqId.map(group => group.startTime.getTime());
        const allEndTimes = getGroupedByTfReqId.map(group => group.endTime.getTime());
        const absoluteMinTime = Math.min(...allStartTimes);
        const absoluteMaxTime = Math.max(...allEndTimes);

        return getGroupedByTfReqId.map((group, index) => ({
            id: index,
            name: group.tf_req_id,
            startTime: group.startTime.getTime(),
            endTime: group.endTime.getTime(),
            duration: group.duration,
            logCount: group.logCount,
            rpcType: group.rpcType,
            tf_req_id: group.tf_req_id,
            // ВАЖНО: Используем фактическое время начала для позиционирования
            // и длительность для вычисления ширины
            value: group.duration, // Это будет определять ширину бара
            startValue: group.startTime.getTime(), // Это начало бара
        }));
    }, [getGroupedByTfReqId]);

    // Получаем реальный временной диапазон для domain
    const timeDomain = useMemo(() => {
        if (ganttData.length === 0) return ['dataMin', 'dataMax'];
        
        const allStartTimes = ganttData.map(item => item.startTime);
        const allEndTimes = ganttData.map(item => item.endTime);
        const minTime = Math.min(...allStartTimes);
        const maxTime = Math.max(...allEndTimes);
        
        // Добавляем небольшие отступы для лучшего отображения
        const padding = (maxTime - minTime) * 0.05; // 5% от общего времени
        return [minTime - padding, maxTime + padding];
    }, [ganttData]);

    // Кастомный компонент для bar в диаграмме Ганта
    const CustomBar = (props: any) => {
        const { x, y, width, height, payload } = props;
        
        // Вычисляем реальную позицию и ширину на основе времени начала и длительности
        const barStartX = x; // x уже вычислен библиотекой на основе startValue
        const barWidth = Math.max(width, 2); // Минимальная ширина для видимости
        
        return (
            <Rectangle
                x={barStartX}
                y={y}
                width={barWidth}
                height={Math.max(height, 10)} // Минимальная высота
                fill={getColorByRpcType(payload.rpcType)}
                stroke="#333"
                strokeWidth={0.5}
                radius={2}
            />
        );
    };

    // Кастомный тултип для диаграммы Ганта
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-bold">{data.tf_req_id}</p>
                    <p><strong>RPC Type:</strong> {data.rpcType}</p>
                    <p><strong>Start:</strong> {formatDateTimeWithMs(data.startTime)}</p>
                    <p><strong>End:</strong> {formatDateTimeWithMs(data.endTime)}</p>
                    <p><strong>Duration:</strong> {data.duration}ms</p>
                    <p><strong>Log Count:</strong> {data.logCount}</p>
                </div>
            );
        }
        return null;
    };
    // Альтернативные данные для ScatterChart
    const scatterData = useMemo(() => {
        if (getGroupedByTfReqId.length === 0) return [];

        return getGroupedByTfReqId.map((group, index) => ({
            x: group.startTime.getTime(),
            y: index,
            width: group.duration,
            startTime: group.startTime.getTime(),
            endTime: group.endTime.getTime(),
            duration: group.duration,
            logCount: group.logCount,
            rpcType: group.rpcType,
            tf_req_id: group.tf_req_id,
            name: group.tf_req_id,
        }));
    }, [getGroupedByTfReqId]);

    // Кастомная точка для ScatterChart
    const CustomScatter = (props: any) => {
        const { cx, cy, x, y, payload, width } = props;
        
        return (
            <Rectangle
                x={cx - width / 2}
                y={cy - 5}
                width={Math.max(width, 2)}
                height={10}
                fill={getColorByRpcType(payload.rpcType)}
                stroke="#333"
                strokeWidth={0.5}
                radius={2}
            />
        );
    };

    // Функция для форматирования временной оси
    const timeFormatter = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("ru-RU", {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            timeZoneName: 'shortOffset'
        });
    };

    // ======= Filtering =======
    const filteredLogs = logs
        .filter((operationBlock) => {
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


    // Функция для получения краткого описания лога
    const getLogSummary = (log: ProcessedLogsDto) => {
        if (!log) return "No details";
        const msg = log["@message"] || log.err || "No message";
        const resource = log.tf_resource_type ? ` [${log.tf_resource_type}]` : "";
        const timestamp = log["@timestamp"]
            ? new Date(log["@timestamp"]).toLocaleTimeString()
            : "";
        return `${timestamp} - ${msg}${resource}`;
    };

    // Группировка логов (добавьте этот код в ваш компонент)
    const groupedLogs: TerraformOperationBlockDto[][] = grouped
        ? Array.from(
            filteredLogs.reduce<Map<string, TerraformOperationBlockDto[]>>((map, operationBlock) => {
                // Берем tf_req_id из первого лога или используем id блока
                const reqId = operationBlock.logs?.[0]?.tf_req_id || operationBlock.id;
                if (!map.has(reqId)) map.set(reqId, []);
                map.get(reqId)!.push(operationBlock);
                return map;
            }, new Map())
        ).map(([_, operationBlocks]) =>
            operationBlocks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        )
        : [filteredLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())];

    // Timeline data (также добавьте эту переменную)
    const timelineData = filteredLogs.map((operationBlock) => {
        // Берем данные из первого лога в блоке или используем значения по умолчанию
        const firstLog = operationBlock.logs?.[0];
        return {
            name: firstLog?.tf_req_id || operationBlock.id,
            timestamp: new Date(operationBlock.startTime).getTime(),
            level: firstLog?.["@level"] || "unknown",
            action: firstLog?.tf_rpc || operationBlock.type,
            endTime: new Date(operationBlock.endTime).getTime(),
            duration: firstLog?.tf_req_duration_ms ||
                (new Date(operationBlock.endTime).getTime() - new Date(operationBlock.startTime).getTime())
        };
    });

    // Функция для форматирования даты и времени с миллисекундами
    const formatDateTimeWithMs = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString("ru-RU", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            timeZoneName: 'shortOffset'
        });
    };

const sortByReadAndTime = (a: TerraformOperationBlockDto, b: TerraformOperationBlockDto) => {
        const aRead = read.has(a.id) ? 1 : 0;
        const bRead = read.has(b.id) ? 1 : 0;

        if (aRead !== bRead) return aRead - bRead; // непрочитанные сверху

        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    };

    // ======== компонент для раскрытия строк объектов ========
    const LogRow: React.FC<{ keyName: string; value: any; parentId: string }> = ({ keyName, value, parentId }) => {
        const [expandedRow, setExpandedRow] = useState(false);
        const isObject = typeof value === "object" && value !== null;

        return (
            <div className="space-y-1">
                <div
                    className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                    onClick={() => setExpandedRow((prev) => !prev)}
                >
                    <div>
                        <span className="font-mono text-gray-600 mr-2">{keyName}:</span>
                        <span>{isObject ? getLogSummary(value) : value?.toString()}</span>
                    </div>
                    {isObject && (
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${expandedRow ? "rotate-180" : ""}`}
                        />
                    )}
                </div>

                {isObject && (
                    <AnimatePresence>
                        {expandedRow && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-2 bg-gray-50 border rounded overflow-x-auto"
                            >
                                <JsonViewer data={value} depth={0} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        );
    };

    return (
        <>
            <Header />
            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Log Explorer</h1>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-4 py-2 rounded-lg ${activeTab === "list" ? "bg-[var(--primary)] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                    >
                        Список
                    </button>
                    <button
                        onClick={() => setActiveTab("timeline")}
                        className={`px-4 py-2 rounded-lg ${activeTab === "timeline" ? "bg-[var(--primary)] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
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
                                    className={`h-11 px-4 py-2 flex items-center gap-2 rounded-lg border transition ${grouped ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white hover:bg-gray-100"}`}
                                >
                                    <Group className="w-5 h-5" />
                                    {grouped ? "Группировка включена" : "Группировать по tf_req_id"}
                                </button>
                            </div>

                            {/* Фильтры */}
                            <div className="flex gap-2 flex-wrap items-center">
                                <input
                                    type="text"
                                    placeholder="Поиск..."
                                    className="px-3 py-2 border rounded-lg min-w-[150px]"
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
                                                Группа tf_req_id: {group[0]?.logs?.[0]?.tf_req_id || group[0]?.id}
                                            </h2>
                                        )}
                                        {group.map((operationBlock) => {
                                            const isExpanded = expanded === operationBlock.id;
                                            const isRead = read.has(operationBlock.id);
                                            const logData = operationBlock.logs;
                                            const firstLog = logData?.[0];

                                            return (
                                                <motion.div
                                                    key={operationBlock.id}
                                                    layout
                                                    className={`rounded-xl border p-4 transition cursor-pointer ${isRead ? "opacity-50 border-gray-300" : `border-l-4 ${operationBlock.type === "plan" ? "border-blue-400" : operationBlock.type === "apply" ? "border-purple-400" : "border-gray-200"}`}`}
                                                    onClick={() => setExpanded(isExpanded ? null : operationBlock.id)}
                                                >
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${firstLog?.["@level"] === "info" || !firstLog?.["@level"] ? "bg-green-100 text-green-800" : firstLog?.["@level"] === "warn" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                                                                {operationBlock?.type?.toUpperCase() || "UNKNOWN"}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded ${operationBlock.type === "plan" ? "bg-blue-100 text-blue-800" : operationBlock.type === "apply" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                                                                {operationBlock.type}
                                                            </span>
                                                            <span className="text-sm font-mono text-gray-600">
                                                                {new Date(operationBlock.startTime).toLocaleString()}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                                req_id: {firstLog?.tf_req_id || "N/A"}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                                type: {firstLog?.tf_resource_type || "N/A"}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                                logs: {operationBlock.logCount || logData?.length || 0}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-800">
                                                                duration: {firstLog?.tf_req_duration_ms || (new Date(operationBlock.endTime).getTime() - new Date(operationBlock.startTime).getTime())}ms
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
                                                                    className={`w-5 h-5 ${isRead ? "text-[var(--primary)]" : "text-gray-400"}`}
                                                                />
                                                            </button>
                                                            <ChevronDown
                                                                className={`w-5 h-5 transition ${isExpanded ? "rotate-180" : ""}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 text-sm text-gray-700">
                                                        {firstLog ? getLogSummary(firstLog) : "No message"}
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
                                                                    <div><strong>Кол-во логов:</strong> {operationBlock.logCount || logData.length}</div>
                                                                </div>

                                                                <div className="font-bold mb-3">Логи ({logData.length}):</div>
                                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                                                                    {logData.map((log, logIndex) => {
                                                                        const isLogExpanded = expandedLogs.has(`${operationBlock.id}-${logIndex}`);
                                                                        
                                                                        return (
                                                                            <div key={logIndex} className="border-b pb-3 last:border-b-0">
                                                                                {/* Заголовок лога с кнопкой раскрытия */}
                                                                                <div 
                                                                                    className="font-semibold mb-2 text-gray-700 cursor-pointer hover:bg-gray-100 p-2 rounded flex justify-between items-center"
                                                                                    onClick={() => toggleLogExpansion(`${operationBlock.id}-${logIndex}`)}
                                                                                >
                                                                                    <div>
                                                                                        Лог #{logIndex + 1} 
                                                                                        {log["@timestamp"] && ` - ${new Date(log["@timestamp"]).toLocaleTimeString()}`}
                                                                                        {log["@level"] && ` [${log["@level"]}]`}
                                                                                    </div>
                                                                                    <ChevronDown
                                                                                        className={`w-4 h-4 transition-transform ${isLogExpanded ? "rotate-180" : ""}`}
                                                                                    />
                                                                                </div>

                                                                                {/* Раскрывающееся содержимое лога */}
                                                                                <AnimatePresence>
                                                                                    {isLogExpanded && (
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, height: 0 }}
                                                                                            animate={{ opacity: 1, height: "auto" }}
                                                                                            exit={{ opacity: 0, height: 0 }}
                                                                                            className="overflow-hidden"
                                                                                        >
                                                                                            <div className="space-y-2 pl-4 border-l-2 border-gray-300 ml-2">
                                                                                                {/* Системные поля (@timestamp, @level, @message и т.д.) */}
                                                                                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
                                                                                                    <div className="font-bold text-sm mb-2 text-green-800">System Fields:</div>
                                                                                                    {Object.entries(log)
                                                                                                        .filter(([key]) => key.startsWith('@'))
                                                                                                        .map(([key, value]) => (
                                                                                                            <div key={`${logIndex}-system-${key}`} className="flex">
                                                                                                                <span className="font-mono text-gray-600 mr-2 min-w-[120px]">{key}:</span>
                                                                                                                <span className="text-gray-800">{value?.toString()}</span>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                </div>
                                                                                                {/* Основные поля лога */}
                                                                                                {Object.entries(log)
                                                                                                    .filter(([key]) => !key.startsWith('@') && key !== 'additionalData')
                                                                                                    .map(([key, value]) => (
                                                                                                        <LogRow key={`${logIndex}-${key}`} keyName={key} value={value} parentId={operationBlock.id} />
                                                                                                    ))}
                                                                                                
                                                                                                {/* Additional Data */}
                                                                                                {log.additionalData && Object.keys(log.additionalData).length > 0 && (
                                                                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                                                                                                        <div className="font-bold text-sm mb-2 text-blue-800">Additional Data:</div>
                                                                                                        {Object.entries(log.additionalData).map(([key, value]) => (
                                                                                                            <LogRow key={`${logIndex}-additional-${key}`} keyName={key} value={value} parentId={operationBlock.id} />
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </motion.div>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
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
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Диаграмма Ганта - Группировка по tf_req_id</h2>
                        <p className="text-gray-600 mb-4">
                            Отображает группы логов, сгруппированные по tf_req_id, с реальным временем начала и окончания операций
                        </p>
                        
                        {ganttData.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">
                                Загрузите логи, чтобы увидеть диаграмму Ганта.
                            </p>
                        ) : (
                            <div className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart
                                        data={scatterData}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            type="number" 
                                            dataKey="x"
                                            domain={timeDomain}
                                            tickFormatter={timeFormatter}
                                            label={{ value: 'Время', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis 
                                            type="category" 
                                            dataKey="name"
                                            width={180}
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => value.slice(0, 25) + '...'}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Scatter 
                                            dataKey="duration"
                                            shape={<CustomScatter />}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Дополнительная статистика */}
                    {ganttData.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-bold text-lg mb-2">Общая статистика</h3>
                                <p><strong>Всего групп:</strong> {ganttData.length}</p>
                                <p><strong>Всего логов:</strong> {ganttData.reduce((sum, item) => sum + item.logCount, 0)}</p>
                                <p><strong>Средняя длительность:</strong> {Math.round(ganttData.reduce((sum, item) => sum + item.duration, 0) / ganttData.length)}ms</p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-bold text-lg mb-2">Распределение по RPC типам</h3>
                                <div className="space-y-2">
                                    {Object.entries(
                                        ganttData.reduce((acc: {[key: string]: number}, item) => {
                                            acc[item.rpcType] = (acc[item.rpcType] || 0) + 1;
                                            return acc;
                                        }, {})
                                    ).map(([rpcType, count]) => (
                                        <div key={rpcType} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-sm"
                                                    style={{ backgroundColor: getColorByRpcType(rpcType) }}
                                                ></div>
                                                <span><strong>{rpcType}:</strong></span>
                                            </div>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-bold text-lg mb-2">Временной диапазон</h3>
                                <p><strong>Начало:</strong> {formatDateTimeWithMs(Math.min(...ganttData.map(d => d.startTime)))}</p>
                                <p><strong>Окончание:</strong> {formatDateTimeWithMs(Math.max(...ganttData.map(d => d.endTime)))}</p>
                                <p><strong>Общая длительность:</strong> {Math.max(...ganttData.map(d => d.endTime)) - Math.min(...ganttData.map(d => d.startTime))}ms</p>
                            </div>
                        </div>
                    )}

                    {/* Детальный список групп */}
                    {ganttData.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border shadow-sm">
                            <h3 className="text-lg font-bold mb-4">Детали групп</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {getGroupedByTfReqId.map((group, index) => (
                                    <div key={group.tf_req_id} className="p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-mono text-sm">{group.tf_req_id}</p>
                                                <p className="text-xs text-gray-600">
                                                    {group.startTime.toLocaleString()} - {group.endTime.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span 
                                                    className="px-2 py-1 rounded text-xs text-white font-medium"
                                                    style={{ backgroundColor: getColorByRpcType(group.rpcType) }}
                                                >
                                                    {group.rpcType}
                                                </span>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {group.logCount} логов, {group.duration}ms
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            </main>
            <Footer />
        </>
    );
}