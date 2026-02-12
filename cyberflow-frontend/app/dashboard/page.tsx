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
    Terminal,
    Bug,
    KeyRound,
    Monitor,
    FileText,
    Wifi,
} from "lucide-react";

const tools = [
    {
        category: "Investigation",
        items: [
            {
                name: "IP Lookup",
                desc: "Geolocation, ASN, reputation & open ports",
                href: "/dashboard/ip",
                icon: Server,
            },
            {
                name: "URL Analyzer",
                desc: "Scan URLs for threats & reputation",
                href: "/dashboard/url",
                icon: Globe,
            },
            {
                name: "Hash Lookup",
                desc: "Check file hashes against threat databases",
                href: "/dashboard/hash",
                icon: Hash,
            },
            {
                name: "Domain Intel",
                desc: "DNS records, WHOIS & reputation scoring",
                href: "/dashboard/domain",
                icon: Network,
            },
            {
                name: "Whois",
                desc: "Domain & IP registration data",
                href: "/dashboard/whois",
                icon: Search,
            },
            {
                name: "CVE Lookup",
                desc: "Search vulnerabilities by CVE ID with CVSS scores",
                href: "/dashboard/cve",
                icon: Bug,
            },
        ],
    },
    {
        category: "Utilities",
        items: [
            {
                name: "IOC Extractor",
                desc: "Extract indicators from raw text",
                href: "/dashboard/ioc-extractor",
                icon: Shield,
            },
            {
                name: "Defang / Refang",
                desc: "Safely share URLs, IPs & emails",
                href: "/dashboard/defang",
                icon: ShieldOff,
            },
            {
                name: "Base64 Codec",
                desc: "Encode & decode Base64, URL, Hex",
                href: "/dashboard/encoder",
                icon: Binary,
            },
            {
                name: "Timestamp",
                desc: "Unix epoch ↔ human-readable dates",
                href: "/dashboard/timestamp",
                icon: Clock,
            },
            {
                name: "Email Headers",
                desc: "Parse & analyze email header chains",
                href: "/dashboard/email-header",
                icon: Mail,
            },
            {
                name: "Regex Tester",
                desc: "Test security regex patterns against text",
                href: "/dashboard/regex",
                icon: FileText,
            },
        ],
    },
    {
        category: "Security",
        items: [
            {
                name: "Password Check",
                desc: "Check passwords against breach databases",
                href: "/dashboard/password",
                icon: KeyRound,
            },
            {
                name: "User-Agent Parser",
                desc: "Identify browsers, bots & device types",
                href: "/dashboard/useragent",
                icon: Monitor,
            },
            {
                name: "Subnet Calculator",
                desc: "CIDR ranges, netmasks & host counts",
                href: "/dashboard/subnet",
                icon: Wifi,
            },
        ],
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-10">
            {/* ASCII Banner */}
            <div className="text-center">
                <pre className="inline-block text-matrix glow-matrix text-[8px] sm:text-[10px] md:text-xs leading-tight font-mono-soc select-none">
                    {`
 ██╗   ██╗███╗   ██╗██╗███████╗ ██████╗  ██████╗
 ██║   ██║████╗  ██║██║██╔════╝██╔═══██╗██╔════╝
 ██║   ██║██╔██╗ ██║██║███████╗██║   ██║██║     
 ██║   ██║██║╚██╗██║██║╚════██║██║   ██║██║     
 ╚██████╔╝██║ ╚████║██║███████║╚██████╔╝╚██████╗
  ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝ ╚═════╝  ╚═════╝`}
                </pre>
                <div className="mt-3 flex items-center justify-center gap-2">
                    <Terminal className="h-4 w-4 text-cyan-accent" />
                    <p className="text-sm text-muted-foreground font-mono-soc">
                        Security Operations Center Assessment Toolkit
                    </p>
                </div>
            </div>

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
                    <span className="text-matrix">$</span> All data processed locally.
                    No user data is stored or transmitted.
                </p>
            </div>
        </div>
    );
}
