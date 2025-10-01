import React from "react";

interface JsonViewerProps {
    data: any,
    path?: string,
    depth?: number
}

export default function JsonViewer({data, path = "", depth}: JsonViewerProps) {
    const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});

    if (data === null || data === undefined) return <span className="text-gray-600">null</span>;
    if (typeof data !== "object") return <span className="text-[var(--primary)]">{String(data)}</span>;

    const keys = Array.isArray(data) ? data.map((_, i) => String(i)) : Object.keys(data);

    const isOpen = openMap[path] ?? false;

    return (
        <div className="ml-2">
            <button
                onClick={() => setOpenMap((prev) => ({...prev, [path]: !isOpen}))}
                className="text-xs text-[var(--primary)] hover:underline mb-1"
            >
                {isOpen ? "▼" : "▶"} {Array.isArray(data) ? "Array" : "Object"} ({keys.length})
            </button>
            {isOpen && (
                <div className="ml-3 border-l pl-2">
                    {keys.map((k) => (
                        <div key={k} className="text-sm leading-snug">
                            <span className="font-mono text-gray-600 mr-1">{k}:</span>
                            <JsonViewer data={data[k]} path={`${path}.${k}`}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
