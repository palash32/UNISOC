# 🛡️ UniSOC — Security Operations Center Assessment Toolkit

A comprehensive, dark-themed SOC Assessment Toolkit built for security analysts, penetration testers, and incident responders. Designed to streamline threat investigations and security assessments during client engagements.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🔧 Tools (15 Total)

### 🔍 Investigation Tools
| Tool | Description | Data Source |
|------|-------------|-------------|
| **IP Lookup** | Geolocation, ASN, ISP, timezone | ip-api.com (free) |
| **URL Analyzer** | URL decomposition, defanged output | Client-side |
| **Hash Lookup** | Auto-detect MD5/SHA-1/SHA-256/SHA-512 | Client-side + external links |
| **Domain Intel** | DNS records (A, AAAA, MX, NS, TXT, CNAME) | Google DNS-over-HTTPS |
| **Whois** | Registration data, nameservers, status codes | RDAP protocol |
| **CVE Lookup** | CVSS scores, severity, references, timeline | NIST NVD API |

### 🛠️ Utility Tools
| Tool | Description |
|------|-------------|
| **IOC Extractor** | Extract IPs, domains, URLs, hashes, emails, CVEs from raw text |
| **Defang / Refang** | Safely share URLs/IPs: `hxxps://example[.]com` ↔ live URLs |
| **Base64 Codec** | Encode/decode Base64, URL, Hex, HTML entities |
| **Timestamp Converter** | Unix epoch ↔ human-readable with live clock |
| **Email Header Analyzer** | Parse delivery hops, delays, SPF/DKIM/DMARC |
| **Regex Tester** | Test patterns with 10 pre-loaded security regexes |

### 🔐 Security Tools
| Tool | Description | Data Source |
|------|-------------|-------------|
| **Password Breach Check** | Check against breach databases | HIBP k-anonymity API |
| **User-Agent Parser** | Identify browsers, bots, OS, device types | Client-side |
| **Subnet Calculator** | CIDR ranges, netmasks, host counts, binary | Client-side |

---

## 📁 Project Structure

```
UniSOC/
├── cyberflow-frontend/          # Next.js 15 frontend
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx       # Collapsible sidebar with 3 categories
│   │   │   ├── page.tsx         # Dashboard with ASCII banner + tool grid
│   │   │   ├── ip/              # IP Lookup
│   │   │   ├── url/             # URL Analyzer
│   │   │   ├── hash/            # Hash Lookup
│   │   │   ├── domain/          # Domain Intel
│   │   │   ├── whois/           # WHOIS Lookup
│   │   │   ├── cve/             # CVE Lookup
│   │   │   ├── ioc-extractor/   # IOC Extractor
│   │   │   ├── defang/          # Defang/Refang
│   │   │   ├── encoder/         # Base64 Codec
│   │   │   ├── timestamp/       # Timestamp Converter
│   │   │   ├── email-header/    # Email Header Analyzer
│   │   │   ├── regex/           # Regex Tester
│   │   │   ├── password/        # Password Breach Check
│   │   │   ├── useragent/       # User-Agent Parser
│   │   │   └── subnet/          # Subnet Calculator
│   │   └── globals.css          # Dark terminal theme
│   └── components/
│       ├── tool-layout.tsx      # Reusable page layout
│       └── result-card.tsx      # Output card with copy button
│
├── cyberflow-backend/           # Go (Gin) backend
│   ├── main.go                  # Entry point
│   ├── internal/
│   │   ├── api/
│   │   │   ├── routes.go        # All routes including /lookup/*
│   │   │   ├── handlers/
│   │   │   │   ├── handlers.go  # SOAR alert/incident handlers
│   │   │   │   └── lookup.go    # VT, AbuseIPDB, Shodan proxies
│   │   │   └── middleware/
│   │   │       └── auth.go      # Clerk auth (disabled for now)
│   │   ├── config/
│   │   │   └── config.go        # Env config + API keys
│   │   └── database/
│   │       └── database.go      # PostgreSQL via pgxpool
│   └── .env.example             # API key template
│
└── setup-dev.ps1                # Dev setup script
```

---

## 🚀 Quick Start

### Frontend (works immediately, no API keys needed)

```bash
cd cyberflow-frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend (optional — needed for VT/AbuseIPDB/Shodan proxying)

```bash
cd cyberflow-backend
cp .env.example .env
# Add your API keys to .env
go run main.go
# → http://localhost:8080
```

---

## 🔑 API Keys (Optional)

Most tools work without any API keys. To enable enriched threat intel, add keys to `cyberflow-backend/.env`:

| Service | Get Key | Purpose |
|---------|---------|---------|
| [VirusTotal](https://www.virustotal.com/gui/join-us) | Free | Malware/reputation scores |
| [AbuseIPDB](https://www.abuseipdb.com/account/plans) | Free | IP abuse reports |
| [Shodan](https://account.shodan.io/) | Free | Open ports & services |

---

## 🎨 Design

- **Theme**: Dark terminal/hacker aesthetic — `#0a0a0f` background, matrix green `#00ff41` accents, cyan `#00d4ff` highlights
- **Typography**: JetBrains Mono for data, Inter for UI
- **Effects**: Glow shadows, scanline overlays, custom scrollbar
- **Layout**: Collapsible sidebar, responsive tool grid

---

## 🛣️ Roadmap

- [ ] Inline VirusTotal/AbuseIPDB/Shodan results in investigation tools
- [ ] PDF/JSON report export for client deliverables
- [ ] Investigation case management (save & organize findings)
- [ ] Clerk authentication for production deployments
- [ ] Port scanner integration

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Go 1.21+, Gin, pgxpool |
| Database | PostgreSQL |
| Auth | Clerk (disabled, ready for production) |
| APIs | ip-api, Google DNS, RDAP, NIST NVD, HIBP |

---

## 📜 License

MIT © UniSpark
