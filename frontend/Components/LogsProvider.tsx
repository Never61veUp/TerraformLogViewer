// components/LogsProvider.tsx
"use client";
import React, { createContext, useCallback, useContext, useState } from "react";

export interface LogEntry {
    id: string;
    tf_req_id: string;
    timestamp: string; // ISO
    action: "plan" | "apply";
    level: string;
    message: string;
    details?: any;
    tf_resource_type?: string;
}

type LogsContextType = {
    logs: LogEntry[];
    setLogs: (l: LogEntry[]) => void;
    addLogs: (l: LogEntry[]) => void;
    clear: () => void;
    exportJson: (filtered?: LogEntry[]) => void;
    exportCsv: (filtered?: LogEntry[]) => void;
};

const LogsContext = createContext<LogsContextType | null>(null);

export const useLogs = () => {
    const ctx = useContext(LogsContext);
    if (!ctx) throw new Error("useLogs must be used within LogsProvider");
    return ctx;
};

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logs, setLogsState] = useState<LogEntry[]>([]);

    const setLogs = useCallback((l: LogEntry[]) => setLogsState(l), []);
    const addLogs = useCallback((l: LogEntry[]) => setLogsState((prev) => [...l, ...prev]), []);

    const clear = useCallback(() => setLogsState([]), []);

    const exportJson = useCallback((filtered?: LogEntry[]) => {
        const payload = filtered ?? logs;
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `logs_export_${Date.now()}.json`;
        a.click();
    }, [logs]);

    const exportCsv = useCallback((filtered?: LogEntry[]) => {
        const payload = filtered ?? logs;
        const rows = [
            ["id", "tf_req_id", "timestamp", "action", "level", "tf_resource_type", "message"],
            ...payload.map((r) => [
                r.id,
                r.tf_req_id,
                r.timestamp,
                r.action,
                r.level,
                r.tf_resource_type ?? "",
                `"${(r.message ?? "").replace(/"/g, '""')}"`
            ])
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `logs_export_${Date.now()}.csv`;
        a.click();
    }, [logs]);

    return (
        <LogsContext.Provider value={{ logs, setLogs, addLogs, clear, exportJson, exportCsv }}>
            {children}
        </LogsContext.Provider>
    );
};
