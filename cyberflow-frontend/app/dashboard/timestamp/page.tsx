"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowLeftRight, RefreshCw } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

const DATE_FORMATS = [
    { label: "ISO 8601", format: (d: Date) => d.toISOString() },
    { label: "UTC String", format: (d: Date) => d.toUTCString() },
    { label: "Local String", format: (d: Date) => d.toLocaleString() },
    {
        label: "RFC 2822",
        format: (d: Date) =>
            d.toUTCString().replace(/GMT/, "+0000"),
    },
    {
        label: "Date Only",
        format: (d: Date) => d.toISOString().split("T")[0],
    },
    {
        label: "Time Only",
        format: (d: Date) => d.toISOString().split("T")[1].replace("Z", " UTC"),
    },
    {
        label: "Relative",
        format: (d: Date) => {
            const now = new Date();
            const diff = now.getTime() - d.getTime();
            const abs = Math.abs(diff);
            const future = diff < 0;
            const seconds = Math.floor(abs / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const years = Math.floor(days / 365);

            let str = "";
            if (years > 0) str = `${years} year${years > 1 ? "s" : ""}`;
            else if (days > 0) str = `${days} day${days > 1 ? "s" : ""}`;
            else if (hours > 0) str = `${hours} hour${hours > 1 ? "s" : ""}`;
            else if (minutes > 0) str = `${minutes} minute${minutes > 1 ? "s" : ""}`;
            else str = `${seconds} second${seconds > 1 ? "s" : ""}`;

            return future ? `in ${str}` : `${str} ago`;
        },
    },
];

type Mode = "epoch-to-date" | "date-to-epoch";

export default function TimestampPage() {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<Mode>("epoch-to-date");
    const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getResult = (): { date: Date | null; epoch: number | null } => {
        if (!input.trim()) return { date: null, epoch: null };

        if (mode === "epoch-to-date") {
            let ts = parseInt(input.trim());
            if (isNaN(ts)) return { date: null, epoch: null };
            // Auto-detect milliseconds vs seconds
            if (ts > 1e12) ts = Math.floor(ts / 1000);
            const date = new Date(ts * 1000);
            if (isNaN(date.getTime())) return { date: null, epoch: null };
            return { date, epoch: ts };
        } else {
            const date = new Date(input.trim());
            if (isNaN(date.getTime())) return { date: null, epoch: null };
            return { date, epoch: Math.floor(date.getTime() / 1000) };
        }
    };

    const result = getResult();

    return (
        <ToolLayout
            title="Timestamp Converter"
            description="Convert between Unix epoch timestamps and human-readable dates"
            icon={<Clock className="h-6 w-6" />}
        >
            {/* Live Clock */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4 text-center">
                <p className="text-xs text-muted-foreground font-mono-soc uppercase tracking-wider mb-1">
                    Current Unix Epoch
                </p>
                <p className="text-3xl font-bold text-matrix glow-matrix font-mono-soc tabular-nums">
                    {now}
                </p>
                <p className="text-xs text-muted-foreground font-mono-soc mt-1">
                    {new Date(now * 1000).toISOString()}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded-lg bg-terminal-card border border-terminal-border overflow-hidden">
                <button
                    onClick={() => { setMode("epoch-to-date"); setInput(""); }}
                    className={`flex-1 py-2.5 text-sm font-mono-soc font-bold transition-colors border-r border-terminal-border ${mode === "epoch-to-date"
                            ? "bg-matrix/10 text-matrix"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Epoch → Date
                </button>
                <button
                    onClick={() => { setMode("date-to-epoch"); setInput(""); }}
                    className={`flex-1 py-2.5 text-sm font-mono-soc font-bold transition-colors ${mode === "date-to-epoch"
                            ? "bg-cyan-accent/10 text-cyan-accent"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Date → Epoch
                </button>
            </div>

            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase">
                        {mode === "epoch-to-date" ? "Unix Timestamp" : "Date String"}
                    </label>
                    <button
                        onClick={() =>
                            setInput(
                                mode === "epoch-to-date"
                                    ? String(now)
                                    : new Date().toISOString()
                            )
                        }
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-matrix transition-colors font-mono-soc"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Use Now
                    </button>
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        mode === "epoch-to-date"
                            ? "e.g. 1704067200 or 1704067200000"
                            : "e.g. 2024-01-01T00:00:00Z or Jan 1, 2024"
                    }
                    className="w-full bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                />
            </div>

            {/* Results */}
            {result.date && result.epoch !== null && (
                <div className="space-y-3">
                    {mode === "date-to-epoch" && (
                        <ResultCard title="Unix Epoch" copyContent={String(result.epoch)}>
                            <div className="space-y-1">
                                <p className="text-lg text-matrix font-bold">{result.epoch}</p>
                                <p className="text-xs text-muted-foreground">
                                    Milliseconds: {result.epoch * 1000}
                                </p>
                            </div>
                        </ResultCard>
                    )}
                    <ResultCard title="All Formats">
                        <div className="space-y-2">
                            {DATE_FORMATS.map((fmt) => (
                                <div
                                    key={fmt.label}
                                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-terminal-hover"
                                >
                                    <span className="text-muted-foreground text-xs w-28 shrink-0">
                                        {fmt.label}
                                    </span>
                                    <span className="text-foreground text-xs text-right break-all">
                                        {fmt.format(result.date!)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ResultCard>
                </div>
            )}

            {input.trim() && !result.date && (
                <div className="text-center py-4 text-red-400 font-mono-soc text-sm">
                    Invalid {mode === "epoch-to-date" ? "timestamp" : "date string"}
                </div>
            )}
        </ToolLayout>
    );
}
