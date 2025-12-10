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

      amounts.push(price.amount / 100)
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

  return {
    ...product,
    category_ids: categories.map((category: any) => category?.id).filter(Boolean),
    category_names: categories
      .map((category: any) => category?.name ?? category?.handle)
      .filter(Boolean),
    tag_values: tags.map((tag: any) => tag?.value).filter(Boolean),
    variant_skus: variants.map((variant: any) => variant?.sku).filter(Boolean),
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
              'tag_values',
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
              'variant_skus',
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
