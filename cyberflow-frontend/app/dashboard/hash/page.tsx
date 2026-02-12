"use client";

import { useState } from "react";
import { Hash, ExternalLink, Loader2 } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

function detectHashType(hash: string): string {
    const len = hash.trim().length;
    if (len === 32) return "MD5";
    if (len === 40) return "SHA-1";
    if (len === 64) return "SHA-256";
    if (len === 128) return "SHA-512";
    return "Unknown";
}

const EXTERNAL_LINKS = (hash: string) => [
    { name: "VirusTotal", url: `https://www.virustotal.com/gui/search/${hash}` },
    { name: "MalwareBazaar", url: `https://bazaar.abuse.ch/browse.php?search=${hash}` },
    { name: "Hybrid Analysis", url: `https://www.hybrid-analysis.com/search?query=${hash}` },
    { name: "AlienVault OTX", url: `https://otx.alienvault.com/indicator/file/${hash}` },
    { name: "Any.Run", url: `https://app.any.run/submissions/#filehash:${hash}` },
    { name: "Joe Sandbox", url: `https://www.joesandbox.com/search?q=${hash}` },
];

export default function HashLookupPage() {
    const [input, setInput] = useState("");

    const hashType = input.trim() ? detectHashType(input.trim()) : "";
    const isValid = /^[a-fA-F0-9]+$/.test(input.trim()) && hashType !== "Unknown";

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && isValid) {
            // open VT
            window.open(`https://www.virustotal.com/gui/search/${input.trim()}`, "_blank");
        }
    };

    return (
        <ToolLayout
            title="Hash Lookup"
            description="Identify file hashes and quickly look them up across threat intelligence platforms"
            icon={<Hash className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    File Hash
                </label>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter MD5, SHA-1, SHA-256, or SHA-512 hash"
                    className="w-full bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                />
            </div>

            {input.trim() && (
                <div className="space-y-3">
                    {/* Hash Info */}
                    <ResultCard title="Hash Analysis">
                        <div className="space-y-2 text-xs">
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-28 shrink-0">Hash Value</span>
                                <span className="text-foreground break-all font-mono-soc">{input.trim()}</span>
                            </div>
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-28 shrink-0">Type</span>
                                <span className={`font-bold ${isValid ? "text-matrix" : "text-red-400"}`}>
                                    {hashType}
                                </span>
                            </div>
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-28 shrink-0">Length</span>
                                <span className="text-foreground">{input.trim().length} characters</span>
                            </div>
                            <div className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-28 shrink-0">Valid Hex</span>
                                <span className={/^[a-fA-F0-9]+$/.test(input.trim()) ? "text-green-400" : "text-red-400"}>
                                    {/^[a-fA-F0-9]+$/.test(input.trim()) ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>
                    </ResultCard>

                    {/* External Links */}
                    {isValid && (
                        <ResultCard title="Investigate on External Platforms">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {EXTERNAL_LINKS(input.trim()).map((link) => (
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
                    )}

                    {!isValid && input.trim().length > 0 && (
                        <div className="text-center py-4 text-amber-400 font-mono-soc text-sm">
                            Invalid hash format. Expected hexadecimal characters (0-9, a-f).
                        </div>
                    )}
                </div>
            )}
        </ToolLayout>
    );
}
