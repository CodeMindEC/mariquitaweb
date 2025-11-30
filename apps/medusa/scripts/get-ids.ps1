param(
    # URL de tu backend Medusa
    [string]$BackendUrl = "http://localhost:9000",
    # Secret API key (la que empieza por sk_)
    [string]$ApiToken = ""
)

if (-not $ApiToken) {
    Write-Host "Introduce tu Secret API Token (la que empieza por sk_):" -ForegroundColor Yellow
    $ApiToken = Read-Host
}

# Admin API usa Authorization: Basic {api_token}
$headers = @{
    "Authorization" = "Basic $ApiToken"
}

# ---------- 1) PRODUCT TYPES ----------
Write-Host "== PRODUCT TYPES ==" -ForegroundColor Cyan
try {
    $typesUrl = "$BackendUrl/admin/product-types?limit=100&offset=0&fields=id,value"
    Write-Host "Consultando: $typesUrl"
    $typesResponse = Invoke-RestMethod -Uri $typesUrl -Headers $headers -Method Get -ErrorAction Stop

    $types = $typesResponse.product_types
    if ($types) {
        $types | Select-Object id, value | Format-Table -AutoSize
        $types | Select-Object id, value |
        Export-Csv -Path ".\medusa-product-types.csv" -NoTypeInformation -Encoding UTF8
        Write-Host "Exportado: medusa-product-types.csv" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontraron product types." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error al consultar /admin/product-types" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}

# ---------- 2) COLLECTIONS ----------
Write-Host "`n== COLLECTIONS ==" -ForegroundColor Cyan
try {
    $collUrl = "$BackendUrl/admin/collections?limit=100&offset=0&fields=id,title,handle"
    Write-Host "Consultando: $collUrl"
    $collResponse = Invoke-RestMethod -Uri $collUrl -Headers $headers -Method Get -ErrorAction Stop

    $collections = $collResponse.collections
    if ($collections) {
        $collections | Select-Object id, title, handle | Format-Table -AutoSize
        $collections | Select-Object id, title, handle |
        Export-Csv -Path ".\medusa-product-collections.csv" -NoTypeInformation -Encoding UTF8
        Write-Host "Exportado: medusa-product-collections.csv" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontraron colecciones." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error al consultar /admin/collections" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}

# ---------- 3) SALES CHANNELS ----------
Write-Host "`n== SALES CHANNELS ==" -ForegroundColor Cyan
try {
    $scUrl = "$BackendUrl/admin/sales-channels?limit=100&offset=0&fields=id,name,description"
    Write-Host "Consultando: $scUrl"
    $scResponse = Invoke-RestMethod -Uri $scUrl -Headers $headers -Method Get -ErrorAction Stop

    $channels = $scResponse.sales_channels
    if ($channels) {
        $channels | Select-Object id, name, description | Format-Table -AutoSize
        $channels | Select-Object id, name, description |
        Export-Csv -Path ".\medusa-sales-channels.csv" -NoTypeInformation -Encoding UTF8
        Write-Host "Exportado: medusa-sales-channels.csv" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontraron canales de venta." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error al consultar /admin/sales-channels" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}

# ---------- 4) PRODUCT CATEGORIES ----------
Write-Host "`n== PRODUCT CATEGORIES ==" -ForegroundColor Cyan
try {
    # sin fields para no pelear con nada, luego seleccionamos columnas
    $catUrl = "$BackendUrl/admin/product-categories?limit=200&offset=0"
    Write-Host "Consultando: $catUrl"
    $catResponse = Invoke-RestMethod -Uri $catUrl -Headers $headers -Method Get -ErrorAction Stop

    $categories = $catResponse.product_categories
    if ($categories) {
        # Mostramos id, name, handle y el parent_category_id para ver la jerarquía
        $categories |
        Select-Object id, name, handle, parent_category_id |
        Format-Table -AutoSize

        $categories |
        Select-Object id, name, handle, parent_category_id |
        Export-Csv -Path ".\medusa-product-categories.csv" -NoTypeInformation -Encoding UTF8

        Write-Host "Exportado: medusa-product-categories.csv" -ForegroundColor Green
    }
    else {
        Write-Host "No se encontraron categorías de producto." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error al consultar /admin/product-categories" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}
