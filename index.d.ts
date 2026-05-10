import type { DefineComponent } from 'vue'

export interface SelectOption {
  id: string | number
  text: string
  isTag?: boolean
  children?: Omit<SelectOption, 'children'>[]
  [key: string]: unknown
}

export interface QueryParams {
  term: string
  page: number
}

export interface QueryResult {
  results: SelectOption[]
  pagination?: {
    more: boolean
  }
}

export interface VueSelectPhrases {
  noResults?: () => string
  searching?: () => string
  clear?: () => string
}

export interface VueSelectProps {
  /** v-model value. String/number for single, array for multiple. */
  modelValue?: string | number | (string | number)[] | null
  /** Static option list. Each item: { id, text } or { text, children: [...] } for groups. */
  options?: SelectOption[]
  /** Extra CSS class(es) applied to the control element. */
  selectClass?: string | Record<string, boolean>
  /** Name attribute for the hidden native <select> (form submit compatibility). */
  name?: string | null
  /**
   * Local search predicate factory.
   * Default: case-insensitive substring match with RU↔EN keyboard layout swap.
   */
  searchFunction?: (term: string) => (item: SelectOption) => boolean
  /**
   * Async query function. Called on every search with `{ term, page }`.
   * Must invoke `callback({ results, pagination })` when data is ready.
   */
  queryFunction?: ((params: QueryParams, callback: (data: QueryResult) => void) => void) | null
  /** Allow selecting multiple values (tag-style UI). */
  multiple?: boolean
  /** Minimum number of options before the search input is shown (0 = always). */
  minimumResultsForSearch?: number
  /** Pre-populated option cache. Merged with `options` on mount. */
  cache?: SelectOption[] | null
  /** RegExp used to split the search term into multiple tags (tokenizer). */
  tagSeparator?: RegExp
  /**
   * Called when a new tag should be created from `{ term }`.
   * Return `{ id, text }` to create the tag, or `null` to reject.
   */
  createTag?: ((params: { term: string }) => Omit<SelectOption, 'isTag' | 'children'> | null) | null
  /** When true, default (empty query) search runs against the cache instead of `options`. */
  isDefaultFromCache?: boolean
  disabled?: boolean
  /** Adds `has-error` CSS class to the root element (Bootstrap 3 validation style). */
  hasError?: boolean
  placeholder?: string
  /** UI locale. Accepts `'ru'` | `'en'` or a custom phrases object. Default: normalized `window.locale` or `'ru'`. */
  lang?: 'ru' | 'en' | string | VueSelectPhrases
}

export type VueSelectEmits = {
  /** Fires on every selection/deselection change. */
  'update:modelValue': [value: string | number | (string | number)[] | null]
  /** Fires whenever the internal option cache is updated. */
  'cache': [cache: SelectOption[]]
  /** Fires on every search input change. */
  'search': [term: string]
}

declare const VueSelect: DefineComponent<VueSelectProps>

export { VueSelect }
export default VueSelect

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    VueSelect: typeof VueSelect
  }
}
