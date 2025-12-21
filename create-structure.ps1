# Script pour créer l'arborescence complète du projet
$srcPath = "src"

# Créer les dossiers principaux
$directories = @(
    "$srcPath\app\(auth)",
    "$srcPath\app\(auth)\login",
    "$srcPath\app\(auth)\register",
    "$srcPath\app\(dashboard)",
    "$srcPath\app\(dashboard)\dashboard",
    "$srcPath\components",
    "$srcPath\components\ui",
    "$srcPath\components\auth",
    "$srcPath\components\dashboard",
    "$srcPath\services",
    "$srcPath\services\api",
    "$srcPath\services\auth",
    "$srcPath\lib",
    "$srcPath\lib\utils",
    "$srcPath\types",
    "$srcPath\hooks",
    "$srcPath\middleware"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Créé: $dir" -ForegroundColor Green
    } else {
        Write-Host "→ Existe déjà: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`nStructure créée avec succès!" -ForegroundColor Cyan

