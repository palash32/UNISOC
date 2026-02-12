"use client";

import { useState } from "react";
import { Mail, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

interface EmailHop {
    from: string;
    by: string;
    with: string;
    timestamp: string;
    delay: string;
}

interface ParsedHeaders {
    hops: EmailHop[];
    from: string;
    to: string;
    subject: string;
    date: string;
    messageId: string;
    spf: { status: string; detail: string } | null;
    dkim: { status: string; detail: string } | null;
    dmarc: { status: string; detail: string } | null;
    replyTo: string;
    returnPath: string;
    xOrigIp: string;
    contentType: string;
}

function parseHeaders(raw: string): ParsedHeaders {
    const lines = raw.split(/\r?\n/);
    const headers: Record<string, string[]> = {};
    let currentKey = "";
    let currentValue = "";

    for (const line of lines) {
        if (/^\s/.test(line)) {
            currentValue += " " + line.trim();
        } else {
            if (currentKey) {
                if (!headers[currentKey]) headers[currentKey] = [];
                headers[currentKey].push(currentValue);
            }
            const colonIdx = line.indexOf(":");
            if (colonIdx > 0) {
                currentKey = line.substring(0, colonIdx).toLowerCase().trim();
                currentValue = line.substring(colonIdx + 1).trim();
            }
        }
    }
    if (currentKey) {
        if (!headers[currentKey]) headers[currentKey] = [];
        headers[currentKey].push(currentValue);
    }

    // Parse Received headers into hops
    const receivedHeaders = headers["received"] || [];
    const hops: EmailHop[] = receivedHeaders.map((h) => {
        const fromMatch = h.match(/from\s+(\S+)/i);
        const byMatch = h.match(/by\s+(\S+)/i);
        const withMatch = h.match(/with\s+(\S+)/i);
        const dateMatch = h.match(/;\s*(.+)$/);

        return {
            from: fromMatch?.[1] || "unknown",
            by: byMatch?.[1] || "unknown",
            with: withMatch?.[1] || "unknown",
            timestamp: dateMatch?.[1]?.trim() || "",
            delay: "",
        };
    }).reverse();

    // Calculate delays
    for (let i = 1; i < hops.length; i++) {
        const prev = new Date(hops[i - 1].timestamp).getTime();
        const curr = new Date(hops[i].timestamp).getTime();
        if (!isNaN(prev) && !isNaN(curr)) {
            const diff = Math.abs(curr - prev) / 1000;
            if (diff < 60) hops[i].delay = `${Math.round(diff)}s`;
            else if (diff < 3600) hops[i].delay = `${Math.round(diff / 60)}m`;
            else hops[i].delay = `${Math.round(diff / 3600)}h`;
        }
    }

    // Parse authentication status
    const getAuthStatus = (
        headerName: string
    ): { status: string; detail: string } | null => {
        const values = headers[headerName] || headers["authentication-results"] || [];
        for (const v of values) {
            const lowerV = v.toLowerCase();
            if (lowerV.includes(headerName.replace("received-", ""))) {
                if (lowerV.includes("pass")) return { status: "pass", detail: v.trim() };
                if (lowerV.includes("fail")) return { status: "fail", detail: v.trim() };
                if (lowerV.includes("neutral")) return { status: "neutral", detail: v.trim() };
                if (lowerV.includes("none")) return { status: "none", detail: v.trim() };
            }
        }
        // Also check dedicated headers
        const dedicated = headers[headerName];
        if (dedicated?.[0]) {
            const d = dedicated[0].toLowerCase();
            if (d.includes("pass")) return { status: "pass", detail: dedicated[0].trim() };
            if (d.includes("fail")) return { status: "fail", detail: dedicated[0].trim() };
        }
        return null;
    };

    return {
        hops,
        from: (headers["from"] || [""])[0],
        to: (headers["to"] || [""])[0],
        subject: (headers["subject"] || [""])[0],
        date: (headers["date"] || [""])[0],
        messageId: (headers["message-id"] || [""])[0],
        spf: getAuthStatus("received-spf"),
        dkim: getAuthStatus("dkim-signature"),
        dmarc: getAuthStatus("dmarc"),
        replyTo: (headers["reply-to"] || [""])[0],
        returnPath: (headers["return-path"] || [""])[0],
        xOrigIp: (headers["x-originating-ip"] || headers["x-sender-ip"] || [""])[0],
        contentType: (headers["content-type"] || [""])[0],
    };
}

function AuthBadge({ status }: { status: string }) {
    if (status === "pass")
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-mono-soc">
                <CheckCircle className="h-3 w-3" /> PASS
            </span>
        );
    if (status === "fail")
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-mono-soc">
                <XCircle className="h-3 w-3" /> FAIL
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 font-mono-soc">
            <AlertTriangle className="h-3 w-3" /> {status.toUpperCase() || "N/A"}
        </span>
    );
}

export default function EmailHeaderPage() {
    const [input, setInput] = useState("");
    const [parsed, setParsed] = useState<ParsedHeaders | null>(null);

    const analyze = () => {
        if (!input.trim()) return;
        setParsed(parseHeaders(input));
    };

    return (
        <ToolLayout
            title="Email Header Analyzer"
            description="Parse email headers to trace routing, check SPF/DKIM/DMARC, and analyze delivery hops"
            icon={<Mail className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    Raw Email Headers
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste the full email header content here..."
                    className="w-full h-48 bg-black/30 rounded border border-terminal-border p-3 text-xs font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40 resize-y"
                />
                <button
                    onClick={analyze}
                    disabled={!input.trim()}
                    className="mt-3 w-full py-2.5 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {">"} ANALYZE HEADERS
                </button>
            </div>

            {parsed && (
                <div className="space-y-3">
                    {/* Summary */}
                    <ResultCard title="Message Summary">
                        <div className="space-y-2 text-xs">
                            {[
                                { label: "From", value: parsed.from },
                                { label: "To", value: parsed.to },
                                { label: "Subject", value: parsed.subject },
                                { label: "Date", value: parsed.date },
                                { label: "Message-ID", value: parsed.messageId },
                                { label: "Reply-To", value: parsed.replyTo },
                                { label: "Return-Path", value: parsed.returnPath },
                                { label: "X-Orig-IP", value: parsed.xOrigIp },
                            ]
                                .filter((r) => r.value)
                                .map((row) => (
                                    <div key={row.label} className="flex gap-3 py-1 px-2 rounded hover:bg-terminal-hover">
                                        <span className="text-muted-foreground w-24 shrink-0">
                                            {row.label}
                                        </span>
                                        <span className="text-foreground break-all">{row.value}</span>
                                    </div>
                                ))}
                        </div>
                    </ResultCard>

                    {/* Authentication Results */}
                    <ResultCard title="Authentication Results">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground text-xs">SPF</span>
                                <AuthBadge status={parsed.spf?.status || "none"} />
                            </div>
                            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground text-xs">DKIM</span>
                                <AuthBadge status={parsed.dkim?.status || "none"} />
                            </div>
                            <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground text-xs">DMARC</span>
                                <AuthBadge status={parsed.dmarc?.status || "none"} />
                            </div>
                        </div>
                    </ResultCard>

                    {/* Hops */}
                    {parsed.hops.length > 0 && (
                        <ResultCard title={`Delivery Path (${parsed.hops.length} hops)`}>
                            <div className="space-y-3">
                                {parsed.hops.map((hop, i) => (
                                    <div
                                        key={i}
                                        className="relative pl-6 pb-3 border-l border-terminal-border last:border-l-0"
                                    >
                                        <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-matrix border-2 border-terminal-border" />
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-matrix font-bold">
                                                    Hop {i + 1}
                                                </span>
                                                {hop.delay && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono-soc">
                                                        +{hop.delay}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs">
                                                <span className="text-muted-foreground">from </span>
                                                <span className="text-foreground">{hop.from}</span>
                                            </p>
                                            <p className="text-xs">
                                                <span className="text-muted-foreground">by </span>
                                                <span className="text-foreground">{hop.by}</span>
                                            </p>
                                            <p className="text-xs">
                                                <span className="text-muted-foreground">with </span>
                                                <span className="text-foreground">{hop.with}</span>
                                            </p>
                                            {hop.timestamp && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    {hop.timestamp}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ResultCard>
                    )}
                </div>
            )}
        </ToolLayout>
    );
}
