"use client";

import { useState } from "react";
import { Network, ExternalLink, Loader2 } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

interface DNSRecord {
    type: string;
    value: string;
    ttl?: number;
}

const EXTERNAL_LINKS = (domain: string) => [
    { name: "VirusTotal", url: `https://www.virustotal.com/gui/domain/${domain}` },
    { name: "Shodan", url: `https://www.shodan.io/search?query=${domain}` },
    { name: "SecurityTrails", url: `https://securitytrails.com/domain/${domain}` },
    { name: "crt.sh", url: `https://crt.sh/?q=${domain}` },
    { name: "URLScan.io", url: `https://urlscan.io/search/#${domain}` },
    { name: "AlienVault OTX", url: `https://otx.alienvault.com/indicator/domain/${domain}` },
    { name: "DNSDumpster", url: `https://dnsdumpster.com/` },
    { name: "Whois", url: `/dashboard/whois?q=${domain}` },
];

export default function DomainIntelPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
    const [error, setError] = useState("");

    const lookup = async () => {
        const domain = input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        if (!domain) return;
        setLoading(true);
        setError("");
        setDnsRecords([]);

        try {
            // Use Google DNS-over-HTTPS for DNS resolution (no key needed)
            const types = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"];
            const records: DNSRecord[] = [];

            for (const type of types) {
                try {
                    const res = await fetch(
                        `https://dns.google/resolve?name=${domain}&type=${type}`
                    );
                    const data = await res.json();
                    if (data.Answer) {
                        for (const answer of data.Answer) {
                            records.push({
                                type: type,
                                value: answer.data,
                                ttl: answer.TTL,
                            });
                        }
                    }
                } catch {
                    // Some record types may not exist
                }
            }

            setDnsRecords(records);
            if (records.length === 0) {
                setError("No DNS records found for this domain.");
            }
        } catch (err) {
            setError("Failed to resolve domain. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") lookup();
    };

    // Group records by type
    const grouped = dnsRecords.reduce((acc, r) => {
        if (!acc[r.type]) acc[r.type] = [];
        acc[r.type].push(r);
        return acc;
    }, {} as Record<string, DNSRecord[]>);

    return (
        <ToolLayout
            title="Domain Intel"
            description="DNS resolution, record enumeration, and quick-links to domain intelligence platforms"
            icon={<Network className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    Domain Name
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. example.com"
                        className="flex-1 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                    />
                    <button
                        onClick={lookup}
                        disabled={!input.trim() || loading}
                        className="px-6 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "> RESOLVE"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-center py-4 text-red-400 font-mono-soc text-sm">
                    {error}
                </div>
            )}

            {Object.keys(grouped).length > 0 && (
                <div className="space-y-3">
                    {/* DNS Records */}
                    {Object.entries(grouped).map(([type, records]) => (
                        <ResultCard
                            key={type}
                            title={`${type} Records (${records.length})`}
                            copyContent={records.map((r) => r.value).join("\n")}
                        >
                            <div className="space-y-1">
                                {records.map((r, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-terminal-hover text-xs"
                                    >
                                        <span className="text-foreground break-all">{r.value}</span>
                                        {r.ttl !== undefined && (
                                            <span className="text-muted-foreground shrink-0 ml-2">
                                                TTL: {r.ttl}s
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ResultCard>
                    ))}

                    {/* External Links */}
                    <ResultCard title="Investigate Further">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {EXTERNAL_LINKS(input.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).map(
                                (link) => (
                                    <a
                                        key={link.name}
                                        href={link.url}
                                        target={link.url.startsWith("/") ? undefined : "_blank"}
                                        rel={link.url.startsWith("/") ? undefined : "noopener noreferrer"}
                                        className="flex items-center gap-2 py-2 px-3 rounded bg-terminal-hover text-xs text-muted-foreground hover:text-cyan-accent hover:bg-cyan-accent/5 transition-colors font-mono-soc"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        {link.name}
                                    </a>
                                )
                            )}
                        </div>
                    </ResultCard>
                </div>
            )}
        </ToolLayout>
    );
}
