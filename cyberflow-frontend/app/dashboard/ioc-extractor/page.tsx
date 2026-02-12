"use client";

import { useState } from "react";
import { Shield, Copy, Check, Trash2, Download } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

const IOC_PATTERNS = {
    ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b/g,
    ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}\b/g,
    domain: /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|net|org|io|gov|edu|mil|co|us|uk|de|fr|ru|cn|jp|br|info|biz|xyz|top|online|site|tech|cloud|dev|app|me)\b/gi,
    url: /https?:\/\/[^\s<>"')\]]+/gi,
    defangedUrl: /hxxps?:\/\/[^\s<>"')\]]+|https?\[:\]\/\/[^\s<>"')\]]+/gi,
    defangedDomain: /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\[\.\])+(?:com|net|org|io|gov|edu|mil|co)\b/gi,
    md5: /\b[0-9a-fA-F]{32}\b/g,
    sha1: /\b[0-9a-fA-F]{40}\b/g,
    sha256: /\b[0-9a-fA-F]{64}\b/g,
    email: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    cve: /CVE-\d{4}-\d{4,}/gi,
};

type IOCType = keyof typeof IOC_PATTERNS;

interface ExtractedIOCs {
    [key: string]: string[];
}

export default function IOCExtractorPage() {
    const [input, setInput] = useState("");
    const [results, setResults] = useState<ExtractedIOCs>({});
    const [copiedCategory, setCopiedCategory] = useState<string | null>(null);

    const extract = () => {
        const extracted: ExtractedIOCs = {};
        for (const [type, pattern] of Object.entries(IOC_PATTERNS)) {
            const matches = input.match(pattern);
            if (matches) {
                extracted[type] = [...new Set(matches)];
            }
        }
        setResults(extracted);
    };

    const copyCategory = async (category: string) => {
        const items = results[category];
        if (!items) return;
        await navigator.clipboard.writeText(items.join("\n"));
        setCopiedCategory(category);
        setTimeout(() => setCopiedCategory(null), 2000);
    };

    const exportAll = () => {
        const data = JSON.stringify(results, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ioc-extraction-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalCount = Object.values(results).reduce((acc, arr) => acc + arr.length, 0);

    const categoryLabels: Record<string, string> = {
        ipv4: "IPv4 Addresses",
        ipv6: "IPv6 Addresses",
        domain: "Domains",
        url: "URLs",
        defangedUrl: "Defanged URLs",
        defangedDomain: "Defanged Domains",
        md5: "MD5 Hashes",
        sha1: "SHA1 Hashes",
        sha256: "SHA256 Hashes",
        email: "Email Addresses",
        cve: "CVE IDs",
    };

    return (
        <ToolLayout
            title="IOC Extractor"
            description="Extract Indicators of Compromise from raw text — IPs, domains, URLs, hashes, emails, CVEs"
            icon={<Shield className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase">
                        Input Text
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setInput(""); setResults({}); }}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-terminal-hover text-muted-foreground hover:text-foreground transition-colors font-mono-soc"
                        >
                            <Trash2 className="h-3 w-3" />
                            Clear
                        </button>
                    </div>
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste logs, emails, reports, or any text containing IOCs..."
                    className="w-full h-48 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40 resize-y"
                />
                <button
                    onClick={extract}
                    disabled={!input.trim()}
                    className="mt-3 w-full py-2.5 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {">"} EXTRACT INDICATORS
                </button>
            </div>

            {/* Results */}
            {totalCount > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-mono-soc text-muted-foreground">
                            Found <span className="text-matrix font-bold">{totalCount}</span> indicators
                            across <span className="text-cyan-accent font-bold">{Object.keys(results).length}</span> categories
                        </p>
                        <button
                            onClick={exportAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-cyan-accent/10 border border-cyan-accent/30 text-cyan-accent hover:bg-cyan-accent/20 transition-colors font-mono-soc"
                        >
                            <Download className="h-3 w-3" />
                            Export JSON
                        </button>
                    </div>

                    {Object.entries(results).map(([category, items]) => (
                        <ResultCard
                            key={category}
                            title={`${categoryLabels[category] || category} (${items.length})`}
                            copyContent={items.join("\n")}
                        >
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {items.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-terminal-hover group"
                                    >
                                        <span className="text-foreground break-all">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </ResultCard>
                    ))}
                </div>
            )}

            {totalCount === 0 && input.trim() && Object.keys(results).length === 0 && (
                <div className="text-center py-8 text-muted-foreground font-mono-soc text-sm">
                    No indicators found in the provided text.
                </div>
            )}
        </ToolLayout>
    );
}
