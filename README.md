# VueSelect

Компонент выпадающего списка на **Vue 3** (Composition API / `<script setup>`).  
Полная замена jQuery + select2 — без сторонних зависимостей кроме lodash-es.

---

## Содержание

- [Возможности](#возможности)
- [Подключение](#подключение)
- [Пропсы](#пропсы)
- [События](#события)
- [Структура опций](#структура-опций)
- [Примеры использования](#примеры-использования)
  - [Одиночный выбор](#1-одиночный-выбор)
  - [Множественный выбор](#2-множественный-выбор)
  - [Группировка опций](#3-группировка-опций)
  - [Асинхронный поиск](#4-асинхронный-поиск-queryfunction)
  - [Создание тегов](#5-создание-тегов-createtag)
  - [Токенайзер](#6-токенайзер)
  - [Кастомный поиск](#7-кастомный-поиск-searchfunction)
  - [Кэш](#8-кэш)
  - [Состояния](#9-состояния-disabled--has-error)
  - [Совместимость с формами](#10-совместимость-с-формами-name)
  - [Кастомный язык](#кастомный-язык)
- [Клавиатурная навигация](#клавиатурная-навигация)
- [Демо](#демо)
- [Тесты](#тесты)
- [Миграция с select2](#миграция-с-select2)

---

## Возможности

- `v-model` — одиночный и множественный выбор
- Фильтрация с переключением раскладки клавиатуры (RU ↔ EN)
- Кастомная функция поиска (`searchFunction`)
- Асинхронный поиск с пагинацией (`queryFunction`)
- Группировка опций (optgroup через `children`)
- Создание произвольных тегов (`createTag`)
- Токенайзер — авто-разбивка по символу-разделителю
- Пагинация при прокрутке (IntersectionObserver, 20 элементов за раз)
- Кэш уже загруженных данных
- Совместимость с HTML-формами (скрытый `<select>`)
- Стили под Bootstrap 3
- Полная клавиатурная навигация

---

## Подключение

### В Vue SFC-проекте (Vite / Webpack)

```vue
<script setup>
import VueSelect from '@/components/VueSelect.vue'
</script>
```

### Глобальная регистрация

```js
// main.js
import { createApp } from 'vue'
import VueSelect from './components/VueSelect.vue'
import App from './App.vue'

createApp(App)
  .component('VueSelect', VueSelect)
  .mount('#app')
```

### Без сборки (CDN, plain HTML)

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
  // Компонент определяется как объект с полем template
  // Готовые примеры — demo.html и demo2.html в репозитории
</script>
```

---

## Пропсы

| Пропс | Тип | По умолчанию | Описание |
|---|---|---|---|
| `modelValue` | `String \| Number \| Array` | `null` | Выбранное значение (v-model) |
| `options` | `Array` | `[]` | Массив опций `{ id, text }` |
| `multiple` | `Boolean` | `false` | Режим множественного выбора |
| `placeholder` | `String` | `''` | Текст-заглушка при пустом значении |
| `disabled` | `Boolean` | `false` | Отключает компонент |
| `hasError` | `Boolean` | `false` | Добавляет класс `has-error` (красная рамка) |
| `name` | `String` | `null` | Имя для скрытого `<select>` (HTML-формы) |
| `selectClass` | `String \| Object` | `''` | Дополнительный класс для элемента контрола |
| `searchFunction` | `Function` | встроенная | Функция фильтрации: `(term) => (item) => Boolean` |
| `queryFunction` | `Function` | `null` | Асинхронный поиск: `({ term, page }, callback) => void` |
| `createTag` | `Function` | `null` | Создание тега: `({ term }) => { id, text } \| null` |
| `tagSeparator` | `RegExp` | `/[^\d\wа-яё]/iu` | Разделитель для токенайзера |
| `cache` | `Array` | `null` | Начальный кэш (если отличается от `options`) |
| `isDefaultFromCache` | `Boolean` | `false` | Фильтровать по кэшу, а не по `options` |
| `minimumResultsForSearch` | `Number` | `0` | Мин. количество опций для показа поля поиска |
| `lang` | `String \| Object` | `'ru'` | Язык: `'ru'`, `'en'` или объект с фразами |

---

## События

| Событие | Payload | Описание |
|---|---|---|
| `update:modelValue` | `id \| id[]` | Изменение выбранного значения (v-model) |
| `cache` | `Array` | Кэш обновился — новые опции загружены или добавлены |

---

## Структура опций

### Плоский список

```js
const options = [
  { id: '1', text: 'Москва' },
  { id: '2', text: 'Санкт-Петербург' },
  { id: '3', text: 'Казань' },
]
```

> `id` может быть строкой или числом — при сравнении всегда приводится к строке.

### С группировкой

```js
const options = [
  {
    text: 'Европа',       // заголовок группы, id не нужен
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

---

## Примеры использования

### 1. Одиночный выбор

```vue
<script setup>
import { ref } from 'vue'
import VueSelect from '@/components/VueSelect.vue'

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
    placeholder="Выберите город..."
  />
  <!-- city === 'msk' после выбора -->
</template>
```

---

### 2. Множественный выбор

```vue
<script setup>
import { ref } from 'vue'

const selected = ref([])
const options = [
  { id: '1', text: 'Vue' },
  { id: '2', text: 'React' },
  { id: '3', text: 'Angular' },
]
</script>

<template>
  <VueSelect
    v-model="selected"
    :options="options"
    :multiple="true"
    placeholder="Выберите фреймворки..."
  />
  <!-- selected === ['1', '3'] после выбора двух -->
</template>
```

---

### 3. Группировка опций

```vue
<script setup>
import { ref } from 'vue'

const country = ref(null)
const countries = [
  {
    text: 'Европа',
    children: [
      { id: 'de', text: 'Германия' },
      { id: 'fr', text: 'Франция' },
      { id: 'it', text: 'Италия' },
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
</script>

<template>
  <VueSelect
    v-model="country"
    :options="countries"
    placeholder="Выберите страну..."
  />
</template>
```

> При поиске группы с нулевым числом совпадений скрываются автоматически.

---

### 4. Асинхронный поиск (queryFunction)

`queryFunction` вызывается при каждом изменении строки поиска (с дебаунсом 250 мс).  
Получает `{ term, page }` и колбэк, в который передаются `{ results, pagination }`.

```vue
<script setup>
import { ref } from 'vue'

const user = ref(null)

const searchUsers = ({ term, page }, callback) => {
  fetch(`/api/users?q=${encodeURIComponent(term)}&page=${page}`)
    .then(r => r.json())
    .then(data => callback({
      results:    data.items,              // [{ id, text }, ...]
      pagination: { more: data.has_more }, // true — подгрузить следующую страницу
    }))
}
</script>

<template>
  <VueSelect
    v-model="user"
    :options="[]"
    :query-function="searchUsers"
    placeholder="Начните вводить имя..."
  />
</template>
```

> При пустом поиске `queryFunction` **не вызывается** — показываются данные из `options` / кэша.  
> Прокрутка до конца списка автоматически запрашивает следующую страницу (`page++`).

---

### 5. Создание тегов (createTag)

`createTag` должна вернуть `{ id, text }` или `null` (чтобы скрыть опцию создания).

```vue
<script setup>
import { ref } from 'vue'

const tags = ref([])

const createTag = ({ term }) => {
  const t = term.trim()
  return t ? { id: `tag:${t}`, text: t } : null
}
</script>

<template>
  <VueSelect
    v-model="tags"
    :options="[]"
    :multiple="true"
    :create-tag="createTag"
    placeholder="Введите тег и нажмите Enter..."
  />
</template>
```

---

### 6. Токенайзер

Когда задан `createTag`, компонент автоматически разбивает строку по разделителю.  
По умолчанию разделитель — любой не-буквенный символ (запятая, пробел, точка с запятой и т.д.).

```vue
<!-- Ввод «vue, react, angular» — создаст сразу три тега -->
<VueSelect
  v-model="tags"
  :options="[]"
  :multiple="true"
  :create-tag="({ term }) => ({ id: term, text: term })"
/>

<!-- Только точка с запятой как разделитель -->
<VueSelect
  v-model="tags"
  :options="[]"
  :multiple="true"
  :create-tag="({ term }) => ({ id: term, text: term })"
  :tag-separator="/;/"
/>
```

---

### 7. Кастомный поиск (searchFunction)

Встроенная функция поиска нечувствительна к регистру, поддерживает несколько слов через пробел и переключение раскладки клавиатуры RU ↔ EN.

```vue
<!-- Поиск только по началу строки -->
<VueSelect
  v-model="value"
  :options="options"
  :search-function="(term) => (item) =>
    item.text.toLowerCase().startsWith(term.toLowerCase())
  "
/>
```

```vue
<!-- Поиск сразу по нескольким полям (объединённым в text) -->
<!-- options: [{ id: 1, text: 'Иванов Иван — Бухгалтерия' }] -->
<VueSelect
  v-model="value"
  :options="employees"
  :search-function="(term) => (item) =>
    item.text.toLowerCase().includes(term.toLowerCase())
  "
/>
```

---

### 8. Кэш

Используется когда список загружается с сервера, а начальное выбранное значение уже известно — чтобы сразу отобразить текст без дополнительного запроса.

```vue
<script setup>
import { ref } from 'vue'

// Заранее известные записи — чтобы показать label при монтировании
const initialCache = [
  { id: '42', text: 'Иванов Иван' },
  { id: '99', text: 'Петров Пётр' },
]
const selected = ref('42') // будет показан 'Иванов Иван' сразу

const searchRemote = ({ term, page }, callback) => {
  /* ... запрос к API ... */
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

> Событие `@cache` срабатывает при каждом обновлении кэша — удобно для сохранения между сессиями.

---

### 9. Состояния (disabled / has-error)

```vue
<!-- Заблокированный -->
<VueSelect v-model="value" :options="options" :disabled="true" />

<!-- Ошибка валидации -->
<VueSelect v-model="value" :options="options" :has-error="true" />

<!-- Интеграция с Bootstrap 3 form-group -->
<div class="form-group" :class="{ 'has-error': errors.city }">
  <label class="control-label">Город</label>
  <VueSelect
    v-model="form.city"
    :options="cities"
    :has-error="!!errors.city"
    placeholder="Выберите город..."
  />
  <span v-if="errors.city" class="help-block">{{ errors.city }}</span>
</div>
```

---

### 10. Совместимость с формами (name)

При указании `name` компонент рендерит скрытый нативный `<select>` — форма отправляется стандартным способом.

```vue
<form method="POST" action="/save">
  <VueSelect
    v-model="cityId"
    :options="cities"
    name="city_id"
    placeholder="Выберите город..."
  />
  <!-- <select name="city_id" style="display:none"> рендерится автоматически -->
  <button type="submit">Сохранить</button>
</form>
```

---

### Кастомный язык

```vue
<!-- Английский -->
<VueSelect v-model="value" :options="options" lang="en" />

<!-- Произвольные фразы -->
<VueSelect
  v-model="value"
  :options="options"
  :lang="{
    noResults: () => 'Ничего не найдено',
    searching: () => 'Загружаю...',
  }"
/>
```

---

## Клавиатурная навигация

| Клавиша | Действие |
|---|---|
| `Enter` / `Space` / `↓` | Открыть список (фокус на контроле) |
| `Escape` | Закрыть список |
| `↓` / `↑` | Перемещение по опциям |
| `Enter` | Выбрать сфокусированную опцию |
| `Backspace` | Удалить последний тег (multiple, поле поиска пустое) |

---

## Демо

Все файлы открываются напрямую в браузере — сборка не нужна.

| Файл | Описание |
|---|---|
| `demo.html` | Все режимы: одиночный, множественный, группы, async + пагинация, теги + токенайзер, состояния |
| `demo2.html` | Стресс-тест: одиночный и множественный выбор на **4 020 записях** |

---

## Тесты

```bash
npm install        # установить зависимости
npm test           # запустить 56 тестов
npm run test:watch # watch-режим
```

Покрытие тестами:

| Группа | Что проверяется |
|---|---|
| Rendering | Placeholder, selected value/tags, has-error, disabled, native select |
| Dropdown | Открытие/закрытие, Escape, клик снаружи, noResults |
| Single selection | Emit, закрытие после выбора, кнопка очистки |
| Multiple selection | Добавление, снятие, удаление тегов, Backspace, clearAll |
| Search filtering | Дебаунс 250 мс, noResults, кастомный searchFunction |
| Tag creation | Показ опции тега, выбор, createTag=null, токенайзер |
| Option grouping | Лейблы групп, дочерние элементы, фильтрация, скрытие пустых групп |
| queryFunction | Вызов с term+page, результаты в DOM, loading-статус, cache emit |
| Keyboard nav | ArrowDown/Up, Enter, Escape, Space |
| Pagination | Создание IntersectionObserver, загрузка страницы 2, добавление к списку |
| Cache | Инициализация из options и cache prop, обновление при смене props |

---

## Миграция с select2

### v-model

```html
<!-- Было (jQuery select2 / Vue 2) -->
<vue-select :value="val" @input="val = $event" />

<!-- Стало (Vue 3) -->
<VueSelect v-model="val" />
```

### queryFunction

```js
// Было (select2 ajax config)
ajax: {
  url: '/api/search',
  data: (params) => ({ q: params.term, page: params.page }),
  processResults: (data) => ({
    results:    data.items,
    pagination: { more: data.more },
  }),
}

// Стало
const queryFunction = ({ term, page }, callback) => {
  fetch(`/api/search?q=${term}&page=${page}`)
    .then(r => r.json())
    .then(data => callback({
      results:    data.items,
      pagination: { more: data.more },
    }))
}
```

### createTag

```js
// Было (select2)
createTag: (params) => ({ id: params.term, text: params.term, newTag: true })

// Стало
const createTag = ({ term }) => ({ id: term, text: term })
```

### Таблица соответствий

| select2 | VueSelect | Примечание |
|---|---|---|
| `value` + `@input` | `v-model` | |
| `ajax` | `queryFunction` | |
| `tags: true` | `createTag` | |
| `tokenSeparators` | `tagSeparator` | RegExp вместо массива символов |
| `data` | `options` | |
| `allowClear` | — | Кнопка `×` появляется автоматически |
| `disabled` | `disabled` | |
| `language` | `lang` | Строка `'ru'`/`'en'` или объект фраз |
| `minimumInputLength` | логика в `queryFunction` | |
| `templateResult` | — | Кастомизация через CSS-классы |
| `dropdownParent` | — | Не нужен |
