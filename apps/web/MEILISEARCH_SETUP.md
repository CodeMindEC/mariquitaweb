# Integración de Meilisearch para el Catálogo

Este sistema ahora utiliza **Meilisearch** como motor de búsqueda para los filtros del catálogo, lo que proporciona búsquedas más rápidas y eficientes.

## 🚀 Características

- **Búsquedas ultrarrápidas**: Meilisearch optimiza las consultas para resultados instantáneos
- **Fallback automático**: Si Meilisearch no está configurado, el sistema usa automáticamente la API tradicional
- **Filtros avanzados**: Soporte completo para categorías, colecciones, etiquetas, tipos y precios
- **Paginación eficiente**: Carga más productos sin recargar toda la página
- **Cache inteligente**: Los resultados se cachean para reducir llamadas innecesarias

## 📋 Requisitos Previos

1. **Servidor Meilisearch**: Necesitas una instancia de Meilisearch en ejecución
2. **Índice de productos**: Los productos deben estar indexados en Meilisearch

## ⚙️ Configuración

### Variables de Entorno

Agrega las siguientes variables en tu archivo `.env` (en la carpeta `apps/web`):

```env
# Configuración de Meilisearch
PUBLIC_MEILISEARCH_HOST=http://localhost:7700
PUBLIC_MEILISEARCH_SEARCH_API_KEY=tu-api-key-aqui
PUBLIC_MEILISEARCH_INDEX=products
```

**Importante**: Las variables deben tener el prefijo `PUBLIC_` para que Astro las haga disponibles en el cliente.

### Valores de las Variables

- **PUBLIC_MEILISEARCH_HOST**: URL de tu servidor Meilisearch
  - Ejemplo local: `http://localhost:7700`
  - Ejemplo producción: `https://meilisearch.tudominio.com`

- **PUBLIC_MEILISEARCH_SEARCH_API_KEY**: Tu API key de búsqueda (solo lectura)
  - Puedes obtenerla ejecutando: `curl http://localhost:7700/keys`
  - O crearla desde el panel de Meilisearch

- **PUBLIC_MEILISEARCH_INDEX**: Nombre del índice que contiene tus productos
  - Por defecto: `products`

### Estructura del Índice

Los productos en Meilisearch deben tener la siguiente estructura:

```json
{
  "id": "prod_123",
  "objectID": "prod_123",
  "title": "Producto Ejemplo",
  "description": "Descripción del producto",
  "handle": "producto-ejemplo",
  "thumbnail": "https://...",
  "min_price": 1500,
  "max_price": 2000,
  "currency_code": "USD",
  "category_ids": ["cat_1", "cat_2"],
  "category_names": ["Categoría 1", "Categoría 2"],
  "tag_values": ["tag-1", "tag-2"],
  "collection_id": "col_1",
  "collection_title": "Colección Ejemplo",
  "type_id": "type_1",
  "type_value": "Tipo Ejemplo",
  "status": "published",
  "variant_skus": ["SKU-1", "SKU-2"]
}
```

### Configuración de Filtros

Los filtros en Meilisearch deben estar configurados correctamente. Los siguientes atributos **deben** ser filtrables:

```bash
curl -X PATCH 'http://localhost:7700/indexes/products/settings' \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "filterableAttributes": [
      "status",
      "category_ids",
      "collection_id",
      "tag_values",
      "variant_skus",
      "handle",
      "id"
    ],
    "sortableAttributes": [
      "min_price",
      "max_price"
    ]
  }'
```

**Nota importante**: El filtro por `type_id` se realiza en el cliente debido a que no está configurado como filtrable en el índice actual. Si deseas filtrar por tipo en Meilisearch (más eficiente), agrega `"type_id"` a `filterableAttributes` y reindexa tus productos.

## 🧪 Pruebas

Para verificar que Meilisearch está funcionando:

1. **Verifica la conexión**:
   ```bash
   curl http://localhost:7700/health
   ```

2. **Prueba una búsqueda**:
   ```bash
   curl -X POST 'http://localhost:7700/indexes/products/search' \
     -H 'Content-Type: application/json' \
     --data-binary '{"q": ""}'
   ```

3. **Abre la aplicación web** y navega al catálogo
   - Si Meilisearch está configurado, verás búsquedas instantáneas
   - Si no está configurado, se usará la API tradicional automáticamente

## 🔄 Modo Fallback

Si Meilisearch no está configurado o hay un error:
- El sistema automáticamente usará la API tradicional (`/api/catalog.json`)
- Verás un warning en la consola: `"Meilisearch no está configurado. Usando fallback."`
- Los usuarios no notarán la diferencia, pero las búsquedas serán más lentas

## 📦 Archivos Creados/Modificados

### Nuevos Archivos
- `src/lib/meilisearch/utils.ts` - Utilidades para Meilisearch
- `src/components/UI/catalog/useMeilisearchCatalog.ts` - Hook de React para búsquedas

### Archivos Modificados
- `src/lib/meilisearch/searchClient.ts` - Cliente de Meilisearch
- `src/components/UI/Container.tsx` - Integración con Meilisearch
- `package.json` - Nuevo paquete `meilisearch`

## 🐛 Solución de Problemas

### Las búsquedas no usan Meilisearch

1. Verifica que las variables de entorno están configuradas:
   ```bash
   echo $PUBLIC_MEILISEARCH_HOST
   echo $PUBLIC_MEILISEARCH_SEARCH_API_KEY
   ```

2. Verifica que el servidor está corriendo:
   ```bash
   curl http://localhost:7700/health
   ```

3. Revisa la consola del navegador para ver mensajes de error

### Errores de "Filter not found"

Los atributos de filtro deben estar configurados en Meilisearch. Ejecuta:
```bash
curl http://localhost:7700/indexes/products/settings | jq .filterableAttributes
```

### Sin resultados

1. Verifica que el índice tiene datos:
   ```bash
   curl http://localhost:7700/indexes/products/stats
   ```

2. Prueba una búsqueda básica sin filtros

## 📚 Recursos

- [Documentación de Meilisearch](https://docs.meilisearch.com/)
- [instant-meilisearch](https://github.com/meilisearch/instant-meilisearch)
- [Meilisearch JS Client](https://github.com/meilisearch/meilisearch-js)

## 🎯 Próximos Pasos

Para mejorar aún más la integración:

1. **Configurar sincronización automática**: Actualizar el índice cuando cambien productos
2. **Agregar búsqueda por texto**: Permitir búsquedas por palabras clave
3. **Implementar sugerencias**: Autocompletado de búsquedas
4. **Facetas dinámicas**: Mostrar contadores en los filtros
5. **Typo tolerance**: Manejar errores tipográficos en búsquedas
