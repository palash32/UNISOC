"use client";

import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

const PRESET_PATTERNS = [
    { label: "IPv4 Address", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)\\b" },
    { label: "Email Address", pattern: "\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b" },
    { label: "URL", pattern: "https?://[^\\s<>\"'\\)\\]]+" },
    { label: "MD5 Hash", pattern: "\\b[0-9a-fA-F]{32}\\b" },
    { label: "SHA256 Hash", pattern: "\\b[0-9a-fA-F]{64}\\b" },
    { label: "CVE ID", pattern: "CVE-\\d{4}-\\d{4,}" },
    { label: "MAC Address", pattern: "([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}" },
    { label: "Windows File Path", pattern: "[A-Z]:\\\\[^\\s<>\"'|]+" },
    { label: "Base64 String", pattern: "[A-Za-z0-9+/]{20,}={0,2}" },
    { label: "JWT Token", pattern: "eyJ[A-Za-z0-9_-]*\\.eyJ[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]*" },
];

export default function RegexPage() {
    const [pattern, setPattern] = useState("");
    const [flags, setFlags] = useState("gi");
    const [testText, setTestText] = useState("");
    const [error, setError] = useState("");

    let matches: { match: string; index: number }[] = [];
    let regex: RegExp | null = null;

    try {
        if (pattern.trim()) {
            regex = new RegExp(pattern, flags);
            let m;
            const seen = new Set<string>();
            while ((m = regex.exec(testText)) !== null) {
                if (seen.has(`${m.index}-${m[0]}`)) break; // prevent infinite loop
                seen.add(`${m.index}-${m[0]}`);
                matches.push({ match: m[0], index: m.index });
                if (!flags.includes("g")) break;
            }
            setError && error && setError("");
        }
    } catch (e: any) {
        if (!error) setError(e.message);
    }

    return (
        <ToolLayout
            title="Regex Tester"
            description="Test regular expressions against sample text — pre-loaded with common security patterns"
            icon={<FileText className="h-6 w-6" />}
        >
            {/* Preset Patterns */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <h3 className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-3">
                    Security Patterns
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {PRESET_PATTERNS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => setPattern(p.pattern)}
                            className={`text-[10px] px-2 py-1 rounded border transition-colors font-mono-soc ${pattern === p.pattern
                                    ? "bg-matrix/10 border-matrix/30 text-matrix"
                                    : "bg-terminal-hover border-terminal-border text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pattern Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase">
                        Regex Pattern
                    </label>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground font-mono-soc">Flags:</span>
                        <input
                            type="text"
                            value={flags}
                            onChange={(e) => setFlags(e.target.value)}
                            className="w-12 bg-black/30 rounded border border-terminal-border px-2 py-1 text-xs font-mono-soc text-matrix text-center focus:outline-none focus:border-matrix/40"
                        />
                    </div>
                </div>
                <input
                    type="text"
                    value={pattern}
                    onChange={(e) => { setPattern(e.target.value); setError(""); }}
                    placeholder="Enter regex pattern..."
                    className="w-full bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-matrix placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                />
                {error && (
                    <p className="mt-2 text-xs text-red-400 font-mono-soc flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {error}
                    </p>
                )}
            </div>

            {/* Test Text */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    Test Text
                </label>
                <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Paste text to test against the regex pattern..."
                    className="w-full h-36 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40 resize-y"
                />
            </div>

            {/* Results */}
            {pattern.trim() && testText.trim() && !error && (
                <ResultCard
                    title={`Matches (${matches.length})`}
                    copyContent={matches.map((m) => m.match).join("\n")}
                >
                    {matches.length > 0 ? (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {matches.map((m, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-terminal-hover text-xs"
                                >
                                    <span className="text-matrix break-all">{m.match}</span>
                                    <span className="text-muted-foreground shrink-0 ml-2">
                                        pos {m.index}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-xs">No matches found</p>
                    )}
                </ResultCard>
            )}
        </ToolLayout>
    );
}
