interface ImportMetaEnv {
  readonly PUBLIC_MEDUSA_BACKEND_URL: string
  readonly PUBLIC_MEDUSA_PUBLISHABLE_KEY: string
  readonly PUBLIC_MEDUSA_REGION_ID: string
  readonly PUBLIC_MEDUSA_CURRENCY_CODE?: string
  readonly PUBLIC_MEILISEARCH_HOST?: string
  readonly PUBLIC_MEILISEARCH_SEARCH_API_KEY?: string
  readonly PUBLIC_MEILISEARCH_INDEX?: string
  readonly IMAGOR_SECRET?: string
  readonly IMAGOR_OPS_PATH?: string
  readonly IMAGOR_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.svg" {
  const content: any
  export default content
}