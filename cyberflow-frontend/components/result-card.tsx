"use client";

import { ReactNode, useState } from "react";
import { Copy, Check } from "lucide-react";

interface ResultCardProps {
    title: string;
    children: ReactNode;
    copyContent?: string;
    className?: string;
}

export default function ResultCard({
    title,
    children,
    copyContent,
    className = "",
}: ResultCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!copyContent) return;
        await navigator.clipboard.writeText(copyContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={`rounded-lg bg-terminal-card border border-terminal-border p-4 ${className}`}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-cyan-accent font-mono-soc uppercase tracking-wider">
                    {title}
                </h3>
                {copyContent && (
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-matrix transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            <div className="font-mono-soc text-sm">{children}</div>
        </div>
    );
}
