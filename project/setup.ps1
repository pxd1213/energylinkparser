# Download and install Node.js
$nodeVersion = "18.17.1"
$nodeUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-x64.msi"
$nodeInstaller = "node-v$nodeVersion-x64.msi"

# Download Node.js installer
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller

# Install Node.js
Start-Process -FilePath msiexec.exe -ArgumentList "/i $nodeInstaller /quiet /norestart" -Wait

# Remove installer
Remove-Item $nodeInstaller

# Verify installation
Write-Host "Node.js version:"
node --version
Write-Host "npm version:"
npm --version

# Install project dependencies
npm install
