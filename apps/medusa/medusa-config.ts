import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { MeilisearchPluginOptions } from '@rokmohar/medusa-plugin-meilisearch'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const DEFAULT_SEARCH_CURRENCY = process.env.MEILISEARCH_DEFAULT_CURRENCY ?? 'USD'

const resolvePriceRange = (product: any) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const amounts: number[] = []

  for (const variant of variants) {
    const prices = Array.isArray(variant?.prices) ? variant.prices : []
    for (const price of prices) {
      const currencyMatches =
        typeof price?.currency_code === 'string' &&
        price.currency_code.toUpperCase() === DEFAULT_SEARCH_CURRENCY.toUpperCase()
      if (!currencyMatches || price?.price_list_id || typeof price?.amount !== 'number') {
        continue
      }

      amounts.push(price.amount)
    }
  }

  if (!amounts.length) {
    return { minPrice: null, maxPrice: null }
  }

  return {
    minPrice: Math.min(...amounts),
    maxPrice: Math.max(...amounts),
  }
}

const enhanceProductForSearch = (product: any) => {
  const categories = Array.isArray(product?.categories) ? product.categories : []
  const tags = Array.isArray(product?.tags) ? product.tags : []
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const { minPrice, maxPrice } = resolvePriceRange(product)

  // Extraer información de pesos de las variantes
  const variantWeightData: Array<{ weight: number | null; price: number; title: string; thumbnail: string | null }> = []
  const uniqueWeights = new Set<number>()

  for (const variant of variants) {
    const prices = Array.isArray(variant?.prices) ? variant.prices : []
    const weight = variant?.weight ?? null
    const thumbnail = variant?.thumbnail || variant?.metadata?.thumbnail || null

    for (const price of prices) {
      const currencyMatches =
        typeof price?.currency_code === 'string' &&
        price.currency_code.toUpperCase() === DEFAULT_SEARCH_CURRENCY.toUpperCase()
      if (!currencyMatches || price?.price_list_id || typeof price?.amount !== 'number') {
        continue
      }

      if (weight !== null && typeof weight === 'number') {
        uniqueWeights.add(weight)
        variantWeightData.push({
          weight,
          price: price.amount,
          title: variant?.title || `${weight}g`,
          thumbnail
        })
      }
    }
  }

  // Ordenar pesos únicos
  const sortedWeights = Array.from(uniqueWeights).sort((a, b) => a - b)

  // Crear mapa de peso -> precio y peso -> thumbnail
  const weightPriceMap: Record<number, number> = {}
  const weightThumbnailMap: Record<number, string | null> = {}

  for (const data of variantWeightData) {
    if (data.weight !== null) {
      // Si ya existe un precio para este peso, usar el menor
      if (weightPriceMap[data.weight] === undefined || data.price < weightPriceMap[data.weight]) {
        weightPriceMap[data.weight] = data.price
        // Actualizar thumbnail cuando actualizamos el precio
        weightThumbnailMap[data.weight] = data.thumbnail
      }
    }
  }

  // Encontrar el peso que corresponde al precio mínimo y máximo
  let weightForMinPrice: number | null = null
  let weightForMaxPrice: number | null = null

  if (minPrice !== null) {
    const minVariant = variantWeightData.find(v => v.price === minPrice)
    weightForMinPrice = minVariant?.weight ?? null
  }

  if (maxPrice !== null) {
    const maxVariant = variantWeightData.find(v => v.price === maxPrice)
    weightForMaxPrice = maxVariant?.weight ?? null
  }

  // Crear textos legibles para los pesos
  const availableWeightsText = sortedWeights.map(w => `${w}g`)

  return {
    ...product,
    category_ids: categories.map((category: any) => category?.id).filter(Boolean),
    category_names: categories
      .map((category: any) => category?.name ?? category?.handle)
      .filter(Boolean),
    tag_values: tags.map((tag: any) => tag?.value).filter(Boolean),
    collection_id: product?.collection?.id || null,
    collection_title: product?.collection?.title || null,
    type_id: product?.type?.id || null,
    type_value: product?.type?.value || null,
    variant_skus: variants.map((variant: any) => variant?.sku).filter(Boolean),
    variant_weights: sortedWeights,
    weight_price_map: weightPriceMap,
    weight_thumbnail_map: weightThumbnailMap,
    weight_for_min_price: weightForMinPrice,
    weight_for_max_price: weightForMaxPrice,
    available_weights_text: availableWeightsText,
    min_price: minPrice,
    max_price: maxPrice,
    currency_code: DEFAULT_SEARCH_CURRENCY,
    popularity: Number(product?.metadata?.popularity ?? product?.metadata?.sales_count ?? 0) || 0,
  }
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              // 👉 lo que verá el admin y el front:
              file_url: process.env.FILES_BASE_URL,

              // 👉 S3 real = Garage
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
  ],
  plugins: [{
    resolve: '@rokmohar/medusa-plugin-meilisearch',
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST ?? '',
        apiKey: process.env.MEILISEARCH_API_KEY ?? '',
      },
      settings: {
        // The key is used as the index name in Meilisearch
        products: {
          type: 'products',
          enabled: true,
          fields: [
            'id',
            'title',
            'description',
            'handle',
            'thumbnail',
            'status',
            'metadata',
            'created_at',
            'categories.*',
            'tags.*',
            'collection.*',
            'type.*',
            'variants.id',
            'variants.sku',
            'variants.weight',
            'variants.prices.*',
          ],
          indexSettings: {
            searchableAttributes: [
              'title',
              'description',
              'category_names',
              'tag_values',
              'variant_skus',
            ],
            displayedAttributes: [
              'id',
              'handle',
              'title',
              'description',
              'thumbnail',
              'category_names',
              'category_ids',
              'tag_values',
              'collection_id',
              'collection_title',
              'type_id',
              'type_value',
              'variant_weights',
              'weight_price_map',
              'weight_thumbnail_map',
              'weight_for_min_price',
              'weight_for_max_price',
              'available_weights_text',
              'min_price',
              'max_price',
              'currency_code',
            ],
            filterableAttributes: [
              'id',
              'handle',
              'status',
              'category_ids',
              'tag_values',
              'collection_id',
              'type_id',
              'variant_skus',
              'variant_weights',
            ],
            sortableAttributes: ['min_price', 'max_price', 'created_at'],
            rankingRules: [
              'words',
              'typo',
              'proximity',
              'attribute',
              'sort',
              'exactness',
            ],
            synonyms: {
              snack: ['botana', 'pasaboca', 'snack'],
              combo: ['combo', 'paquete', 'kit'],
              bebida: ['bebida', 'jugos', 'drink'],
            },
            typoTolerance: {
              minWordSizeForTypos: {
                oneTypo: 5,
                twoTypos: 9,
              },
              disableOnAttributes: ['variant_skus'],
            },
          },
          primaryKey: 'id',
          transformer: (product) => enhanceProductForSearch(product),
        },
        categories: {
          // Required: Index type
          type: 'categories',
          // Optional: Whether the index is enabled
          enabled: true,
          // Optional: Specify which fields to include in the index
          // If not specified, all fields will be included
          fields: ['id', 'name', 'description', 'handle', 'is_active', 'parent_id'],
          indexSettings: {
            searchableAttributes: ['name', 'description'],
            displayedAttributes: ['id', 'name', 'description', 'handle', 'is_active', 'parent_id'],
            filterableAttributes: ['id', 'handle', 'is_active', 'parent_id'],
          },
          primaryKey: 'id',
          // Create your own transformer
          /*transformer: (category) => ({
            id: category.id,
            name: category.name,
            // other attributes...
          }),*/
        },
      },
      i18n: {
        // Choose one of the following strategies:

        // 1. Separate index per language
        // strategy: 'separate-index',
        // languages: ['en', 'fr', 'de'],
        // defaultLanguage: 'en',

        // 2. Language-specific fields with suffix
        strategy: 'field-suffix',
        languages: ['es', 'en'],
        defaultLanguage: 'es',
        translatableFields: ['title', 'description'],
      },
    } satisfies MeilisearchPluginOptions,
  },
  ],
})
