"use client";

import { useState } from "react";
import {
    ShieldCheck, Globe, Loader2, Download,
    AlertTriangle, CheckCircle, XCircle, Info,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// ═══════════════════════ TYPES ═══════════════════════

interface Recommendation {
    text: string;
    priority: "Critical" | "High" | "Medium" | "Low";
}

interface ScanResult {
    domain: string;
    scannedAt: string;
    riskScore: number;
    riskLevel: "Critical" | "High" | "Medium" | "Low";
    ssl: { valid: boolean; issuer: string; expiry: string; protocol: string; daysLeft: number } | null;
    dnsRecords: { type: string; value: string }[];
    vtReputation: {
        malicious: number;
        suspicious: number;
        harmless: number;
        undetected: number;
    } | null;
    securityHeaders: { name: string; present: boolean }[];
    recommendations: Recommendation[];
}

// ═══════════════════════ DOMAIN EXTRACTION ═══════════════════════

function extractDomain(input: string): string {
    try {
        const u = input.startsWith("http") ? input : `https://${input}`;
        return new URL(u).hostname;
    } catch {
        return input.replace(/^(https?:\/\/)?/, "").split("/")[0];
    }
}

// ═══════════════════════ SCANNER ═══════════════════════

async function runSecurityScan(domain: string): Promise<ScanResult> {
    const result: ScanResult = {
        domain,
        scannedAt: new Date().toISOString(),
        riskScore: 0,
        riskLevel: "Low",
        ssl: null,
        dnsRecords: [],
        vtReputation: null,
        securityHeaders: [],
        recommendations: [],
    };

    let riskPoints = 0;

    // 1) VirusTotal domain lookup
    try {
        const res = await fetch(`${API_BASE}/lookup/vt/domain/${domain}`);
        if (res.ok) {
            const vt = await res.json();
            const attrs = vt.data?.attributes;
            if (attrs?.last_analysis_stats) {
                const s = attrs.last_analysis_stats;
                result.vtReputation = {
                    malicious: s.malicious || 0,
                    suspicious: s.suspicious || 0,
                    harmless: s.harmless || 0,
                    undetected: s.undetected || 0,
                };
                riskPoints += s.malicious * 10;
                riskPoints += s.suspicious * 3;
            }
            if (attrs?.last_dns_records) {
                result.dnsRecords = attrs.last_dns_records
                    .slice(0, 15)
                    .map((r: any) => ({
                        type: r.type || "A",
                        value: r.value || "",
                    }));
            }
            if (attrs?.last_https_certificate) {
                const cert = attrs.last_https_certificate;
                const notAfter = cert.validity?.not_after || "";
                let daysLeft = -1;
                if (notAfter) {
                    // VT format: "2025-03-15 12:00:00" or ISO
                    const exp = new Date(notAfter.replace(" ", "T"));
                    daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
                }
                const isSha1 = cert.cert_signature?.signature_algorithm?.toLowerCase().includes("sha1");
                result.ssl = {
                    valid: !isSha1 && daysLeft > 0,
                    issuer: cert.issuer?.O || cert.issuer?.CN || "Unknown CA",
                    expiry: notAfter || "Unknown",
                    protocol: cert.extensions?.authority_key_identifier ? "TLS 1.2/1.3" : "TLS (version unavailable)",
                    daysLeft,
                };
            }
        }
    } catch {
        /* continue */
    }

    // 2) Check actual security headers via fetch
    const headerChecks = [
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
    ];
    try {
        const hres = await fetch(`https://${domain}`, { method: "HEAD", mode: "no-cors" });
        headerChecks.forEach((h) => {
            result.securityHeaders.push({ name: h, present: !!hres.headers.get(h) });
        });
    } catch {
        // CORS will block this from browser — note headers as "Could not verify"
        headerChecks.forEach((h) => {
            result.securityHeaders.push({ name: h, present: false });
        });
    }

    // 3) Build intelligent recommendations
    if (result.vtReputation && result.vtReputation.malicious > 0) {
        result.recommendations.push({
            priority: "Critical",
            text: `${result.vtReputation.malicious} security vendor(s) flagged this domain as malicious. Immediate investigation and incident response is required.`,
        });
        riskPoints += 30;
    }
    if (result.vtReputation && result.vtReputation.suspicious > 0) {
        result.recommendations.push({
            priority: "High",
            text: `${result.vtReputation.suspicious} security vendor(s) marked this domain as suspicious. Implement enhanced monitoring and review recent DNS/hosting changes.`,
        });
    }
    if (!result.ssl) {
        result.recommendations.push({
            priority: "High",
            text: "SSL/TLS certificate could not be verified. Ensure HTTPS is properly configured with a trusted Certificate Authority.",
        });
        riskPoints += 15;
    } else {
        if (!result.ssl.valid) {
            result.recommendations.push({
                priority: "Critical",
                text: result.ssl.daysLeft <= 0
                    ? "SSL certificate has EXPIRED. Renew immediately to prevent browser warnings and service interruption."
                    : "SSL certificate uses a weak signature algorithm (SHA-1). Reissue with SHA-256 to maintain browser trust.",
            });
            riskPoints += 20;
        } else if (result.ssl.daysLeft > 0 && result.ssl.daysLeft <= 30) {
            result.recommendations.push({
                priority: "High",
                text: `SSL certificate expires in ${result.ssl.daysLeft} days. Initiate renewal process to avoid service disruption.`,
            });
            riskPoints += 5;
        }
    }
    if (result.dnsRecords.length === 0) {
        result.recommendations.push({
            priority: "High",
            text: "No DNS records were returned. Verify domain configuration, nameserver delegation, and DNSSEC settings.",
        });
        riskPoints += 10;
    }
    // Security header recommendations (always best practice)
    const missingHeaders = result.securityHeaders.filter((h) => !h.present);
    if (missingHeaders.length > 0) {
        result.recommendations.push({
            priority: "Medium",
            text: `Missing security headers detected: ${missingHeaders.map((h) => h.name).join(", ")}. Deploy these headers to harden the application against common web attacks.`,
        });
        riskPoints += missingHeaders.length * 2;
    }
    result.recommendations.push({
        priority: "Low",
        text: "Schedule periodic security assessments (quarterly recommended) to maintain ongoing security posture.",
    });

    result.riskScore = Math.min(100, riskPoints);
    if (riskPoints >= 50) result.riskLevel = "Critical";
    else if (riskPoints >= 30) result.riskLevel = "High";
    else if (riskPoints >= 15) result.riskLevel = "Medium";
    else result.riskLevel = "Low";

    return result;
}

// ═══════════════════════ IMAGE LOADER ═══════════════════════

function loadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext("2d")!.drawImage(img, 0, 0);
            resolve(c.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = src;
    });
}

// ═══════════════════════ PDF GENERATION ═══════════════════════

async function generatePDF(r: ScanResult) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();   // 210
    const H = doc.internal.pageSize.getHeight();   // 297
    const M = 14; // margin
    const reportId = `USR-${Date.now().toString(36).toUpperCase()}`;
    const dateStr = new Date(r.scannedAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric",
    });

    // Load logo
    let logo: string | null = null;
    try { logo = await loadImage("/unispark-logo.png"); } catch { }

    // ─── Helpers ───
    function footer(pg: number, total: number) {
        doc.setDrawColor(26, 115, 196);
        doc.setLineWidth(0.4);
        doc.line(M, H - 14, W - M, H - 14);
        doc.setFontSize(6.5);
        doc.setTextColor(130, 130, 130);
        doc.setFont("helvetica", "normal");
        doc.text("CONFIDENTIAL", M, H - 9);
        doc.text(
            `UniSpark Innovation  |  unisparksuraksha.ai  |  ${reportId}`,
            W / 2, H - 9, { align: "center" }
        );
        doc.text(`Page ${pg} of ${total}`, W - M, H - 9, { align: "right" });
    }

    function section(title: string, y: number): number {
        doc.setFillColor(26, 115, 196);
        doc.rect(M, y, W - M * 2, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(title, M + 4, y + 5.5);
        return y + 12;
    }

    function pageBreak(y: number, need: number): number {
        if (y + need > H - 20) { doc.addPage(); return 20; }
        return y;
    }

    // ══════════════════════════════════════════════════════
    //  PAGE 1 — COVER
    // ══════════════════════════════════════════════════════

    // White header with logo
    if (logo) {
        try { doc.addImage(logo, "PNG", M, 10, 70, 24); } catch { }
    } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(26, 115, 196);
        doc.text("UniSpark Innovation", M, 24);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("THE SOLUTION COMPANY", M, 30);
    }

    // Blue horizontal rule
    doc.setFillColor(26, 115, 196);
    doc.rect(M, 38, W - M * 2, 1.5, "F");

    // Report title
    let y = 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(30, 41, 59);
    doc.text("Security Assessment", M, y);
    y += 10;
    doc.text("Report", M, y);

    // Domain pill
    y += 14;
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(M, y, W - M * 2, 10, 2, 2, "F");
    doc.setDrawColor(26, 115, 196);
    doc.roundedRect(M, y, W - M * 2, 10, 2, 2, "S");
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.setTextColor(26, 115, 196);
    doc.text(r.domain, W / 2, y + 7, { align: "center" });

    // Report metadata
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const meta = [
        ["Report ID", reportId],
        ["Assessment Date", dateStr],
        ["Classification", "CONFIDENTIAL"],
        ["Engine", "UniSpark Suraksha AI Security Engine v1.0"],
    ];
    meta.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`${k}:`, M, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(v, M + 40, y);
        y += 6;
    });

    // Risk box
    y += 8;
    const riskClr: [number, number, number] =
        r.riskLevel === "Critical" ? [220, 38, 38]
            : r.riskLevel === "High" ? [234, 88, 12]
                : r.riskLevel === "Medium" ? [202, 138, 4]
                    : [22, 163, 74];

    doc.setFillColor(...riskClr);
    doc.roundedRect(M, y, W - M * 2, 30, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("OVERALL RISK LEVEL", M + 8, y + 12);
    doc.setFontSize(22);
    doc.text(r.riskLevel.toUpperCase(), M + 8, y + 25);
    // Score circle
    doc.setFillColor(255, 255, 255);
    doc.circle(W - M - 20, y + 15, 12, "F");
    doc.setTextColor(...riskClr);
    doc.setFontSize(16);
    doc.text(String(r.riskScore), W - M - 20, y + 14, { align: "center" });
    doc.setFontSize(7);
    doc.text("out of 100", W - M - 20, y + 20, { align: "center" });

    // Disclaimer
    y += 40;
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(140, 140, 140);
    const disc = "This report is generated by UniSpark Suraksha AI Engine using automated threat intelligence analysis. " +
        "It is confidential and intended solely for the authorized recipient. " +
        "Do not redistribute without written consent from UniSpark Innovation.";
    doc.text(doc.splitTextToSize(disc, W - M * 2), M, y);

    // ══════════════════════════════════════════════════════
    //  PAGE 2 — FINDINGS
    // ══════════════════════════════════════════════════════
    doc.addPage();
    y = 20;

    // Executive Summary
    y = section("1. Executive Summary", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const totalVendors = r.vtReputation
        ? r.vtReputation.malicious + r.vtReputation.suspicious + r.vtReputation.harmless + r.vtReputation.undetected
        : 0;
    let secNum = 1;
    const summary =
        `UniSpark Suraksha conducted an automated security assessment of "${r.domain}" on ${dateStr}. ` +
        `The assessment covered threat reputation analysis across ${totalVendors || "multiple"} security vendors, DNS configuration review, SSL/TLS certificate inspection, and security header analysis.\n\n` +
        `Overall Risk Rating: ${r.riskLevel.toUpperCase()} (${r.riskScore}/100 risk points).\n\n` +
        (r.vtReputation && r.vtReputation.malicious > 0
            ? `WARNING: ${r.vtReputation.malicious} vendor(s) flagged this domain as MALICIOUS. This is a serious finding that requires immediate attention.\n\n`
            : r.vtReputation && r.vtReputation.malicious === 0
                ? `Positive: No security vendors flagged this domain as malicious.\n\n`
                : "Note: Threat intelligence data was unavailable for this domain.\n\n") +
        (r.ssl
            ? `SSL Certificate: Issued by ${r.ssl.issuer}${r.ssl.daysLeft > 0 ? `, expires in ${r.ssl.daysLeft} days` : " (EXPIRED)"}. Status: ${r.ssl.valid ? "Valid" : "Invalid"}.`
            : "SSL Certificate: Not detected. The domain may not support HTTPS.");
    const sLines = doc.splitTextToSize(summary, W - M * 2 - 4);
    doc.text(sLines, M + 2, y);
    y += sLines.length * 4.2 + 8;

    // ── Threat Intelligence ──
    if (r.vtReputation) {
        y = pageBreak(y, 55);
        secNum++;
        y = section(`${secNum}. Threat Intelligence (VirusTotal)`, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 50);
        doc.text(
            `${totalVendors} security vendors queried. Results as of ${dateStr}:`,
            M + 2, y
        );
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [["Category", "Count", "What This Means"]],
            body: [
                [
                    "Malicious",
                    String(r.vtReputation.malicious),
                    r.vtReputation.malicious > 0
                        ? `THREAT DETECTED - ${r.vtReputation.malicious} vendor(s) consider this domain dangerous`
                        : "No vendors flagged this domain",
                ],
                [
                    "Suspicious",
                    String(r.vtReputation.suspicious),
                    r.vtReputation.suspicious > 0
                        ? `NEEDS REVIEW - ${r.vtReputation.suspicious} vendor(s) have concerns`
                        : "No suspicions raised",
                ],
                ["Harmless", String(r.vtReputation.harmless), `${r.vtReputation.harmless} vendor(s) confirmed safe`],
                ["Undetected", String(r.vtReputation.undetected), `${r.vtReputation.undetected} vendor(s) have not yet analyzed`],
            ],
            theme: "grid",
            headStyles: {
                fillColor: [26, 115, 196],
                fontSize: 8,
                fontStyle: "bold",
                halign: "left",
            },
            bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
            columnStyles: { 1: { halign: "center", cellWidth: 18 }, 2: { cellWidth: 70 } },
            alternateRowStyles: { fillColor: [245, 248, 255] },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 2) {
                    const v = String(data.cell.raw);
                    if (v.startsWith("THREAT")) data.cell.styles.textColor = [220, 38, 38];
                    else if (v.startsWith("NEEDS")) data.cell.styles.textColor = [234, 88, 12];
                    else data.cell.styles.textColor = [50, 50, 50];
                }
                if (data.section === "body" && data.column.index === 0) {
                    const cat = String(data.cell.raw);
                    if (cat === "Malicious") data.cell.styles.textColor = [220, 38, 38];
                    else if (cat === "Suspicious") data.cell.styles.textColor = [234, 88, 12];
                    else if (cat === "Harmless") data.cell.styles.textColor = [22, 163, 74];
                }
            },
            margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── DNS Records ──
    if (r.dnsRecords.length > 0) {
        y = pageBreak(y, 40);
        secNum++;
        y = section(`${secNum}. DNS Configuration`, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 50);
        doc.text(`${r.dnsRecords.length} DNS record(s) found for ${r.domain}:`, M + 2, y);
        y += 6;

        autoTable(doc, {
            startY: y,
            head: [["Record Type", "Value"]],
            body: r.dnsRecords.map((d) => [d.type, d.value]),
            theme: "grid",
            headStyles: {
                fillColor: [26, 115, 196], fontSize: 8, fontStyle: "bold",
            },
            bodyStyles: { fontSize: 7.5, font: "courier", textColor: [50, 50, 50] },
            columnStyles: { 0: { cellWidth: 30 } },
            alternateRowStyles: { fillColor: [245, 248, 255] },
            margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── SSL Certificate ──
    if (r.ssl) {
        y = pageBreak(y, 50);
        secNum++;
        y = section(`${secNum}. SSL / TLS Certificate`, y);

        const expiryDisplay = r.ssl.daysLeft > 0
            ? `${r.ssl.expiry} (${r.ssl.daysLeft} days remaining)`
            : `${r.ssl.expiry} (EXPIRED)`;
        const expiryStatus = r.ssl.daysLeft <= 0 ? "FAIL" : r.ssl.daysLeft <= 30 ? "WARN" : "PASS";

        autoTable(doc, {
            startY: y,
            head: [["Property", "Value", "Status"]],
            body: [
                ["Certificate Valid", r.ssl.valid ? "Yes" : "No", r.ssl.valid ? "PASS" : "FAIL"],
                ["Certificate Authority", r.ssl.issuer, "-"],
                ["Expiry Date", expiryDisplay, expiryStatus],
                ["Protocol Support", r.ssl.protocol, "INFO"],
            ],
            theme: "grid",
            headStyles: {
                fillColor: [26, 115, 196], fontSize: 8, fontStyle: "bold",
            },
            bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
            columnStyles: { 2: { halign: "center", cellWidth: 20, fontStyle: "bold" } },
            alternateRowStyles: { fillColor: [245, 248, 255] },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 2) {
                    const v = String(data.cell.raw);
                    if (v === "PASS") data.cell.styles.textColor = [22, 163, 74];
                    else if (v === "FAIL") data.cell.styles.textColor = [220, 38, 38];
                    else if (v === "WARN") data.cell.styles.textColor = [202, 138, 4];
                    else data.cell.styles.textColor = [26, 115, 196];
                }
            },
            margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ── Security Headers ──
    if (r.securityHeaders.length > 0) {
        y = pageBreak(y, 50);
        secNum++;
        y = section(`${secNum}. Security Headers`, y);

        autoTable(doc, {
            startY: y,
            head: [["Header", "Status", "Impact If Missing"]],
            body: r.securityHeaders.map((h) => [
                h.name,
                h.present ? "Present" : "Missing",
                h.name === "Content-Security-Policy" ? "XSS attacks possible"
                    : h.name === "Strict-Transport-Security" ? "Downgrade attacks possible"
                        : h.name === "X-Frame-Options" ? "Clickjacking possible"
                            : h.name === "X-Content-Type-Options" ? "MIME confusion attacks"
                                : h.name === "X-XSS-Protection" ? "Reflected XSS risk"
                                    : "Information leakage",
            ]),
            theme: "grid",
            headStyles: { fillColor: [26, 115, 196], fontSize: 8, fontStyle: "bold" },
            bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
            columnStyles: { 1: { halign: "center", cellWidth: 20, fontStyle: "bold" } },
            alternateRowStyles: { fillColor: [245, 248, 255] },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 1) {
                    if (data.cell.raw === "Present") data.cell.styles.textColor = [22, 163, 74];
                    else data.cell.styles.textColor = [220, 38, 38];
                }
            },
            margin: { left: M, right: M },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ══════════════════════════════════════════════════════
    //  RECOMMENDATIONS
    // ══════════════════════════════════════════════════════
    y = pageBreak(y, 50);
    secNum++;
    y = section(`${secNum}. Recommendations`, y);
    y += 2;

    // Sort: Critical > High > Medium > Low
    const prioOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const sorted = [...r.recommendations].sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);

    autoTable(doc, {
        startY: y,
        head: [["#", "Priority", "Recommendation"]],
        body: sorted.map((rec, i) => [
            String(i + 1),
            rec.priority,
            rec.text,
        ]),
        theme: "grid",
        headStyles: {
            fillColor: [26, 115, 196], fontSize: 8, fontStyle: "bold",
        },
        bodyStyles: { fontSize: 7.5, textColor: [50, 50, 50] },
        columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 18, halign: "center", fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [245, 248, 255] },
        didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 1) {
                const p = String(data.cell.raw);
                if (p === "Critical") data.cell.styles.textColor = [220, 38, 38];
                else if (p === "High") data.cell.styles.textColor = [234, 88, 12];
                else if (p === "Medium") data.cell.styles.textColor = [202, 138, 4];
                else data.cell.styles.textColor = [22, 163, 74];
            }
        },
        margin: { left: M, right: M },
    });
    y = (doc as any).lastAutoTable.finalY + 15;

    // ── Sign-off ──
    y = pageBreak(y, 30);
    doc.setDrawColor(26, 115, 196);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(26, 115, 196);
    doc.text("---Looking forward to securing your digital presence---", W / 2, y, { align: "center" });
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text("For questions: info@unisparkinnovation.com", W / 2, y, { align: "center" });
    y += 4;
    doc.text("UniSpark Innovation - The Solution Company  |  unisparksuraksha.ai", W / 2, y, { align: "center" });

    // ── Footers on all pages ──
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        footer(p, total);
    }

    doc.save(`UniSpark_Security_Report_${r.domain.replace(/\./g, "_")}_${reportId}.pdf`);
}

// ═══════════════════════ UI COMPONENT ═══════════════════════

export default function SecurityReportPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    const handleScan = async () => {
        const domain = extractDomain(input.trim());
        if (!domain) return;
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const scan = await runSecurityScan(domain);
            setResult(scan);
            fetch(`${API_BASE}/public/stats/scan`, { method: "POST" }).catch(() => { });
            fetch(`${API_BASE}/public/stats/report`, { method: "POST" }).catch(() => { });
        } catch (e: any) {
            setError(e.message || "Scan failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePDF = async () => {
        if (!result) return;
        setPdfLoading(true);
        try { await generatePDF(result); } finally { setPdfLoading(false); }
    };

    const riskColor: Record<string, string> = {
        Critical: "text-red-400 bg-red-500/10 border-red-500/30",
        High: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    };

    const prioColor: Record<string, string> = {
        Critical: "bg-red-500/20 text-red-400 border-red-500/40",
        High: "bg-orange-500/20 text-orange-400 border-orange-500/40",
        Medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5 p-1">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <ShieldCheck className="h-7 w-7 text-[#1a73c4]" />
                    <h1 className="text-2xl font-bold text-white">Security Report Generator</h1>
                </div>
                <p className="text-slate-400 text-sm">
                    Enter any domain to generate a professional security assessment PDF report.
                </p>
            </div>

            {/* Input */}
            <div className="rounded-xl bg-terminal-card border border-terminal-border p-5">
                <label className="text-[10px] font-bold text-[#1a73c4] uppercase tracking-wider mb-2 block">
                    Target Domain
                </label>
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScan()}
                            placeholder="example.com"
                            className="w-full bg-black/30 rounded-lg border border-terminal-border pl-10 pr-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[#1a73c4]/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleScan}
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-[#1a73c4] text-white rounded-lg font-semibold text-sm hover:bg-[#155da5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
                        ) : (
                            <><ShieldCheck className="h-4 w-4" /> Generate Report</>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="rounded-xl bg-terminal-card border border-terminal-border p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1a73c4] mx-auto mb-3" />
                    <p className="text-white font-semibold text-sm">Running Security Assessment...</p>
                    <p className="text-slate-500 text-xs mt-1">
                        Querying VirusTotal, DNS records, SSL certificate...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-red-950/20 border border-red-500/30 p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Risk Banner + Download */}
                    <div className={`rounded-xl border p-5 ${riskColor[result.riskLevel]}`}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                {result.riskLevel === "Low" ? (
                                    <CheckCircle className="h-7 w-7" />
                                ) : result.riskLevel === "Critical" ? (
                                    <XCircle className="h-7 w-7" />
                                ) : (
                                    <AlertTriangle className="h-7 w-7" />
                                )}
                                <div>
                                    <p className="font-bold text-lg leading-tight">
                                        Risk Level: {result.riskLevel.toUpperCase()}
                                    </p>
                                    <p className="text-xs opacity-70 mt-0.5">
                                        Score: {result.riskScore} / 100 risk points
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handlePDF}
                                disabled={pdfLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#1a73c4] rounded-lg text-white text-sm font-semibold hover:bg-[#155da5] transition-colors disabled:opacity-50 shadow-lg shadow-[#1a73c4]/20"
                            >
                                {pdfLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Download PDF Report
                            </button>
                        </div>
                    </div>

                    {/* VirusTotal */}
                    {result.vtReputation && (
                        <div className="rounded-xl bg-terminal-card border border-terminal-border p-5">
                            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#1a73c4]" />
                                Threat Intelligence (VirusTotal)
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { l: "Malicious", v: result.vtReputation.malicious, c: "text-red-400", b: "border-red-500/30" },
                                    { l: "Suspicious", v: result.vtReputation.suspicious, c: "text-amber-400", b: "border-amber-500/30" },
                                    { l: "Harmless", v: result.vtReputation.harmless, c: "text-emerald-400", b: "border-emerald-500/30" },
                                    { l: "Undetected", v: result.vtReputation.undetected, c: "text-slate-400", b: "border-slate-600/30" },
                                ].map((x) => (
                                    <div key={x.l} className={`bg-slate-800/50 rounded-lg p-3 text-center border ${x.b}`}>
                                        <p className={`text-xl font-bold ${x.c}`}>{x.v}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">{x.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SSL Certificate */}
                    {result.ssl && (
                        <div className="rounded-xl bg-terminal-card border border-terminal-border p-5">
                            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#1a73c4]" />
                                SSL / TLS Certificate
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                    <p className="text-slate-500 text-[10px] uppercase mb-1">Status</p>
                                    <p className={`font-semibold ${result.ssl.valid ? "text-emerald-400" : "text-red-400"}`}>
                                        {result.ssl.valid ? "Valid" : "Invalid"}
                                    </p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                    <p className="text-slate-500 text-[10px] uppercase mb-1">Issuer</p>
                                    <p className="text-white font-mono text-xs">{result.ssl.issuer}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                    <p className="text-slate-500 text-[10px] uppercase mb-1">Expiry</p>
                                    <p className={`font-semibold ${result.ssl.daysLeft <= 0 ? "text-red-400" : result.ssl.daysLeft <= 30 ? "text-amber-400" : "text-slate-300"}`}>
                                        {result.ssl.daysLeft > 0 ? `${result.ssl.daysLeft} days remaining` : "EXPIRED"}
                                    </p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                    <p className="text-slate-500 text-[10px] uppercase mb-1">Protocol</p>
                                    <p className="text-slate-300">{result.ssl.protocol}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DNS Records */}
                    {result.dnsRecords.length > 0 && (
                        <div className="rounded-xl bg-terminal-card border border-terminal-border p-5">
                            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-[#1a73c4]" />
                                DNS Records ({result.dnsRecords.length})
                            </h3>
                            <div className="space-y-0.5 text-xs font-mono">
                                {result.dnsRecords.map((d, i) => (
                                    <div key={i} className="flex gap-3 py-1.5 px-2 rounded hover:bg-slate-800/40">
                                        <span className="text-[#1a73c4] font-bold w-14 shrink-0">{d.type}</span>
                                        <span className="text-slate-300 break-all">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Security Headers */}
                    {result.securityHeaders.length > 0 && (
                        <div className="rounded-xl bg-terminal-card border border-terminal-border p-5">
                            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#1a73c4]" />
                                Security Headers
                            </h3>
                            <div className="space-y-1">
                                {result.securityHeaders.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/40">
                                        <span className="text-slate-300 font-mono text-xs">{h.name}</span>
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${h.present
                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                            : "bg-red-500/15 text-red-400 border-red-500/30"
                                            }`}>
                                            {h.present ? "Present" : "Missing"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    <div className="rounded-xl bg-terminal-card border border-terminal-border p-5">
                        <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-[#1a73c4]" />
                            Recommendations ({result.recommendations.length})
                        </h3>
                        <div className="space-y-2.5">
                            {result.recommendations.map((rec, i) => (
                                <div key={i} className="flex gap-2.5 text-xs items-start">
                                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border mt-0.5 ${prioColor[rec.priority]}`}>
                                        {rec.priority}
                                    </span>
                                    <span className="text-slate-300 leading-relaxed">{rec.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

