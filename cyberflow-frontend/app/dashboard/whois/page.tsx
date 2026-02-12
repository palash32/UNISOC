"use client";

import { useState } from "react";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

interface WhoisResult {
    domainName: string;
    registrar: string;
    createdDate: string;
    updatedDate: string;
    expiryDate: string;
    nameServers: string[];
    status: string[];
    registrantOrg: string;
    registrantCountry: string;
    raw: string;
}

const EXTERNAL_LINKS = (query: string) => [
    { name: "ICANN Lookup", url: `https://lookup.icann.org/en/lookup?name=${query}` },
    { name: "Whois.com", url: `https://www.whois.com/whois/${query}` },
    { name: "DomainTools", url: `https://whois.domaintools.com/${query}` },
    { name: "who.is", url: `https://who.is/whois/${query}` },
    { name: "ARIN (IP)", url: `https://search.arin.net/rdap/?query=${query}` },
    { name: "RIPE (IP)", url: `https://apps.db.ripe.net/db-web-ui/query?searchtext=${query}` },
];

export default function WhoisPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<WhoisResult | null>(null);
    const [error, setError] = useState("");

    const lookup = async () => {
        const query = input.trim();
        if (!query) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            // Use RDAP (Registration Data Access Protocol) - the modern WHOIS replacement
            const isIP = /^[\d.:]+$/.test(query);
            const rdapUrl = isIP
                ? `https://rdap.org/ip/${query}`
                : `https://rdap.org/domain/${query}`;

            const res = await fetch(rdapUrl);
            if (!res.ok) {
                setError("Domain/IP not found or RDAP unavailable.");
                return;
            }

            const data = await res.json();

            // Parse RDAP response
            const nameServers = (data.nameservers || []).map(
                (ns: { ldhName?: string }) => ns.ldhName || ""
            );
            const status = data.status || [];

            // Find dates from events
            const events = data.events || [];
            const createdEvent = events.find((e: { eventAction: string }) => e.eventAction === "registration");
            const updatedEvent = events.find((e: { eventAction: string }) => e.eventAction === "last changed");
            const expiryEvent = events.find((e: { eventAction: string }) => e.eventAction === "expiration");

            // Find registrant
            const entities = data.entities || [];
            const registrantEntity = entities.find(
                (e: { roles?: string[] }) => e.roles?.includes("registrant")
            );
            const registrarEntity = entities.find(
                (e: { roles?: string[] }) => e.roles?.includes("registrar")
            );

            setResult({
                domainName: data.ldhName || data.name || query,
                registrar: registrarEntity?.vcardArray?.[1]?.find(
                    (v: string[]) => v[0] === "fn"
                )?.[3] || registrarEntity?.publicIds?.[0]?.identifier || "",
                createdDate: createdEvent?.eventDate || "",
                updatedDate: updatedEvent?.eventDate || "",
                expiryDate: expiryEvent?.eventDate || "",
                nameServers,
                status,
                registrantOrg: registrantEntity?.vcardArray?.[1]?.find(
                    (v: string[]) => v[0] === "org"
                )?.[3] || "",
                registrantCountry: registrantEntity?.vcardArray?.[1]?.find(
                    (v: string[]) => v[0] === "adr"
                )?.[3]?.country || "",
                raw: JSON.stringify(data, null, 2),
            });
        } catch (err) {
            setError("Failed to query WHOIS. The RDAP service may be unavailable.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") lookup();
    };

    return (
        <ToolLayout
            title="Whois Lookup"
            description="Query WHOIS/RDAP data for domains and IP addresses"
            icon={<Search className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    Domain or IP Address
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. example.com or 8.8.8.8"
                        className="flex-1 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                    />
                    <button
                        onClick={lookup}
                        disabled={!input.trim() || loading}
                        className="px-6 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "> WHOIS"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-center py-4 text-red-400 font-mono-soc text-sm">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    {/* Registration Info */}
                    <ResultCard title="Registration Data">
                        <div className="space-y-1.5 text-xs">
                            {[
                                { label: "Domain/IP", value: result.domainName },
                                { label: "Registrar", value: result.registrar },
                                { label: "Created", value: result.createdDate ? new Date(result.createdDate).toLocaleString() : "" },
                                { label: "Updated", value: result.updatedDate ? new Date(result.updatedDate).toLocaleString() : "" },
                                { label: "Expires", value: result.expiryDate ? new Date(result.expiryDate).toLocaleString() : "" },
                                { label: "Organization", value: result.registrantOrg },
                                { label: "Country", value: result.registrantCountry },
                            ]
                                .filter((r) => r.value)
                                .map((row) => (
                                    <div key={row.label} className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                        <span className="text-muted-foreground w-28 shrink-0">{row.label}</span>
                                        <span className="text-foreground break-all">{row.value}</span>
                                    </div>
                                ))}
                        </div>
                    </ResultCard>

                    {/* Name Servers */}
                    {result.nameServers.length > 0 && (
                        <ResultCard
                            title={`Name Servers (${result.nameServers.length})`}
                            copyContent={result.nameServers.join("\n")}
                        >
                            <div className="space-y-1">
                                {result.nameServers.map((ns, i) => (
                                    <div key={i} className="py-1 px-2 rounded hover:bg-terminal-hover text-xs text-foreground">
                                        {ns}
                                    </div>
                                ))}
                            </div>
                        </ResultCard>
                    )}

                    {/* Status */}
                    {result.status.length > 0 && (
                        <ResultCard title="Domain Status">
                            <div className="flex flex-wrap gap-2">
                                {result.status.map((s, i) => (
                                    <span
                                        key={i}
                                        className="text-[10px] px-2 py-1 rounded bg-matrix/5 text-matrix border border-matrix/20 font-mono-soc"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </ResultCard>
                    )}

                    {/* External Links */}
                    <ResultCard title="WHOIS Providers">
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

                    {/* Raw Data (collapsed) */}
                    <details className="rounded-lg bg-terminal-card border border-terminal-border">
                        <summary className="px-4 py-3 text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase cursor-pointer hover:bg-terminal-hover">
                            Raw RDAP Response
                        </summary>
                        <pre className="px-4 pb-4 text-[10px] text-muted-foreground overflow-x-auto max-h-60 overflow-y-auto font-mono-soc">
                            {result.raw}
                        </pre>
                    </details>
                </div>
            )}
        </ToolLayout>
    );
}
