import { instantMeiliSearch } from "@meilisearch/instant-meilisearch"
import { MeiliSearch } from "meilisearch"
import type { InstantSearchProps } from "react-instantsearch"

type InstantSearchClient = NonNullable<InstantSearchProps["searchClient"]>

const host = import.meta.env.PUBLIC_MEILISEARCH_HOST ?? ""
const apiKey = import.meta.env.PUBLIC_MEILISEARCH_SEARCH_API_KEY ?? ""
export const MEILISEARCH_PRODUCTS_INDEX = import.meta.env.PUBLIC_MEILISEARCH_INDEX ?? "products"

const client = host && apiKey
    ? instantMeiliSearch(host, apiKey, {
        placeholderSearch: false,
        finitePagination: true,
    })
    : null

// Cliente de Meilisearch puro para búsquedas directas
export const meiliClient = host && apiKey ? new MeiliSearch({ host, apiKey }) : null

// InstantSearch only needs the adapter's searchClient, not the helper metadata.
export const searchClient: InstantSearchClient | null = client?.searchClient ?? null
export const isSearchConfigured = Boolean(searchClient && meiliClient)
