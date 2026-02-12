"use client";

import { useState } from "react";
import { KeyRound, Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import ToolLayout from "@/components/tool-layout";
import ResultCard from "@/components/result-card";

async function checkPassword(password: string): Promise<{ breached: boolean; count: number }> {
    // Uses Have I Been Pwned's k-anonymity API — only sends first 5 chars of SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha1 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const text = await res.text();

    const lines = text.split("\n");
    for (const line of lines) {
        const [hashSuffix, count] = line.split(":");
        if (hashSuffix.trim() === suffix) {
            return { breached: true, count: parseInt(count.trim()) };
        }
    }
    return { breached: false, count: 0 };
}

function analyzeStrength(password: string): {
    score: number;
    label: string;
    color: string;
    checks: { name: string; passed: boolean }[];
} {
    const checks = [
        { name: "At least 8 characters", passed: password.length >= 8 },
        { name: "At least 12 characters", passed: password.length >= 12 },
        { name: "Contains uppercase", passed: /[A-Z]/.test(password) },
        { name: "Contains lowercase", passed: /[a-z]/.test(password) },
        { name: "Contains numbers", passed: /\d/.test(password) },
        { name: "Contains special chars", passed: /[^A-Za-z0-9]/.test(password) },
        { name: "No common patterns", passed: !/^(password|123456|qwerty|admin|letmein)/i.test(password) },
        { name: "Not all same character", passed: new Set(password).size > 1 },
    ];

    const score = checks.filter((c) => c.passed).length;

    let label = "Very Weak";
    let color = "text-red-400";
    if (score >= 7) { label = "Strong"; color = "text-green-400"; }
    else if (score >= 5) { label = "Moderate"; color = "text-amber-400"; }
    else if (score >= 3) { label = "Weak"; color = "text-orange-400"; }

    return { score, label, color, checks };
}

export default function PasswordCheckPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [breachResult, setBreachResult] = useState<{ breached: boolean; count: number } | null>(null);
    const [error, setError] = useState("");

    const check = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setError("");
        setBreachResult(null);

        try {
            const result = await checkPassword(input);
            setBreachResult(result);
        } catch (err) {
            setError("Failed to check breach database. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const strength = input.trim() ? analyzeStrength(input) : null;

    return (
        <ToolLayout
            title="Password Breach Checker"
            description="Check if passwords have been exposed in data breaches using k-anonymity (only first 5 chars of hash sent)"
            icon={<KeyRound className="h-6 w-6" />}
        >
            {/* Privacy Notice */}
            <div className="rounded-lg bg-matrix/5 border border-matrix/20 p-3">
                <p className="text-xs text-matrix font-mono-soc">
                    🔒 Your password never leaves your browser. We use Have I Been Pwned&apos;s k-anonymity
                    protocol — only the first 5 characters of the SHA-1 hash are sent to the API.
                </p>
            </div>

            {/* Input */}
            <div className="rounded-lg bg-terminal-card border border-terminal-border p-4">
                <label className="text-xs font-bold text-cyan-accent font-mono-soc tracking-wider uppercase mb-2 block">
                    Password to Check
                </label>
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setBreachResult(null); }}
                        onKeyDown={(e) => e.key === "Enter" && check()}
                        placeholder="Enter password to check..."
                        className="flex-1 bg-black/30 rounded border border-terminal-border p-3 text-sm font-mono-soc text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-matrix/40"
                    />
                    <button
                        onClick={check}
                        disabled={!input.trim() || loading}
                        className="px-6 rounded bg-matrix/10 border border-matrix/30 text-matrix font-mono-soc text-sm font-bold hover:bg-matrix/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "> CHECK"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-center py-4 text-red-400 font-mono-soc text-sm">{error}</div>
            )}

            {/* Breach Result */}
            {breachResult && (
                <div
                    className={`rounded-lg p-4 border ${breachResult.breached
                            ? "bg-red-500/5 border-red-500/20"
                            : "bg-green-500/5 border-green-500/20"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {breachResult.breached ? (
                            <>
                                <XCircle className="h-6 w-6 text-red-400" />
                                <div>
                                    <p className="text-sm font-bold text-red-400 font-mono-soc">
                                        ⚠️ BREACHED — Found {breachResult.count.toLocaleString()} times
                                    </p>
                                    <p className="text-xs text-red-400/70 mt-1">
                                        This password has appeared in known data breaches. Do not use it.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-6 w-6 text-green-400" />
                                <div>
                                    <p className="text-sm font-bold text-green-400 font-mono-soc">
                                        ✓ NOT FOUND in breach databases
                                    </p>
                                    <p className="text-xs text-green-400/70 mt-1">
                                        This password has not appeared in any known data breaches.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Strength Analysis */}
            {strength && (
                <ResultCard title="Password Strength Analysis">
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-bold font-mono-soc ${strength.color}`}>
                                {strength.label}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono-soc">
                                {strength.score}/8
                            </span>
                        </div>
                        {/* Strength bar */}
                        <div className="h-1.5 bg-terminal-hover rounded overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 rounded ${strength.score >= 7 ? "bg-green-400" :
                                        strength.score >= 5 ? "bg-amber-400" :
                                            strength.score >= 3 ? "bg-orange-400" : "bg-red-400"
                                    }`}
                                style={{ width: `${(strength.score / 8) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        {strength.checks.map((check) => (
                            <div key={check.name} className="flex items-center gap-2 text-xs py-0.5">
                                {check.passed ? (
                                    <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />
                                ) : (
                                    <XCircle className="h-3 w-3 text-red-400/50 shrink-0" />
                                )}
                                <span className={check.passed ? "text-foreground" : "text-muted-foreground"}>
                                    {check.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </ResultCard>
            )}
        </ToolLayout>
    );
}
