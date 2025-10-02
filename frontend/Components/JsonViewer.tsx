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
console.log(data['@message']);
    const keys = Array.isArray(data) ? data.map((_, i) => String(i)) : Object.keys(data);

    const isOpen = openMap[path] ?? false;

    const getColor = (status: string) => {
        switch (data['LevelParsed']) {
            case "Error":
                return "bg-red-100 border-red-400 text-red-700";
            case "Trace":
                return "bg-blue-100 border-blue-400 text-blue-700";
            case "Info":
                return "bg-gray-100 border-gray-300 text-gray-700";
            case "Warning":
                return "bg-yellow-100 border-yellow-400 text-yellow-700";
            case "Debug":
                return "bg-purple-100 border-purple-400 text-purple-700";
            default:
                return "bg-white border-gray-200 text-black";
        }
    }
    const getFontColor = (status: string) => {
        switch (data['LevelParsed']) {
            case "Error":
                return "text-red-800";
            case "Warning":
                return "text-yellow-800";
            case "Info":
                return "text-green-700";
            case "Debug":
                return "text-purple-700";
            case "Trace":
                return "text-blue-700";
            default:
                return "text-gray-800";
        }
    }

    return (
        <div className={`mb-2 p-2 rounded border ${getColor(data.LevelParsed)}`}>
            <div className="">
                <button
                    onClick={() => setOpenMap((prev) => ({...prev, [path]: !isOpen}))}
                    className={`text-sm text-[var(--primary)] hover:underline mb-1 ${getFontColor(data.LevelParsed)}`}
                >
                    {isOpen ? "▼" : "▶"} [{data['LevelParsed'].toUpperCase()}] {data['@message']} ({data.length})
                </button>
                {isOpen && (
                    <div className="ml-3 border-l pl-2">
                        {keys
                            .filter((k) => data[k] !== null && data[k] !== undefined) // фильтрация
                            .map((k) => (
                                <div key={k} className="text-sm leading-snug">
                                    <span className="font-mono text-gray-600 mr-1">{k}:</span>
                                    <JsonViewer data={data[k]} path={`${path}.${k}`} />
                                </div>
                            ))}
                    </div>
                )}
            </div>
            </div>

    );
}
