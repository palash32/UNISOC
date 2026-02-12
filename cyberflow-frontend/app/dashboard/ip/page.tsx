"use client";

import { useState } from "react";
import { Server, ExternalLink, Loader2 } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

interface IPResult {
    ip: string;
    hostname: string;
    city: string;
    region: string;
    country: string;
    org: string;
    asn: string;
    isp: string;
    timezone: string;
    lat: number;
    lon: number;
}

const EXTERNAL_LINKS = (ip: string) => [
    { name: "VirusTotal", url: `https://www.virustotal.com/gui/ip-address/${ip}` },
    { name: "AbuseIPDB", url: `https://www.abuseipdb.com/check/${ip}` },
    { name: "Shodan", url: `https://www.shodan.io/host/${ip}` },
    { name: "AlienVault OTX", url: `https://otx.alienvault.com/indicator/ip/${ip}` },
    { name: "GreyNoise", url: `https://viz.greynoise.io/ip/${ip}` },
    { name: "Censys", url: `https://search.censys.io/hosts/${ip}` },
];

export default function IPLookupPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IPResult | null>(null);
    const [error, setError] = useState("");

    const lookup = async () => {
        const ip = input.trim();
        if (!ip) return;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            // Use free ip-api.com for geolocation (no key needed)
            const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp,org,as,query,reverse`);
            const data = await res.json();

            if (data.status === "fail") {
                setError(data.message || "Invalid IP address");
                return;
            }

            setResult({
                ip: data.query || ip,
                hostname: data.reverse || "",
                city: data.city || "",
                region: data.regionName || "",
                country: data.country || "",
                org: data.org || "",
                asn: data.as || "",
                isp: data.isp || "",
                timezone: data.timezone || "",
                lat: data.lat || 0,
                lon: data.lon || 0,
            });
        } catch (err) {
            setError("Failed to lookup IP. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") lookup();
    };

    return (
        <ToolLayout
            title="IP Lookup"
            description="Geolocation, ASN, organization, and quick-links to threat intelligence platforms"
            icon={<Server className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    IP Address
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. 8.8.8.8 or 2001:4860:4860::8888"
                        className="flex-1 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                    />
                    <button
                        onClick={lookup}
                        disabled={!input.trim() || loading}
                        className="px-6 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "> LOOKUP"}
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
                    {/* Geolocation */}
                    <ResultCard title="Geolocation & Network">
                        <div className="space-y-1.5 text-xs">
                            {[
                                { label: "IP", value: result.ip },
                                { label: "Hostname", value: result.hostname },
                                { label: "Location", value: `${result.city}, ${result.region}, ${result.country}` },
                                { label: "Coordinates", value: `${result.lat}, ${result.lon}` },
                                { label: "Timezone", value: result.timezone },
                                { label: "ISP", value: result.isp },
                                { label: "Organization", value: result.org },
                                { label: "ASN", value: result.asn },
                            ]
                                .filter((r) => r.value && r.value !== ", , ")
                                .map((row) => (
                                    <div key={row.label} className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                        <span className="text-muted-foreground w-28 shrink-0">{row.label}</span>
                                        <span className="text-foreground break-all">{row.value}</span>
                                    </div>
                                ))}
                        </div>
                    </ResultCard>

                    {/* External Links */}
                    <ResultCard title="Investigate Further">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {EXTERNAL_LINKS(result.ip).map((link) => (
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
