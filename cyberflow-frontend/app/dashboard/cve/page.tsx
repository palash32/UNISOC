"use client";

import { useState } from "react";
import { Bug, ExternalLink, Loader2 } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

interface CVEResult {
    id: string;
    description: string;
    published: string;
    lastModified: string;
    cvssScore: number | null;
    cvssVector: string;
    severity: string;
    references: string[];
    cweId: string;
}

const EXTERNAL_LINKS = (cve: string) => [
    { name: "NVD", url: `https://nvd.nist.gov/vuln/detail/${cve}` },
    { name: "MITRE", url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve}` },
    { name: "Exploit-DB", url: `https://www.exploit-db.com/search?cve=${cve.replace("CVE-", "")}` },
    { name: "GitHub Advisories", url: `https://github.com/advisories?query=${cve}` },
    { name: "Vulners", url: `https://vulners.com/cve/${cve}` },
];

export default function CVELookupPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CVEResult | null>(null);
    const [error, setError] = useState("");

    const lookup = async () => {
        const cve = input.trim().toUpperCase();
        if (!cve) return;
        if (!/^CVE-\d{4}-\d{4,}$/.test(cve)) {
            setError("Invalid CVE format. Use CVE-YYYY-NNNNN (e.g. CVE-2024-1234)");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch(
                `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cve}`
            );
            if (!res.ok) {
                setError("CVE not found or NVD API unavailable.");
                return;
            }

            const data = await res.json();
            const vuln = data.vulnerabilities?.[0]?.cve;
            if (!vuln) {
                setError("CVE not found in the NVD database.");
                return;
            }

            // Extract CVSS score
            const metrics = vuln.metrics;
            let cvssScore: number | null = null;
            let cvssVector = "";
            let severity = "N/A";

            if (metrics?.cvssMetricV31?.[0]) {
                const m = metrics.cvssMetricV31[0].cvssData;
                cvssScore = m.baseScore;
                cvssVector = m.vectorString;
                severity = m.baseSeverity;
            } else if (metrics?.cvssMetricV2?.[0]) {
                const m = metrics.cvssMetricV2[0].cvssData;
                cvssScore = m.baseScore;
                cvssVector = m.vectorString;
                const score = cvssScore ?? 0;
                severity = m.baseSeverity || (score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW");
            }

            const refs = (vuln.references || []).map((r: { url: string }) => r.url).slice(0, 10);
            const cweId = vuln.weaknesses?.[0]?.description?.[0]?.value || "";

            setResult({
                id: vuln.id,
                description: vuln.descriptions?.find((d: { lang: string }) => d.lang === "en")?.value || "",
                published: vuln.published || "",
                lastModified: vuln.lastModified || "",
                cvssScore,
                cvssVector,
                severity,
                references: refs,
                cweId,
            });
        } catch (err) {
            setError("Failed to query NVD. Check your connection or try again later.");
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toUpperCase()) {
            case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/30";
            case "HIGH": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
            case "MEDIUM": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
            case "LOW": return "text-green-400 bg-green-400/10 border-green-400/30";
            default: return "text-muted-foreground bg-terminal-hover border-terminal-border";
        }
    };

    return (
        <ToolLayout
            title="CVE Lookup"
            description="Search vulnerability details from NIST NVD — CVSS scores, descriptions, references"
            icon={<Bug className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    CVE Identifier
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && lookup()}
                        placeholder="e.g. CVE-2024-3094 or CVE-2021-44228"
                        className="flex-1 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                    />
                    <button
                        onClick={lookup}
                        disabled={!input.trim() || loading}
                        className="px-6 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "> LOOKUP"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-center py-4 text-red-400 font-mono-soc text-sm">{error}</div>
            )}

            {result && (
                <div className="space-y-3">
                    {/* CVSS Score Badge */}
                    {result.cvssScore !== null && (
                        <div className={`rounded-lg border p-4 ${getSeverityColor(result.severity)}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold font-mono-soc">{result.cvssScore}</p>
                                    <p className="text-xs font-mono-soc uppercase tracking-wider">{result.severity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-mono-soc">{result.id}</p>
                                    {result.cweId && (
                                        <p className="text-xs font-mono-soc opacity-70">{result.cweId}</p>
                                    )}
                                </div>
                            </div>
                            {result.cvssVector && (
                                <p className="text-[10px] font-mono-soc mt-2 opacity-60">{result.cvssVector}</p>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <ResultCard title="Description">
                        <p className="text-xs text-foreground leading-relaxed">{result.description}</p>
                    </ResultCard>

                    {/* Dates */}
                    <ResultCard title="Timeline">
                        <div className="space-y-1.5 text-xs">
                            <div className="flex gap-3 py-1 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-28">Published</span>
                                <span className="text-foreground">
                                    {result.published ? new Date(result.published).toLocaleString() : "—"}
                                </span>
                            </div>
                            <div className="flex gap-3 py-1 px-2 rounded hover:bg-terminal-hover">
                                <span className="text-muted-foreground w-28">Last Modified</span>
                                <span className="text-foreground">
                                    {result.lastModified ? new Date(result.lastModified).toLocaleString() : "—"}
                                </span>
                            </div>
                        </div>
                    </ResultCard>

                    {/* References */}
                    {result.references.length > 0 && (
                        <ResultCard title={`References (${result.references.length})`}>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {result.references.map((ref, i) => (
                                    <a
                                        key={i}
                                        href={ref}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-terminal-hover text-xs text-cyan-accent/70 hover:text-cyan-accent break-all"
                                    >
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        {ref}
                                    </a>
                                ))}
                            </div>
                        </ResultCard>
                    )}

                    {/* External Links */}
                    <ResultCard title="Investigate Further">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {EXTERNAL_LINKS(result.id).map((link) => (
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
