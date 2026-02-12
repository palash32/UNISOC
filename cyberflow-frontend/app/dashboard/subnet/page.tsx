"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

function ipToLong(ip: string): number {
    const parts = ip.split(".").map(Number);
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function longToIp(long: number): string {
    return [
        (long >>> 24) & 255,
        (long >>> 16) & 255,
        (long >>> 8) & 255,
        long & 255,
    ].join(".");
}

function parseCIDR(cidr: string): {
    network: string;
    broadcast: string;
    firstHost: string;
    lastHost: string;
    netmask: string;
    wildcard: string;
    prefix: number;
    totalHosts: number;
    usableHosts: number;
    ipClass: string;
    isPrivate: boolean;
    binary: string;
} | null {
    const match = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
    if (!match) return null;

    const ip = match[1];
    const prefix = parseInt(match[2]);
    if (prefix < 0 || prefix > 32) return null;

    const parts = ip.split(".").map(Number);
    if (parts.some((p) => p < 0 || p > 255)) return null;

    const ipLong = ipToLong(ip);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const wildcard = (~mask) >>> 0;
    const network = (ipLong & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const totalHosts = Math.pow(2, 32 - prefix);
    const usableHosts = prefix <= 30 ? totalHosts - 2 : totalHosts;

    const firstOctet = parts[0];
    let ipClass = "A";
    if (firstOctet >= 224) ipClass = "D (Multicast)";
    else if (firstOctet >= 192) ipClass = "C";
    else if (firstOctet >= 128) ipClass = "B";

    const isPrivate =
        (firstOctet === 10) ||
        (firstOctet === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (firstOctet === 192 && parts[1] === 168);

    const binary = parts
        .map((p) => p.toString(2).padStart(8, "0"))
        .join(".");

    return {
        network: longToIp(network),
        broadcast: longToIp(broadcast),
        firstHost: prefix <= 30 ? longToIp(network + 1) : longToIp(network),
        lastHost: prefix <= 30 ? longToIp(broadcast - 1) : longToIp(broadcast),
        netmask: longToIp(mask),
        wildcard: longToIp(wildcard),
        prefix,
        totalHosts,
        usableHosts,
        ipClass,
        isPrivate,
        binary,
    };
}

export default function SubnetPage() {
    const [input, setInput] = useState("");
    const result = input.trim() ? parseCIDR(input.trim()) : null;

    return (
        <ToolLayout
            title="Subnet Calculator"
            description="Calculate network ranges, broadcast addresses, and host counts from CIDR notation"
            icon={<Network className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    CIDR Notation
                </label>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 192.168.1.0/24 or 10.0.0.0/8"
                    className="w-full bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                />
            </div>

            {result && (
                <div className="space-y-3">
                    <ResultCard title="Network Details">
                        <div className="space-y-1.5 text-xs">
                            {[
                                { label: "Network", value: `${result.network}/${result.prefix}` },
                                { label: "Netmask", value: result.netmask },
                                { label: "Wildcard", value: result.wildcard },
                                { label: "Broadcast", value: result.broadcast },
                                { label: "First Host", value: result.firstHost },
                                { label: "Last Host", value: result.lastHost },
                                { label: "Total Hosts", value: result.totalHosts.toLocaleString() },
                                { label: "Usable Hosts", value: result.usableHosts.toLocaleString() },
                                { label: "IP Class", value: result.ipClass },
                                {
                                    label: "Scope",
                                    value: result.isPrivate ? "Private (RFC 1918)" : "Public",
                                },
                            ].map((row) => (
                                <div key={row.label} className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                    <span className="text-muted-foreground w-28 shrink-0">{row.label}</span>
                                    <span className="text-foreground">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </ResultCard>

                    <ResultCard title="Binary Representation" copyContent={result.binary}>
                        <p className="text-foreground tracking-wider">{result.binary}</p>
                    </ResultCard>

                    {/* Common Subnets Reference */}
                    <ResultCard title="Common Subnets Reference">
                        <div className="space-y-1 text-xs">
                            {[
                                { cidr: "/32", hosts: "1", mask: "255.255.255.255" },
                                { cidr: "/31", hosts: "2", mask: "255.255.255.254" },
                                { cidr: "/30", hosts: "4", mask: "255.255.255.252" },
                                { cidr: "/24", hosts: "256", mask: "255.255.255.0" },
                                { cidr: "/16", hosts: "65,536", mask: "255.255.0.0" },
                                { cidr: "/8", hosts: "16,777,216", mask: "255.0.0.0" },
                            ].map((s) => (
                                <div key={s.cidr} className="flex gap-4 py-1 px-2 rounded hover:bg-terminal-hover">
                                    <span className={`text-matrix w-8 ${s.cidr === `/${result.prefix}` ? "font-bold" : ""}`}>{s.cidr}</span>
                                    <span className="text-muted-foreground w-24">{s.mask}</span>
                                    <span className="text-foreground">{s.hosts} hosts</span>
                                </div>
                            ))}
                        </div>
                    </ResultCard>
                </div>
            )}

            {input.trim() && !result && (
                <div className="text-center py-4 text-red-400 font-mono-soc text-sm">
                    Invalid CIDR notation. Use format: IP/prefix (e.g. 192.168.1.0/24)
                </div>
            )}
        </ToolLayout>
    );
}
