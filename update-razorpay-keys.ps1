# PowerShell script to update Razorpay keys
param(
    [Parameter(Mandatory=$true)]
    [string]$KeyId,
    
    [Parameter(Mandatory=$true)]
    [string]$KeySecret
)

Write-Host "Updating Razorpay keys..." -ForegroundColor Green

# Read current .env file
$envContent = Get-Content .env

# Update or add Razorpay keys
$updatedContent = @()
$razorpaySection = $false

foreach ($line in $envContent) {
    if ($line -match "^# Razorpay Payment Gateway") {
        $razorpaySection = $true
        $updatedContent += $line
    }
    elseif ($line -match "^RAZORPAY_KEY_ID=") {
        $updatedContent += "RAZORPAY_KEY_ID=$KeyId"
    }
    elseif ($line -match "^RAZORPAY_KEY_SECRET=") {
        $updatedContent += "RAZORPAY_KEY_SECRET=$KeySecret"
    }
    elseif ($line -match "^VITE_RAZORPAY_KEY_ID=") {
        $updatedContent += "VITE_RAZORPAY_KEY_ID=$KeyId"
    }
    elseif ($razorpaySection -and $line -eq "") {
        $razorpaySection = $false
        $updatedContent += $line
    }
    else {
        $updatedContent += $line
    }
}

# Write updated content back to .env
$updatedContent | Out-File -FilePath .env -Encoding UTF8

Write-Host "✅ Razorpay keys updated successfully!" -ForegroundColor Green
Write-Host "Key ID: $KeyId" -ForegroundColor Yellow
Write-Host "Key Secret: $($KeySecret.Substring(0,8))..." -ForegroundColor Yellow
Write-Host "`nNow restart your server with: npm run dev" -ForegroundColor Cyan
