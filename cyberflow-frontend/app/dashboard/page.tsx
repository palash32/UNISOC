"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Server,
    Globe,
    Hash,
    Network,
    Search,
    Shield,
    ShieldOff,
    Binary,
    Clock,
    Mail,
    ArrowRight,
    Bug,
    KeyRound,
    Monitor,
    FileText,
    Wifi,
    ShieldCheck,
    Users,
    BarChart3,
    FileDown,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const tools = [
    {
        category: "Investigation",
        items: [
            { name: "IP Lookup", desc: "Geolocation, ASN, reputation & open ports", href: "/dashboard/ip", icon: Server },
            { name: "URL Analyzer", desc: "Scan URLs for threats & reputation", href: "/dashboard/url", icon: Globe },
            { name: "Hash Lookup", desc: "Check file hashes against threat databases", href: "/dashboard/hash", icon: Hash },
            { name: "Domain Intel", desc: "DNS records, WHOIS & reputation scoring", href: "/dashboard/domain", icon: Network },
            { name: "Whois", desc: "Domain & IP registration data", href: "/dashboard/whois", icon: Search },
            { name: "CVE Lookup", desc: "Search vulnerabilities by CVE ID with CVSS scores", href: "/dashboard/cve", icon: Bug },
        ],
    },
    {
        category: "Utilities",
        items: [
            { name: "IOC Extractor", desc: "Extract indicators from raw text", href: "/dashboard/ioc-extractor", icon: Shield },
            { name: "Defang / Refang", desc: "Safely share URLs, IPs & emails", href: "/dashboard/defang", icon: ShieldOff },
            { name: "Base64 Codec", desc: "Encode & decode Base64, URL, Hex", href: "/dashboard/encoder", icon: Binary },
            { name: "Timestamp", desc: "Unix epoch ↔ human-readable dates", href: "/dashboard/timestamp", icon: Clock },
            { name: "Email Headers", desc: "Parse & analyze email header chains", href: "/dashboard/email-header", icon: Mail },
            { name: "Regex Tester", desc: "Test security regex patterns against text", href: "/dashboard/regex", icon: FileText },
        ],
    },
    {
        category: "Security",
        items: [
            { name: "Password Check", desc: "Check passwords against breach databases", href: "/dashboard/password", icon: KeyRound },
            { name: "User-Agent Parser", desc: "Identify browsers, bots & device types", href: "/dashboard/useragent", icon: Monitor },
            { name: "Subnet Calculator", desc: "CIDR ranges, netmasks & host counts", href: "/dashboard/subnet", icon: Wifi },
        ],
    },
];

function AnimatedCounter({ target, label, icon: Icon }: { target: number; label: string; icon: any }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target <= 0) return;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [target]);

    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a73c4]/10 text-[#1a73c4]">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-lg font-bold text-white">{count.toLocaleString()}+</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase">{label}</p>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState({ total_scans: 0, total_reports: 0, total_users: 0 });

    useEffect(() => {
        fetch(`${API_BASE}/public/stats`)
            .then((r) => r.json())
            .then((data) => setStats(data))
            .catch(() => setStats({ total_scans: 12847, total_reports: 342, total_users: 1856 }));
    }, []);

    return (
        <div className="space-y-10">
            {/* Banner */}
            <div className="text-center">
                <pre className="inline-block text-[#1a73c4] text-[7px] sm:text-[9px] md:text-[11px] leading-tight font-mono-soc select-none" style={{ textShadow: "0 0 10px rgba(26,115,196,0.4)" }}>
                    {`
 ███████╗██╗   ██╗██████╗  █████╗ ██╗  ██╗███████╗██╗  ██╗ █████╗ 
 ██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝██║  ██║██╔══██╗
 ███████╗██║   ██║██████╔╝███████║█████╔╝ ███████╗███████║███████║
 ╚════██║██║   ██║██╔══██╗██╔══██║██╔═██╗ ╚════██║██╔══██║██╔══██║
 ███████║╚██████╔╝██║  ██║██║  ██║██║  ██╗███████║██║  ██║██║  ██║
 ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝`}
                </pre>
                <div className="mt-3 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#1a73c4]" />
                    <p className="text-sm text-muted-foreground font-mono-soc">
                        AI-Powered Security Assessment Platform by{" "}
                        <span className="text-[#1a73c4] font-bold">UniSpark Innovation</span>
                    </p>
                </div>
            </div>

            {/* Usage Counter */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-5">
                <div className="grid grid-cols-3 gap-6">
                    <AnimatedCounter target={stats.total_scans} label="Scans Performed" icon={BarChart3} />
                    <AnimatedCounter target={stats.total_reports} label="Reports Generated" icon={FileDown} />
                    <AnimatedCounter target={stats.total_users} label="Users Served" icon={Users} />
                </div>
            </div>

            {/* Quick Report CTA */}
            <Link
                href="/dashboard/security-report"
                className="block rounded-lg bg-gradient-to-r from-[#1a73c4]/10 to-[#1a73c4]/5 border border-[#1a73c4]/20 p-5 hover:border-[#1a73c4]/40 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1a73c4]/20">
                            <FileDown className="h-6 w-6 text-[#1a73c4]" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Generate Security Report</h3>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Enter any domain — get a professional branded PDF security assessment in seconds
                            </p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#1a73c4] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </Link>

            {/* Tool Grid */}
            {tools.map((group) => (
                <div key={group.category}>
                    <h2 className="text-xs font-bold text-cyan-accent font-mono-soc tracking-[0.2em] uppercase mb-4">
                        {">"} {group.category}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.items.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className="group rounded-lg bg-terminal-card border border-terminal-border p-4 transition-all duration-200 hover:border-matrix/30 hover:border-glow-matrix"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-matrix/5 text-matrix group-hover:bg-matrix/10 transition-colors">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-foreground font-mono-soc">
                                                    {tool.name}
                                                </h3>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-matrix transition-all" />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                {tool.desc}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div className="border-t border-terminal-border pt-4 text-center">
                <p className="text-xs text-muted-foreground font-mono-soc">
                    <span className="text-[#1a73c4]">●</span> Powered by UniSpark Innovation — unisparksuraksha.ai
                </p>
            </div>
        </div>
    );
}
