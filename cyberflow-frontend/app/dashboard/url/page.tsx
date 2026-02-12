"use client";

import { useState } from "react";
import { Globe, ExternalLink, Loader2 } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

function extractDomain(url: string): string {
    try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        return parsed.hostname;
    } catch {
        return url;
    }
}

const EXTERNAL_LINKS = (url: string) => {
    const encoded = encodeURIComponent(url);
    return [
        { name: "VirusTotal", url: `https://www.virustotal.com/gui/search/${encoded}` },
        { name: "URLScan.io", url: `https://urlscan.io/search/#${encoded}` },
        { name: "Google Safe Browsing", url: `https://transparencyreport.google.com/safe-browsing/search?url=${encoded}` },
        { name: "Any.Run", url: `https://app.any.run/submissions/` },
        { name: "PhishTank", url: `https://phishtank.org/` },
        { name: "Wayback Machine", url: `https://web.archive.org/web/*/${url}` },
    ];
};

export default function URLAnalyzerPage() {
    const [input, setInput] = useState("");

    const url = input.trim();
    const domain = url ? extractDomain(url) : "";

    let urlParts: { protocol: string; hostname: string; pathname: string; search: string; port: string } | null = null;
    try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        urlParts = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            pathname: parsed.pathname,
            search: parsed.search,
            port: parsed.port,
        };
    } catch {
        urlParts = null;
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && url) {
            window.open(
                `https://www.virustotal.com/gui/search/${encodeURIComponent(url)}`,
                "_blank"
            );
        }
    };

    return (
        <ToolLayout
            title="URL Analyzer"
            description="Decompose URLs and quickly scan them across threat intelligence platforms"
            icon={<Globe className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    URL
                </label>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. https://suspicious-site.com/phishing?id=123"
                    className="w-full bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                />
            </div>

            {url && urlParts && (
                <div className="space-y-3">
                    {/* URL Breakdown */}
                    <ResultCard title="URL Decomposition" copyContent={url}>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-24 shrink-0">Full URL</span>
                                <span className="text-foreground break-all">{url}</span>
                            </div>
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-24 shrink-0">Protocol</span>
                                <span className={`font-bold ${urlParts.protocol === "https:" ? "text-green-400" : "text-amber-400"}`}>
                                    {urlParts.protocol}
                                </span>
                            </div>
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-24 shrink-0">Hostname</span>
                                <span className="text-foreground">{urlParts.hostname}</span>
                            </div>
                            {urlParts.port && (
                                <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                    <span className="text-muted-foreground w-24 shrink-0">Port</span>
                                    <span className="text-amber-400 font-bold">{urlParts.port}</span>
                                </div>
                            )}
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-24 shrink-0">Path</span>
                                <span className="text-foreground">{urlParts.pathname}</span>
                            </div>
                            {urlParts.search && (
                                <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                    <span className="text-muted-foreground w-24 shrink-0">Query</span>
                                    <span className="text-foreground break-all">{urlParts.search}</span>
                                </div>
                            )}
                        </div>
                    </ResultCard>

                    {/* Defanged Version */}
                    <ResultCard
                        title="Defanged URL"
                        copyContent={url
                            .replace(/https?:\/\//gi, (m) => m.replace("http", "hxxp"))
                            .replace(/\./g, "[.]")}
                    >
                        <p className="text-foreground break-all">
                            {url
                                .replace(/https?:\/\//gi, (m) => m.replace("http", "hxxp"))
                                .replace(/\./g, "[.]")}
                        </p>
                    </ResultCard>

                    {/* External Links */}
                    <ResultCard title="Investigate on External Platforms">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {EXTERNAL_LINKS(url).map((link) => (
                                <a
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 py-2 px-3 rounded bg-terminal-hover text-xs text-muted-foreground hover:text-cyan-accent hover:bg-cyan-accent/5 transition-colors font-mono-soc"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </ResultCard>
                </div>
            )}
        </ToolLayout>
    );
}
