"use client";

import { useState } from "react";
import { ShieldOff, ArrowLeftRight } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

type Mode = "defang" | "refang";

function defang(text: string): string {
    return text
        .replace(/https?:\/\//gi, (m) => m.replace("http", "hxxp"))
        .replace(/\./g, "[.]")
        .replace(/@/g, "[@]");
}

function refang(text: string): string {
    return text
        .replace(/hxxps?:\/\//gi, (m) => m.replace("hxxp", "http"))
        .replace(/\[\.\]/g, ".")
        .replace(/\[@\]/g, "@")
        .replace(/\[:\]/g, ":");
}

export default function DefangPage() {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<Mode>("defang");

    const output = input.trim()
        ? mode === "defang"
            ? defang(input)
            : refang(input)
        : "";

    return (
        <ToolLayout
            title="Defang / Refang"
            description="Safely share URLs, IPs, and email addresses by converting them to non-clickable formats"
            icon={<ShieldOff className="h-6 w-6" />}
        >
            {/* Mode Selector */}
            <div className="flex rounded-lg bg-terminal-card border border-terminal-border overflow-hidden">
                <button
                    onClick={() => setMode("defang")}
                    className={`flex-1 py-2.5 text-sm font-mono-soc font-bold transition-colors ${mode === "defang"
                            ? "bg-matrix/10 text-matrix border-r border-matrix/30"
                            : "text-muted-foreground hover:text-foreground border-r border-terminal-border"
                        }`}
                >
                    {">"} DEFANG
                </button>
                <button
                    onClick={() => setMode("refang")}
                    className={`flex-1 py-2.5 text-sm font-mono-soc font-bold transition-colors ${mode === "refang"
                            ? "bg-cyan-accent/10 text-cyan-accent"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    {">"} REFANG
                </button>
            </div>

            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    {mode === "defang" ? "Original Input" : "Defanged Input"}
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        mode === "defang"
                            ? "https://example.com  192.168.1.1  user@example.com"
                            : "hxxps://example[.]com  192[.]168[.]1[.]1  user[@]example[.]com"
                    }
                    className="w-full h-32 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40 resize-y"
                />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => {
                        setMode(mode === "defang" ? "refang" : "defang");
                        setInput(output);
                    }}
                    className="p-2 rounded-full bg-terminal-card border border-terminal-border text-muted-foreground hover:text-matrix hover:border-matrix/30 transition-colors"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                </button>
            </div>

            {/* Output */}
            {output && (
                <ResultCard
                    title={mode === "defang" ? "Defanged Output" : "Refanged Output"}
                    copyContent={output}
                >
                    <pre className="whitespace-pre-wrap break-all text-foreground">
                        {output}
                    </pre>
                </ResultCard>
            )}

            {/* Quick Reference */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <h3 className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-3">
                    Conversion Reference
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono-soc">
                    <div className="text-muted-foreground">https://</div>
                    <div className="text-matrix">hxxps://</div>
                    <div className="text-muted-foreground">example.com</div>
                    <div className="text-matrix">example[.]com</div>
                    <div className="text-muted-foreground">user@domain.com</div>
                    <div className="text-matrix">user[@]domain[.]com</div>
                </div>
            </div>
        </ToolLayout>
    );
}
