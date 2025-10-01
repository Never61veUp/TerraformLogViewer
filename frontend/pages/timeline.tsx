// pages/timeline.tsx
"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import { useLogs } from "../Components/LogsProvider";

export default function TimelinePage() {
    const { logs } = useLogs();

    // aggregate by tf_req_id -> compute min & max timestamps
    const data = useMemo(() => {
        const groups: Record<string, { start: number; end: number; count: number }> = {};
        logs.forEach((l) => {
            const t = new Date(l.timestamp).getTime();
            const id = l.tf_req_id || "unknown";
            if (!groups[id]) groups[id] = { start: t, end: t + 2000, count: 0 };
            groups[id].start = Math.min(groups[id].start, t);
            groups[id].end = Math.max(groups[id].end, t);
            groups[id].count += 1;
        });
        // transform to array sorted by start descending
        return Object.entries(groups)
            .map(([id, v]) => ({
                req_id: id,
                start: v.start,
                duration: Math.max(1000, v.end - v.start),
                count: v.count,
            }))
            .sort((a, b) => a.start - b.start); // ascending
    }, [logs]);

    if (logs.length === 0) {
        return (
            <>
                <Header />
                <main className="pt-28 px-6 max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">Timeline</h1>
                    <p className="text-gray-500">Загрузите логи на странице Log Explorer — здесь появится хронология.</p>
                </main>
                <Footer />
            </>
        );
    }

    // Map start to numeric relative axis (ms). To keep chart readable, translate to offset from min start
    const minStart = Math.min(...data.map((d) => d.start));
    const chartData = data.map((d) => ({
        req_id: d.req_id,
        startOffset: d.start - minStart,
        duration: d.duration,
        count: d.count,
    }));

    return (
        <>
            <Header />
            <main className="pt-28 px-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Хронология запросов (Timeline)</h1>
                <p className="text-sm text-gray-600 mb-4">Каждая строка — tf_req_id, длина — примерная продолжительность группы по логам.</p>

                <div style={{ width: "100%", height: Math.min(600, 60 * chartData.length + 80) }}>
                    <ResponsiveContainer>
                        <BarChart layout="vertical" data={chartData} margin={{ top: 20, right: 40, left: 120, bottom: 20 }}>
                            <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000)}s`} />
                            <YAxis dataKey="req_id" type="category" width={200} />
                            <Tooltip formatter={(val: any, name: any) => (name === "startOffset" ? `${Math.round(val / 1000)}s` : val)} />
                            {/* render a transparent bar for startOffset (to push the duration bar), and colored bar for duration */}
                            <Bar dataKey="startOffset" stackId="a" fill="transparent" />
                            <Bar dataKey="duration" stackId="a">
                                {chartData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.count > 5 ? "#d946ef" : "#60a5fa"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
            <Footer />
        </>
    );
}
