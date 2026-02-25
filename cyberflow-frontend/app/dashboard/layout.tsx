"use client";

// Auth disabled — will re-enable for production handover
// import { OrganizationSwitcher, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
    Search,
    Globe,
    Hash,
    Shield,
    ShieldOff,
    Binary,
    Clock,
    Mail,
    Server,
    Network,
    ChevronLeft,
    ChevronRight,
    Bug,
    KeyRound,
    Monitor,
    FileText,
    Wifi,
    ShieldCheck,
    FileDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const toolGroups = [
    {
        label: "REPORTS",
        items: [
            { name: "Security Report", href: "/dashboard/security-report", icon: FileDown },
        ],
    },
    {
        label: "INVESTIGATION",
        items: [
            { name: "IP Lookup", href: "/dashboard/ip", icon: Server },
            { name: "URL Analyzer", href: "/dashboard/url", icon: Globe },
            { name: "Hash Lookup", href: "/dashboard/hash", icon: Hash },
            { name: "Domain Intel", href: "/dashboard/domain", icon: Network },
            { name: "Whois", href: "/dashboard/whois", icon: Search },
            { name: "CVE Lookup", href: "/dashboard/cve", icon: Bug },
        ],
    },
    {
        label: "UTILITIES",
        items: [
            { name: "IOC Extractor", href: "/dashboard/ioc-extractor", icon: Shield },
            { name: "Defang / Refang", href: "/dashboard/defang", icon: ShieldOff },
            { name: "Base64 Codec", href: "/dashboard/encoder", icon: Binary },
            { name: "Timestamp", href: "/dashboard/timestamp", icon: Clock },
            { name: "Email Headers", href: "/dashboard/email-header", icon: Mail },
            { name: "Regex Tester", href: "/dashboard/regex", icon: FileText },
        ],
    },
    {
        label: "SECURITY",
        items: [
            { name: "Password Check", href: "/dashboard/password", icon: KeyRound },
            { name: "User-Agent", href: "/dashboard/useragent", icon: Monitor },
            { name: "Subnet Calc", href: "/dashboard/subnet", icon: Wifi },
        ],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-terminal overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col border-r border-terminal-border bg-[#080810] transition-all duration-300",
                    collapsed ? "w-16" : "w-60"
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 h-14 border-b border-terminal-border">
                    {!collapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-matrix" />
                            <span className="text-sm font-bold text-matrix glow-matrix font-mono-soc tracking-wider">
                                Suraksha
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded text-muted-foreground hover:text-matrix transition-colors"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                    {toolGroups.map((group) => (
                        <div key={group.label}>
                            {!collapsed && (
                                <p className="px-2 mb-2 text-[10px] font-bold text-muted-foreground tracking-[0.2em] font-mono-soc">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={collapsed ? item.name : undefined}
                                            className={cn(
                                                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-all duration-200",
                                                collapsed && "justify-center px-0",
                                                isActive
                                                    ? "bg-matrix/10 text-matrix border-glow-matrix"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-terminal-hover"
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    isActive && "text-matrix"
                                                )}
                                            />
                                            {!collapsed && (
                                                <span className="font-mono-soc text-xs">
                                                    {item.name}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="border-t border-terminal-border p-3">
                    <div className={cn("flex flex-col", collapsed ? "items-center" : "gap-1")}>
                        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
                            <ShieldCheck className="h-4 w-4 text-matrix/50" />
                            {!collapsed && (
                                <span className="text-[10px] text-muted-foreground font-mono-soc">
                                    v1.0.0
                                </span>
                            )}
                        </div>
                        {!collapsed && (
                            <span className="text-[9px] text-slate-600 font-mono-soc">
                                © UniSpark Innovation
                            </span>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="scanline min-h-full">
                    <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
                </div>
            </main>
        </div>
    );
}
