# VueSelect

[Русская документация](README.md)

A lightweight **Vue 3** select and multiselect component built with the Composition API. It is designed as a practical replacement for jQuery Select2 with no runtime dependencies except `lodash-es`.

By default, the component reads `window.locale` and normalizes it to a base language code (`ru-RU` -> `ru`, `en-US` -> `en`). If the global locale is missing or unsupported, Russian is used as the fallback. English can also be enabled explicitly with `lang="en"` or replaced with custom phrases.

## Table Of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Events](#events)
- [Option Format](#option-format)
- [Examples](#examples)
- [Localization](#localization)
- [Keyboard Navigation](#keyboard-navigation)
- [Demos](#demos)
- [Testing](#testing)
- [Migrating From Select2](#migrating-from-select2)

## Features

- Single and multiple selection with `v-model`
- Local filtering with RU <-> EN keyboard layout matching
- Custom local search through `searchFunction`
- Async search with pagination through `queryFunction`
- Grouped options through `children`
- User-created tags through `createTag`
- Tokenizer for creating several tags from one input
- Scroll pagination with `IntersectionObserver`
- Internal cache for loaded or preselected options
- Native form compatibility through a hidden `<select>`
- Bootstrap 3 compatible styling
- Full keyboard navigation
- Language detection through `window.locale` with Russian fallback

## Installation

```bash
npm install @ttbooking/vue-select
```

Import the component and its CSS:

```vue
<script setup>
import VueSelect from '@ttbooking/vue-select'
import '@ttbooking/vue-select/style.css'
</script>
```

You can also register it globally:

```js
import { createApp } from 'vue'
import VueSelect from '@ttbooking/vue-select'
import '@ttbooking/vue-select/style.css'
import App from './App.vue'

createApp(App)
  .component('VueSelect', VueSelect)
  .mount('#app')
```

## Usage

```vue
<script setup>
import { ref } from 'vue'
import VueSelect from '@ttbooking/vue-select'
import '@ttbooking/vue-select/style.css'

const city = ref(null)
const cities = [
  { id: 'nyc', text: 'New York' },
  { id: 'lon', text: 'London' },
  { id: 'tok', text: 'Tokyo' },
]
</script>

<template>
  <VueSelect
    v-model="city"
    :options="cities"
    placeholder="Select a city..."
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `String \| Number \| Array` | `null` | Selected value for `v-model`. Use a scalar for single mode and an array for multiple mode. |
| `options` | `Array` | `[]` | Option list. Items are `{ id, text }` or groups with `{ text, children }`. |
| `multiple` | `Boolean` | `false` | Enables multiple selection. |
| `placeholder` | `String` | `''` | Text shown when no value is selected. |
| `disabled` | `Boolean` | `false` | Disables the component. |
| `allowClear` | `Boolean` | `true` | Shows the clear button when a value is selected. |
| `hasError` | `Boolean` | `false` | Adds the `has-error` class for Bootstrap 3 validation styles. |
| `name` | `String` | `null` | Name for the hidden native `<select>` used during regular form submit. |
| `selectClass` | `String \| Object` | `''` | Extra class or class object applied to the control element. |
| `searchFunction` | `Function` | built-in | Local search predicate factory: `(term) => (item) => Boolean`. |
| `queryFunction` | `Function` | `null` | Async search: `({ term, page }, callback) => void`. |
| `createTag` | `Function` | `null` | Creates a tag from input: `({ term }) => { id, text } \| null`. |
| `tagSeparator` | `RegExp` | `/[^\d\wа-яё]/iu` | Tokenizer separator. |
| `cache` | `Array` | `null` | Initial option cache, useful when selected values are already known. |
| `isDefaultFromCache` | `Boolean` | `false` | When true, empty-query local filtering uses the cache instead of `options`. |
| `minimumResultsForSearch` | `Number` | `0` | Minimum number of options required before the search input is shown. |
| `lang` | `String \| Object` | `window.locale` or `'ru'` | UI language: `'ru'`, `'en'`, or a custom phrase object. |

## Events

| Event | Payload | Description |
|---|---|---|
| `update:modelValue` | `id \| id[] \| null` | Emitted when the selected value changes. |
| `cache` | `Array` | Emitted when the internal option cache changes. |
| `search` | `String` | Emitted on every search input change. |

## Option Format

Use a flat list for regular selects:

```js
const options = [
  { id: 'nyc', text: 'New York' },
  { id: 'lon', text: 'London' },
  { id: 'tok', text: 'Tokyo' },
]
```

Use `children` for grouped options:

```js
const options = [
  {
    text: 'Europe',
    children: [
      { id: 'de', text: 'Germany' },
      { id: 'fr', text: 'France' },
    ],
  },
  {
    text: 'Asia',
    children: [
      { id: 'jp', text: 'Japan' },
      { id: 'kr', text: 'South Korea' },
    ],
  },
]
```

Option `id` values may be strings or numbers. The component compares them as strings internally.

## Examples

### Single Selection

```vue
<script setup>
import { ref } from 'vue'

const city = ref(null)
const cities = [
  { id: 'nyc', text: 'New York' },
  { id: 'lon', text: 'London' },
  { id: 'tok', text: 'Tokyo' },
]
</script>

<template>
  <VueSelect
    v-model="city"
    :options="cities"
    placeholder="Select a city..."
  />
</template>
```

### Multiple Selection

```vue
<script setup>
import { ref } from 'vue'

const selected = ref([])
const frameworks = [
  { id: 'vue', text: 'Vue' },
  { id: 'react', text: 'React' },
  { id: 'angular', text: 'Angular' },
]
</script>

<template>
  <VueSelect
    v-model="selected"
    :options="frameworks"
    :multiple="true"
    placeholder="Select frameworks..."
  />
</template>
```

### Async Search

`queryFunction` runs after a 250 ms debounce whenever the search term changes. It receives `{ term, page }` and must call the callback with `{ results, pagination }`.

```vue
<script setup>
import { ref } from 'vue'

const user = ref(null)

const searchUsers = ({ term, page }, callback) => {
  fetch(`/api/users?q=${encodeURIComponent(term)}&page=${page}`)
    .then(response => response.json())
    .then(data => callback({
      results: data.items,
      pagination: { more: data.has_more },
    }))
}
</script>

<template>
  <VueSelect
    v-model="user"
    :options="[]"
    :query-function="searchUsers"
    placeholder="Start typing a name..."
  />
</template>
```

When the search term is empty, `queryFunction` is not called. The component shows local `options` or cache data instead. Scrolling to the end of the dropdown requests the next page.

### Tag Creation

`createTag` must return `{ id, text }` to create an option, or `null` to hide the tag creation option.

```vue
<script setup>
import { ref } from 'vue'

const tags = ref([])

const createTag = ({ term }) => {
  const text = term.trim()
  return text ? { id: `tag:${text}`, text } : null
}
</script>

<template>
  <VueSelect
    v-model="tags"
    :options="[]"
    :multiple="true"
    :create-tag="createTag"
    placeholder="Type a tag and press Enter..."
  />
</template>
```

### Tokenizer

When `createTag` is provided, the component can split the input by `tagSeparator` and create several tags at once.

```vue
<!-- Typing "vue, react, angular" creates three tags. -->
<VueSelect
  v-model="tags"
  :options="[]"
  :multiple="true"
  :create-tag="({ term }) => ({ id: term, text: term })"
/>

<!-- Use only semicolon as a separator. -->
<VueSelect
  v-model="tags"
  :options="[]"
  :multiple="true"
  :create-tag="({ term }) => ({ id: term, text: term })"
  :tag-separator="/;/"
/>
```

### Custom Local Search

The built-in local search is case-insensitive, supports several words separated by spaces, and matches text typed with the wrong RU/EN keyboard layout.

```vue
<VueSelect
  v-model="value"
  :options="options"
  :search-function="(term) => (item) =>
    item.text.toLowerCase().startsWith(term.toLowerCase())
  "
/>
```

### Cache

Use `cache` when the selected value is already known but the full option list is loaded from the server. This lets the component render the selected label immediately.

```vue
<script setup>
import { ref } from 'vue'

const selected = ref('42')
const initialCache = [
  { id: '42', text: 'Jane Cooper' },
  { id: '99', text: 'Wade Warren' },
]

const searchRemote = ({ term, page }, callback) => {
  fetch(`/api/users?q=${encodeURIComponent(term)}&page=${page}`)
    .then(response => response.json())
    .then(data => callback({
      results: data.items,
      pagination: { more: data.more },
    }))
}
</script>

<template>
  <VueSelect
    v-model="selected"
    :options="[]"
    :cache="initialCache"
    :query-function="searchRemote"
    @cache="cache => localStorage.setItem('select-cache', JSON.stringify(cache))"
  />
</template>
```

### States And Forms

```vue
<VueSelect v-model="value" :options="options" :disabled="true" />

<VueSelect v-model="value" :options="options" :has-error="true" />

<form method="POST" action="/save">
  <VueSelect
    v-model="cityId"
    :options="cities"
    name="city_id"
    placeholder="Select a city..."
  />
  <button type="submit">Save</button>
</form>
```

When `name` is set, the component renders a hidden native `<select>` so the value is submitted by regular HTML forms.

## Localization

When `window.locale` is not set, Russian is used:

```vue
<VueSelect v-model="value" :options="options" />
```

Use English:

```vue
<VueSelect v-model="value" :options="options" lang="en" />
```

Use custom phrases:

```vue
<VueSelect
  v-model="value"
  :options="options"
  :lang="{
    noResults: () => 'Nothing found',
    searching: () => 'Loading...',
    clear: () => 'Clear value',
  }"
/>
```

## Keyboard Navigation

| Key | Action |
|---|---|
| `Enter` / `Space` / `ArrowDown` | Open the dropdown when the control is focused. |
| `Escape` | Close the dropdown. |
| `ArrowDown` / `ArrowUp` | Move between options. |
| `Enter` | Select the focused option. |
| `Backspace` | Remove the last selected tag in multiple mode when the search input is empty. |

## Demos

The demo files can be opened directly in a browser:

| File | Description |
|---|---|
| `demo.html` | Main demo: single, multiple, groups, async pagination, tags, tokenizer, states. |
| `demo2.html` | Stress demo: single and multiple selection with 4,020 records. |

## Testing

```bash
npm install
npm test
npm run test:watch
```

The test suite covers rendering, dropdown behavior, single and multiple selection, filtering, tag creation, grouping, async search, keyboard navigation, pagination, and cache behavior.

## Migrating From Select2

### v-model

```html
<!-- Before: jQuery Select2 / Vue 2 style -->
<vue-select :value="val" @input="val = $event" />

<!-- After: Vue 3 -->
<VueSelect v-model="val" />
```

### Async Search

```js
// Before: Select2 ajax config
ajax: {
  url: '/api/search',
  data: params => ({ q: params.term, page: params.page }),
  processResults: data => ({
    results: data.items,
    pagination: { more: data.more },
  }),
}

// After: VueSelect
const queryFunction = ({ term, page }, callback) => {
  fetch(`/api/search?q=${encodeURIComponent(term)}&page=${page}`)
    .then(response => response.json())
    .then(data => callback({
      results: data.items,
      pagination: { more: data.more },
    }))
}
```

### Tags

```js
// Before: Select2
createTag: params => ({ id: params.term, text: params.term, newTag: true })

// After: VueSelect
const createTag = ({ term }) => ({ id: term, text: term })
```

### Mapping

| Select2 | VueSelect | Notes |
|---|---|---|
| `value` + `@input` | `v-model` | Vue 3 model binding. |
| `ajax` | `queryFunction` | Callback-based async search. |
| `tags: true` | `createTag` | Return `null` to reject a tag. |
| `tokenSeparators` | `tagSeparator` | Use a `RegExp` instead of an array. |
| `data` | `options` | Static local data. |
| `allowClear` | `allowClear` | `:allow-clear="false"` hides the clear button. |
| `disabled` | `disabled` | Same behavior. |
| `language` | `lang` | Use `'en'`, `'ru'`, or a custom phrase object. |
| `minimumInputLength` | custom `queryFunction` logic | Gate remote requests inside your query function. |
| `templateResult` | CSS customization | Customize presentation through classes and CSS. |
| `dropdownParent` | not needed | The dropdown is rendered inside the component. |
