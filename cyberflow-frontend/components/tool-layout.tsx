"use client";

import { ReactNode } from "react";

interface ToolLayoutProps {
    title: string;
    description: string;
    icon: ReactNode;
    children: ReactNode;
}

export default function ToolLayout({
    title,
    description,
    icon,
    children,
}: ToolLayoutProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-terminal-card border border-terminal-border text-matrix">
                    {icon}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-matrix glow-matrix font-mono-soc">
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">{children}</div>
        </div>
    );
}
