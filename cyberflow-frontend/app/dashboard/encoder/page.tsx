"use client";

import { useState } from "react";
import { Binary, ArrowLeftRight } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

type EncodingType = "base64" | "url" | "hex" | "html";
type Direction = "encode" | "decode";

function encodeValue(value: string, type: EncodingType): string {
    try {
        switch (type) {
            case "base64":
                return btoa(unescape(encodeURIComponent(value)));
            case "url":
                return encodeURIComponent(value);
            case "hex":
                return Array.from(new TextEncoder().encode(value))
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
            case "html":
                return value.replace(/[&<>"']/g, (c) => {
                    const entities: Record<string, string> = {
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#39;",
                    };
                    return entities[c] || c;
                });
            default:
                return value;
        }
    } catch {
        return "[ERROR] Failed to encode";
    }
}

function decodeValue(value: string, type: EncodingType): string {
    try {
        switch (type) {
            case "base64":
                return decodeURIComponent(escape(atob(value.trim())));
            case "url":
                return decodeURIComponent(value);
            case "hex":
                const hexBytes = value
                    .replace(/\s+/g, "")
                    .match(/.{1,2}/g);
                if (!hexBytes) return value;
                return new TextDecoder().decode(
                    new Uint8Array(hexBytes.map((b) => parseInt(b, 16)))
                );
            case "html":
                const doc = new DOMParser().parseFromString(value, "text/html");
                return doc.documentElement.textContent || "";
            default:
                return value;
        }
    } catch {
        return "[ERROR] Failed to decode — invalid input";
    }
}

const encodingTypes: { value: EncodingType; label: string }[] = [
    { value: "base64", label: "Base64" },
    { value: "url", label: "URL" },
    { value: "hex", label: "Hex" },
    { value: "html", label: "HTML Entities" },
];

export default function EncoderPage() {
    const [input, setInput] = useState("");
    const [encoding, setEncoding] = useState<EncodingType>("base64");
    const [direction, setDirection] = useState<Direction>("encode");

    const output = input.trim()
        ? direction === "encode"
            ? encodeValue(input, encoding)
            : decodeValue(input, encoding)
        : "";

    return (
        <ToolLayout
            title="Encoder / Decoder"
            description="Encode and decode data in Base64, URL encoding, Hex, and HTML entities"
            icon={<Binary className="h-6 w-6" />}
        >
            {/* Encoding Type Tabs */}
            <div className="flex rounded-lg bg-terminal-card border border-terminal-border overflow-hidden">
                {encodingTypes.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => setEncoding(type.value)}
                        className={`flex-1 py-2.5 text-xs font-mono-soc font-bold transition-colors border-r border-terminal-border last:border-r-0 ${encoding === type.value
                                ? "bg-matrix/10 text-matrix"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Direction Toggle */}
            <div className="flex rounded-lg bg-terminal-card border border-terminal-border overflow-hidden">
                <button
                    onClick={() => setDirection("encode")}
                    className={`flex-1 py-2 text-sm font-mono-soc font-bold transition-colors border-r border-terminal-border ${direction === "encode"
                            ? "bg-matrix/10 text-matrix"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    {">"} ENCODE
                </button>
                <button
                    onClick={() => setDirection("decode")}
                    className={`flex-1 py-2 text-sm font-mono-soc font-bold transition-colors ${direction === "decode"
                            ? "bg-cyan-accent/10 text-cyan-accent"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    {">"} DECODE
                </button>
            </div>

            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    Input
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        direction === "encode"
                            ? "Enter text to encode..."
                            : "Enter encoded text to decode..."
                    }
                    className="w-full h-32 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40 resize-y"
                />
            </div>

            {/* Swap */}
            <div className="flex justify-center">
                <button
                    onClick={() => {
                        setDirection(direction === "encode" ? "decode" : "encode");
                        if (output && !output.startsWith("[ERROR]")) {
                            setInput(output);
                        }
                    }}
                    className="p-2 rounded-full bg-terminal-card border border-terminal-border text-muted-foreground hover:text-matrix hover:border-matrix/30 transition-colors"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                </button>
            </div>

            {/* Output */}
            {output && (
                <ResultCard
                    title={`${encoding.toUpperCase()} ${direction === "encode" ? "Encoded" : "Decoded"} Output`}
                    copyContent={output}
                >
                    <pre className="whitespace-pre-wrap break-all text-foreground">
                        {output}
                    </pre>
                </ResultCard>
            )}
        </ToolLayout>
    );
}
