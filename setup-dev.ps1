# CyberFlow Development Setup Script

Write-Host "🚀 CyberFlow SOAR Platform - Development Setup" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Go
try {
    $goVersion = go version
    Write-Host "✅ Go: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Go not found. Please install Go 1.21+" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL (optional)
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL not found in PATH (optional for local dev)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Yellow

# Setup frontend .env
if (-Not (Test-Path "cyberflow-frontend\.env.local")) {
    Copy-Item "cyberflow-frontend\.env.local.example" "cyberflow-frontend\.env.local"
    Write-Host "✅ Created cyberflow-frontend\.env.local" -ForegroundColor Green
    Write-Host "⚠️  Please add your Clerk keys to .env.local" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  cyberflow-frontend\.env.local already exists" -ForegroundColor Cyan
}

# Setup backend .env
if (-Not (Test-Path "cyberflow-backend\.env")) {
    Copy-Item "cyberflow-backend\.env.example" "cyberflow-backend\.env"
    Write-Host "✅ Created cyberflow-backend\.env" -ForegroundColor Green
} else {
    Write-Host "ℹ️  cyberflow-backend\.env already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add Clerk API keys to cyberflow-frontend\.env.local" -ForegroundColor White
Write-Host "   Get keys from: https://dashboard.clerk.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure PostgreSQL in cyberflow-backend\.env" -ForegroundColor White
Write-Host "   DATABASE_URL=postgres://user:password@localhost:5432/cyberflow" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Create database and run migrations:" -ForegroundColor White
Write-Host "   createdb cyberflow" -ForegroundColor Gray
Write-Host "   psql -d cyberflow -f cyberflow-backend\migrations\public_schema.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the backend (terminal 1):" -ForegroundColor White
Write-Host "   cd cyberflow-backend" -ForegroundColor Gray
Write-Host "   go run main.go" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Start the frontend (terminal 2):" -ForegroundColor White
Write-Host "   cd cyberflow-frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Visit http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: README.md" -ForegroundColor Cyan
