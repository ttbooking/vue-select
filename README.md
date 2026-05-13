# VueSelect

[English documentation](README.en.md)

Компонент выпадающего списка на **Vue 3** (Composition API / `<script setup>`). Полная замена jQuery + Select2 без сторонних runtime-зависимостей, кроме `lodash-es`.

По умолчанию компонент берёт язык из `window.locale` и нормализует его до базового кода (`ru-RU` -> `ru`, `en-US` -> `en`). Если глобальная локаль не задана или не поддерживается, используется русский язык. Английский интерфейс можно включить явно через `lang="en"` или через объект с собственными фразами.

## Содержание

- [Возможности](#возможности)
- [Установка](#установка)
- [Использование](#использование)
- [Пропсы](#пропсы)
- [События](#события)
- [Структура опций](#структура-опций)
- [Примеры](#примеры)
- [Локализация](#локализация)
- [Клавиатурная навигация](#клавиатурная-навигация)
- [Демо](#демо)
- [Тесты](#тесты)
- [Миграция с Select2](#миграция-с-select2)

## Возможности

- `v-model` для одиночного и множественного выбора
- Фильтрация с переключением раскладки клавиатуры RU <-> EN
- Кастомная функция поиска через `searchFunction`
- Асинхронный поиск с пагинацией через `queryFunction`
- Группировка опций через `children`
- Создание произвольных тегов через `createTag`
- Токенайзер для создания нескольких тегов из одной строки
- Пагинация при прокрутке через `IntersectionObserver`
- Кэш уже загруженных или заранее известных опций
- Совместимость с HTML-формами через скрытый `<select>`
- Стили под Bootstrap 3
- Полная клавиатурная навигация
- Автоопределение языка через `window.locale` с русским fallback

## Установка

```bash
npm install @ttbooking/vue-select
```

Подключите компонент и стили:

```vue
<script setup>
import VueSelect from '@ttbooking/vue-select'
import '@ttbooking/vue-select/style.css'
</script>
```

Глобальная регистрация:

```js
import { createApp } from 'vue'
import VueSelect from '@ttbooking/vue-select'
import '@ttbooking/vue-select/style.css'
import App from './App.vue'

createApp(App)
  .component('VueSelect', VueSelect)
  .mount('#app')
```

## Использование

```vue
<script setup>
import { ref } from 'vue'
import VueSelect from '@ttbooking/vue-select'
import '@ttbooking/vue-select/style.css'

const city = ref(null)
const cities = [
  { id: 'msk', text: 'Москва' },
  { id: 'spb', text: 'Санкт-Петербург' },
  { id: 'nsk', text: 'Новосибирск' },
]
</script>

<template>
  <VueSelect
    v-model="city"
    :options="cities"
    lang="ru"
    placeholder="Выберите город..."
  />
</template>
```

## Пропсы

| Пропс | Тип | По умолчанию | Описание |
|---|---|---|---|
| `modelValue` | `String \| Number \| Array` | `null` | Выбранное значение для `v-model`. Для одиночного режима используется скаляр, для множественного - массив. |
| `options` | `Array` | `[]` | Массив опций `{ id, text }` или групп `{ text, children }`. |
| `multiple` | `Boolean` | `false` | Включает множественный выбор. |
| `placeholder` | `String` | `''` | Текст-заглушка при пустом значении. |
| `disabled` | `Boolean` | `false` | Отключает компонент. |
| `allowClear` | `Boolean` | `true` | Показывает кнопку очистки, когда значение выбрано. |
| `hasError` | `Boolean` | `false` | Добавляет класс `has-error` для Bootstrap 3 validation styles. |
| `name` | `String` | `null` | Имя скрытого нативного `<select>` для отправки обычной HTML-формы. |
| `selectClass` | `String \| Object` | `''` | Дополнительный класс или объект классов для основного контрола. |
| `searchFunction` | `Function` | встроенная | Фабрика локального поиска: `(term) => (item) => Boolean`. |
| `queryFunction` | `Function` | `null` | Асинхронный поиск: `({ term, page }, callback) => void`. |
| `createTag` | `Function` | `null` | Создание тега: `({ term }) => { id, text } \| null`. |
| `tagSeparator` | `RegExp` | `/[^\d\wа-яё]/iu` | Разделитель для токенайзера. |
| `cache` | `Array` | `null` | Начальный кэш опций. Удобно, когда выбранное значение уже известно. |
| `isDefaultFromCache` | `Boolean` | `false` | Если `true`, пустой локальный поиск идёт по кэшу, а не по `options`. |
| `minimumResultsForSearch` | `Number` | `0` | Минимальное число опций, при котором показывается поле поиска. |
| `lang` | `String \| Object` | `window.locale` или `'ru'` | Язык интерфейса: `'ru'`, `'en'` или объект с фразами. |

## События

| Событие | Payload | Описание |
|---|---|---|
| `update:modelValue` | `id \| id[] \| null` | Изменение выбранного значения. |
| `cache` | `Array` | Внутренний кэш был обновлён. |
| `search` | `String` | Изменение строки поиска. |

## Структура опций

Плоский список:

```js
const options = [
  { id: '1', text: 'Москва' },
  { id: '2', text: 'Санкт-Петербург' },
  { id: '3', text: 'Казань' },
]
```

Группировка:

```js
const options = [
  {
    text: 'Европа',
    children: [
      { id: 'de', text: 'Германия' },
      { id: 'fr', text: 'Франция' },
    ],
  },
  {
    text: 'Азия',
    children: [
      { id: 'cn', text: 'Китай' },
      { id: 'jp', text: 'Япония' },
    ],
  },
]
```

`id` может быть строкой или числом. При сравнении значения приводятся к строке.

## Примеры

### Одиночный выбор

```vue
<script setup>
import { ref } from 'vue'

const city = ref(null)
const cities = [
  { id: 'msk', text: 'Москва' },
  { id: 'spb', text: 'Санкт-Петербург' },
  { id: 'nsk', text: 'Новосибирск' },
]
</script>

<template>
  <VueSelect
    v-model="city"
    :options="cities"
    lang="ru"
    placeholder="Выберите город..."
  />
</template>
```

### Множественный выбор

```vue
<script setup>
import { ref } from 'vue'

const selected = ref([])
const options = [
  { id: 'vue', text: 'Vue' },
  { id: 'react', text: 'React' },
  { id: 'angular', text: 'Angular' },
]
</script>

<template>
  <VueSelect
    v-model="selected"
    :options="options"
    :multiple="true"
    lang="ru"
    placeholder="Выберите фреймворки..."
  />
</template>
```

### Асинхронный поиск

`queryFunction` вызывается после debounce 250 мс при изменении строки поиска. Функция получает `{ term, page }` и должна вызвать callback с `{ results, pagination }`.

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
    lang="ru"
    placeholder="Начните вводить имя..."
  />
</template>
```

При пустой строке поиска `queryFunction` не вызывается. Компонент показывает локальные `options` или данные из кэша. При прокрутке до конца dropdown запрашивается следующая страница.

### Создание тегов

`createTag` должна вернуть `{ id, text }` для создания тега или `null`, чтобы скрыть опцию создания.

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
    lang="ru"
    placeholder="Введите тег и нажмите Enter..."
  />
</template>
```

### Токенайзер

Когда задан `createTag`, компонент может разбивать ввод по `tagSeparator` и создавать несколько тегов сразу.

```vue
<!-- Ввод "vue, react, angular" создаст три тега. -->
<VueSelect
  v-model="tags"
  :options="[]"
  :multiple="true"
  :create-tag="({ term }) => ({ id: term, text: term })"
/>

<!-- Только точка с запятой как разделитель. -->
<VueSelect
  v-model="tags"
  :options="[]"
  :multiple="true"
  :create-tag="({ term }) => ({ id: term, text: term })"
  :tag-separator="/;/"
/>
```

### Кастомный локальный поиск

Встроенный поиск нечувствителен к регистру, поддерживает несколько слов через пробел и учитывает ввод в неправильной RU/EN раскладке.

```vue
<VueSelect
  v-model="value"
  :options="options"
  :search-function="(term) => (item) =>
    item.text.toLowerCase().startsWith(term.toLowerCase())
  "
/>
```

### Кэш

`cache` используется, когда список загружается с сервера, а начальное выбранное значение уже известно. Так компонент сразу показывает label без дополнительного запроса.

```vue
<script setup>
import { ref } from 'vue'

const selected = ref('42')
const initialCache = [
  { id: '42', text: 'Иванов Иван' },
  { id: '99', text: 'Петров Пётр' },
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
    lang="ru"
    @cache="cache => localStorage.setItem('select-cache', JSON.stringify(cache))"
  />
</template>
```

### Состояния и формы

```vue
<VueSelect v-model="value" :options="options" :disabled="true" />

<VueSelect v-model="value" :options="options" :has-error="true" />

<form method="POST" action="/save">
  <VueSelect
    v-model="cityId"
    :options="cities"
    name="city_id"
    lang="ru"
    placeholder="Выберите город..."
  />
  <button type="submit">Сохранить</button>
</form>
```

Если указан `name`, компонент рендерит скрытый нативный `<select>`, поэтому значение отправляется обычной HTML-формой.

## Локализация

Если `window.locale` не задан, используется русский язык:

```vue
<VueSelect v-model="value" :options="options" />
```

Английский язык:

```vue
<VueSelect v-model="value" :options="options" lang="en" />
```

Собственные фразы:

```vue
<VueSelect
  v-model="value"
  :options="options"
  :lang="{
    noResults: () => 'Ничего не найдено',
    searching: () => 'Загружаю...',
    clear: () => 'Очистить значение',
  }"
/>
```

## Клавиатурная навигация

| Клавиша | Действие |
|---|---|
| `Enter` / `Space` / `ArrowDown` | Открыть список, когда фокус на контроле. |
| `Escape` | Закрыть список. |
| `ArrowDown` / `ArrowUp` | Перемещение по опциям. |
| `Enter` | Выбрать сфокусированную опцию. |
| `Backspace` | Удалить последний тег в multiple-режиме, когда поле поиска пустое. |

## Демо

Файлы можно открыть напрямую в браузере:

| Файл | Описание |
|---|---|
| `demo.html` | Основные режимы: одиночный, множественный, группы, async + пагинация, теги, токенайзер, состояния. |
| `demo2.html` | Стресс-тест: одиночный и множественный выбор на 4 020 записях. |

## Тесты

```bash
npm install
npm test
npm run test:watch
```

Тесты покрывают rendering, dropdown, одиночный и множественный выбор, фильтрацию, создание тегов, группы, async search, клавиатурную навигацию, пагинацию и кэш.

## Миграция с Select2

### v-model

```html
<!-- Было: jQuery Select2 / Vue 2 style -->
<vue-select :value="val" @input="val = $event" />

<!-- Стало: Vue 3 -->
<VueSelect v-model="val" />
```

### Async search

```js
// Было: Select2 ajax config
ajax: {
  url: '/api/search',
  data: params => ({ q: params.term, page: params.page }),
  processResults: data => ({
    results: data.items,
    pagination: { more: data.more },
  }),
}

// Стало: VueSelect
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
// Было: Select2
createTag: params => ({ id: params.term, text: params.term, newTag: true })

// Стало: VueSelect
const createTag = ({ term }) => ({ id: term, text: term })
```

### Таблица соответствий

| Select2 | VueSelect | Примечание |
|---|---|---|
| `value` + `@input` | `v-model` | Vue 3 model binding. |
| `ajax` | `queryFunction` | Callback-based async search. |
| `tags: true` | `createTag` | Верните `null`, чтобы отклонить тег. |
| `tokenSeparators` | `tagSeparator` | Используется `RegExp`, а не массив символов. |
| `data` | `options` | Статические локальные данные. |
| `allowClear` | `allowClear` | `:allow-clear="false"` скрывает кнопку очистки. |
| `disabled` | `disabled` | Такое же поведение. |
| `language` | `lang` | `'en'`, `'ru'` или объект с фразами. |
| `minimumInputLength` | логика в `queryFunction` | Ограничивайте запросы внутри своей функции. |
| `templateResult` | CSS customization | Кастомизация через классы и CSS. |
| `dropdownParent` | не нужен | Dropdown рендерится внутри компонента. |
