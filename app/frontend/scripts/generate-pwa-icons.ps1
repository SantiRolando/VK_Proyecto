# Íconos placeholder de la PWA (Q-16: la marca real todavía no está definida).
# Genera los PNG que referencia el `manifest` de `vite.config.js` en `public/`.
# Reemplazar cuando llegue el logo de Vikinga; el manifest no cambia si se
# conservan los nombres y tamaños.
#
# Uso:  powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
#
# Nota: usa System.Drawing (solo Windows). El proyecto no incorpora una
# dependencia de generación de íconos por dos placeholders.

Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\public'
$background = [System.Drawing.ColorTranslator]::FromHtml('#134379') # vikinga-7
$foreground = [System.Drawing.Color]::White

function New-Icon {
  param(
    [int]$Size,
    [string]$File,
    [double]$ArtRatio # proporción del alto del canvas que ocupa el texto
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = 'AntiAlias'
  $graphics.TextRenderingHint = 'AntiAliasGridFit'
  $graphics.Clear($background)

  $font = New-Object System.Drawing.Font(
    'Arial',
    [float]($Size * $ArtRatio),
    [System.Drawing.FontStyle]::Bold,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = 'Center'
  $format.LineAlignment = 'Center'

  $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
  $brush = New-Object System.Drawing.SolidBrush($foreground)
  $graphics.DrawString('VK', $font, $brush, $rect, $format)

  $path = Join-Path $out $File
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Output ("escrito: " + $File + " (" + $Size + "x" + $Size + ")")
}

# `any`: el arte puede usar casi todo el canvas.
New-Icon -Size 192 -File 'pwa-192x192.png' -ArtRatio 0.42
New-Icon -Size 512 -File 'pwa-512x512.png' -ArtRatio 0.42
# Apple aplica su propia máscara: mismo arte que `any`.
New-Icon -Size 180 -File 'apple-touch-icon.png' -ArtRatio 0.42
# `maskable`: el arte vive dentro de la zona segura (60 % central).
New-Icon -Size 512 -File 'pwa-maskable-512x512.png' -ArtRatio 0.28
