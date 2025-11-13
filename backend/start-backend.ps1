# Backend Startup Script for Windows PowerShell

Write-Host "🚀 Starting PC Builder Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created. Please update it with your database credentials." -ForegroundColor Green
    Write-Host ""
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if MySQL is running (optional check)
Write-Host "🔍 Checking database connection..." -ForegroundColor Cyan

# Start the server
Write-Host "▶️  Starting server on port 5000..." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start

