"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

interface ParsedUA {
    browser: string;
    browserVersion: string;
    engine: string;
    os: string;
    osVersion: string;
    device: string;
    isBot: boolean;
    botName: string;
    isMobile: boolean;
    raw: string;
}

function parseUserAgent(ua: string): ParsedUA {
    const result: ParsedUA = {
        browser: "Unknown",
        browserVersion: "",
        engine: "Unknown",
        os: "Unknown",
        osVersion: "",
        device: "Desktop",
        isBot: false,
        botName: "",
        isMobile: false,
        raw: ua,
    };

    // Bots
    const botPatterns: [RegExp, string][] = [
        [/Googlebot/i, "Googlebot"],
        [/bingbot/i, "Bingbot"],
        [/Slurp/i, "Yahoo Slurp"],
        [/DuckDuckBot/i, "DuckDuckBot"],
        [/Baiduspider/i, "Baiduspider"],
        [/YandexBot/i, "YandexBot"],
        [/Sogou/i, "Sogou Bot"],
        [/facebot|facebookexternalhit/i, "Facebook Bot"],
        [/ia_archiver/i, "Alexa Bot"],
        [/curl/i, "cURL"],
        [/wget/i, "Wget"],
        [/python-requests/i, "Python Requests"],
        [/axios/i, "Axios"],
        [/scrapy/i, "Scrapy"],
        [/bot|crawler|spider|crawling/i, "Generic Bot"],
    ];

    for (const [pattern, name] of botPatterns) {
        if (pattern.test(ua)) {
            result.isBot = true;
            result.botName = name;
            break;
        }
    }

    // OS Detection
    if (/Windows NT 10/.test(ua)) { result.os = "Windows"; result.osVersion = "10/11"; }
    else if (/Windows NT 6\.3/.test(ua)) { result.os = "Windows"; result.osVersion = "8.1"; }
    else if (/Windows NT 6\.2/.test(ua)) { result.os = "Windows"; result.osVersion = "8"; }
    else if (/Windows NT 6\.1/.test(ua)) { result.os = "Windows"; result.osVersion = "7"; }
    else if (/Mac OS X ([\d_]+)/.test(ua)) {
        result.os = "macOS";
        const m = ua.match(/Mac OS X ([\d_]+)/);
        result.osVersion = m ? m[1].replace(/_/g, ".") : "";
    }
    else if (/Android ([\d.]+)/.test(ua)) {
        result.os = "Android";
        const m = ua.match(/Android ([\d.]+)/);
        result.osVersion = m ? m[1] : "";
        result.isMobile = true;
        result.device = "Mobile";
    }
    else if (/iPhone|iPad|iPod/.test(ua)) {
        result.os = "iOS";
        const m = ua.match(/OS ([\d_]+)/);
        result.osVersion = m ? m[1].replace(/_/g, ".") : "";
        result.isMobile = true;
        result.device = /iPad/.test(ua) ? "Tablet" : "Mobile";
    }
    else if (/Linux/.test(ua)) { result.os = "Linux"; }
    else if (/CrOS/.test(ua)) { result.os = "Chrome OS"; }

    // Browser Detection
    if (/Edg\/([\d.]+)/.test(ua)) {
        result.browser = "Microsoft Edge";
        result.browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || "";
        result.engine = "Blink";
    } else if (/OPR\/([\d.]+)/.test(ua)) {
        result.browser = "Opera";
        result.browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] || "";
        result.engine = "Blink";
    } else if (/Chrome\/([\d.]+)/.test(ua) && !/Chromium/.test(ua)) {
        result.browser = "Google Chrome";
        result.browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || "";
        result.engine = "Blink";
    } else if (/Firefox\/([\d.]+)/.test(ua)) {
        result.browser = "Mozilla Firefox";
        result.browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || "";
        result.engine = "Gecko";
    } else if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua)) {
        result.browser = "Apple Safari";
        result.browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || "";
        result.engine = "WebKit";
    }

    return result;
}

const SAMPLE_UAS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "python-requests/2.31.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "curl/8.4.0",
];

export default function UserAgentPage() {
    const [input, setInput] = useState("");
    const parsed = input.trim() ? parseUserAgent(input.trim()) : null;

    return (
        <ToolLayout
            title="User-Agent Parser"
            description="Parse browser user-agent strings to identify OS, browser, device type, and bot signatures"
            icon={<Monitor className="h-6 w-6" />}
        >
            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    User-Agent String
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste a user-agent string..."
                    className="w-full h-20 bg-black/30 rounded border border-terminal-border p-3 text-xs font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40 resize-y"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono-soc">Samples:</span>
                    {SAMPLE_UAS.map((ua, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(ua)}
                            className="text-[10px] px-2 py-0.5 rounded bg-terminal-hover border border-terminal-border text-muted-foreground hover:text-matrix transition-colors font-mono-soc"
                        >
                            {ua.length > 30 ? ua.substring(0, 30) + "..." : ua}
                        </button>
                    ))}
                </div>
            </div>

            {parsed && (
                <div className="space-y-3">
                    {/* Bot Alert */}
                    {parsed.isBot && (
                        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 flex items-center gap-2">
                            <span className="text-red-400 text-sm">🤖</span>
                            <span className="text-sm text-red-400 font-mono-soc font-bold">
                                Bot Detected: {parsed.botName}
                            </span>
                        </div>
                    )}

                    <ResultCard title="Parsed Information">
                        <div className="space-y-1.5 text-xs">
                            {[
                                { label: "Browser", value: `${parsed.browser} ${parsed.browserVersion}`.trim() },
                                { label: "Engine", value: parsed.engine },
                                { label: "OS", value: `${parsed.os} ${parsed.osVersion}`.trim() },
                                { label: "Device", value: parsed.device },
                                { label: "Mobile", value: parsed.isMobile ? "Yes" : "No" },
                                { label: "Bot", value: parsed.isBot ? `Yes — ${parsed.botName}` : "No" },
                            ].map((row) => (
                                <div key={row.label} className="flex gap-3 py-1.5 px-2 rounded hover:bg-terminal-hover">
                                    <span className="text-muted-foreground w-20 shrink-0">{row.label}</span>
                                    <span className={`text-foreground ${row.label === "Bot" && parsed.isBot ? "text-red-400" : ""}`}>
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ResultCard>
                </div>
            )}
        </ToolLayout>
    );
}
