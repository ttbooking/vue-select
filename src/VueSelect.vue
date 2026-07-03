<template>
    <div class="vue-select" :class="{ 'vue-select--open': isOpen, 'vue-select--disabled': disabled, 'has-error': hasError }" ref="containerRef">
        <!-- Скрытый нативный select для совместимости с формами -->
        <select
            v-if="name"
            :name="name"
            :multiple="multiple"
            style="display: none"
            :disabled="disabled"
            :id="'id-' + name"
        >
            <option
                v-for="item in selectedItems"
                :key="item.id"
                :value="item.id"
                selected
            >{{ item.text }}</option>
        </select>

        <!-- Основной элемент выбора -->
        <div
            class="vue-select__control"
            :class="[selectClass, { 'vue-select__control--focus': isOpen }]"
            @pointerdown.prevent="!disabled && toggleDropdown()"
            @click="onControlClick"
            @keydown="onControlKeydown"
            :tabindex="disabled ? -1 : 0"
            role="combobox"
            :aria-expanded="isOpen"
            aria-haspopup="listbox"
        >
            <!-- Выбранные значения -->
            <div class="vue-select__value-container">
                <template v-if="multiple">
                    <span
                        v-for="item in selectedItems"
                        :key="item.id"
                        class="vue-select__tag"
                        :class="{ 'vue-select__tag--created': item.isTag }"
                    >
                        <span class="vue-select__tag-text">{{ item.text }}</span>
                        <span
                            class="vue-select__tag-remove"
                            @pointerdown.stop.prevent="removeItem(item)"
                        >&times;</span>
                    </span>
                    <input
                        v-if="isOpen || selectedItems.length === 0"
                        ref="searchInputRef"
                        class="vue-select__search"
                        v-model="searchTerm"
                        @input="onSearchInput"
                        @keydown="onSearchKeydown"
                        @blur="onSearchBlur"
                        :placeholder="selectedItems.length === 0 ? '' : ''"
                        autocomplete="off"
                    />
                </template>
                <template v-else>
                    <span v-if="!isOpen && selectedItems.length > 0" class="vue-select__single-value">
                        {{ selectedItems[0]?.text }}
                    </span>
                    <input
                        v-show="isOpen && showSearchInput"
                        ref="searchInputRef"
                        class="vue-select__search vue-select__search--single"
                        v-model="searchTerm"
                        @input="onSearchInput"
                        @keydown="onSearchKeydown"
                        @blur="onSearchBlur"
                        autocomplete="off"
                    />
                    <span
                        v-if="!isOpen && selectedItems.length === 0"
                        class="vue-select__placeholder"
                    >{{ placeholder }}</span>
                </template>
            </div>

            <!-- Кнопки справа -->
            <div class="vue-select__indicators">
                <span
                    v-if="allowClear && !disabled && (multiple ? selectedItems.length > 0 : modelValue !== null && modelValue !== '')"
                    class="vue-select__clear"
                    @pointerdown.stop.prevent="clearAll"
                    :title="phrases.clear()"
                >&times;</span>
                <span class="vue-select__separator"></span>
                <span class="vue-select__arrow" :class="{ 'vue-select__arrow--up': isOpen }">&#9660;</span>
            </div>
        </div>

        <!-- Выпадающий список -->
        <div
            v-show="isOpen"
            class="vue-select__dropdown"
            ref="dropdownRef"
            role="listbox"
            :aria-multiselectable="multiple"
        >
            <!-- Статусные сообщения -->
            <div v-if="isLoading" class="vue-select__status">
                {{ phrases.searching() }}
            </div>
            <div v-else-if="filteredOptions.length === 0" class="vue-select__status">
                {{ phrases.noResults() }}
            </div>

            <!-- Список опций -->
            <template v-else>
                <template v-for="option in filteredOptions" :key="option.id ?? option.text">
                    <!-- Группа -->
                    <template v-if="option.children">
                        <div class="vue-select__group-label">{{ option.text }}</div>
                        <div
                            v-for="child in option.children"
                            :key="child.id"
                            class="vue-select__option vue-select__option--group-child"
                            :class="{
                                'vue-select__option--selected': isSelected(child),
                                'vue-select__option--focused': focusedIndex === getFlatIndex(option, child),
                                'vue-select__option--tag': child.isTag,
                            }"
                            @pointerdown.stop.prevent="selectOption(child)"
                            @click.stop="onOptionClick($event, child)"
                            @mouseenter="focusedIndex = getFlatIndex(option, child)"
                            role="option"
                            :aria-selected="isSelected(child)"
                        >{{ child.text }}</div>
                    </template>

                    <!-- Обычная опция -->
                    <div
                        v-else
                        class="vue-select__option"
                        :class="{
                            'vue-select__option--selected': isSelected(option),
                            'vue-select__option--focused': focusedIndex === getFlatIndexSimple(option),
                            'vue-select__option--tag': option.isTag,
                        }"
                        @pointerdown.stop.prevent="selectOption(option)"
                        @click.stop="onOptionClick($event, option)"
                        @mouseenter="focusedIndex = getFlatIndexSimple(option)"
                        role="option"
                        :aria-selected="isSelected(option)"
                    >{{ option.text }}</div>
                </template>
            </template>

            <!-- Sentinel для пагинации -->
            <div ref="paginationSentinelRef" class="vue-select__pagination-sentinel"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { cloneDeep } from 'lodash-es';

// ─── Props ───────────────────────────────────────────────────────────────────

const props = defineProps({
    // v-model
    modelValue: {
        type: [String, Array, Number],
        default: null,
    },
    // Опции селектора, минимальный набор структуры - {id: '', text: ''}
    options: {
        type: Array,
        default: () => [],
    },
    // Класс для элемента управления
    selectClass: {
        type: [Object, String],
        default: '',
    },
    // Имя для селектора в форме
    name: {
        type: String,
        default: null,
    },
    // Функция поиска — применяется к каждому элементу
    searchFunction: {
        type: Function,
        default: (term) => (item) => {
            const switchKeyboard = (text) => {
                const map = {
                    Q:'Й',W:'Ц',E:'У',R:'К',T:'Е',Y:'Н',U:'Г',I:'Ш',O:'Щ',P:'З','{':'Х','}':'Ъ',
                    A:'Ф',S:'Ы',D:'В',F:'А',G:'П',H:'Р',J:'О',K:'Л',L:'Д',':':'Ж','"':'Э',
                    Z:'Я',X:'Ч',C:'С',V:'М',B:'И',N:'Т',M:'Ь','<':'Б','>':'Ю','?':',',
                    q:'й',w:'ц',e:'у',r:'к',t:'е',y:'н',u:'г',i:'ш',o:'щ',p:'з','[':'х',']':'ъ',
                    a:'ф',s:'ы',d:'в',f:'а',g:'п',h:'р',j:'о',k:'л',l:'д',';':'ж',"'":'э',
                    z:'я',x:'ч',c:'с',v:'м',b:'и',n:'т',m:'ь',',':'б','.':'ю','/':'.',
                };
                return [...text].map(c => map[c] ?? c).join('');
            };
            const terms = (term || '').toLowerCase().split(/\s/).filter(Boolean);
            const text = item.text.toLowerCase();
            return terms.every(t => text.includes(t) || text.includes(switchKeyboard(t)));
        },
    },
    // Функция асинхронного поиска — должна вызвать callback({ results, pagination })
    queryFunction: {
        type: Function,
        default: null,
    },
    // Множественный выбор
    multiple: {
        type: Boolean,
        default: false,
    },
    // Минимальное кол-во символов для поиска (0 = всегда показывать)
    minimumResultsForSearch: {
        type: Number,
        default: 0,
    },
    // Начальный кэш данных
    cache: {
        type: Array,
        default: null,
    },
    // Разделитель тегов
    tagSeparator: {
        type: RegExp,
        default: () => /[^\d\wа-яё]/iu,
    },
    // Функция создания тега — аргумент {term}, результат {id, text} или null
    createTag: {
        type: Function,
        default: null,
    },
    // Искать по умолчанию из кэша (true) или из options (false)
    isDefaultFromCache: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    // Показывать кнопку очистки выбранного значения
    allowClear: {
        type: Boolean,
        default: true,
    },
    // Признак ошибки валидации (добавляет класс has-error)
    hasError: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
        default: '',
    },
    lang: {
        type: [String, Object],
        default: () => {
            const locale = typeof window !== 'undefined'
                ? window.locale?.toLowerCase()
                : null;
            return locale?.split('-')[0] || 'ru';
        },
    },
});

const emit = defineEmits(['update:modelValue', 'cache', 'search']);

// ─── State ───────────────────────────────────────────────────────────────────

const containerRef        = ref(null);
const dropdownRef         = ref(null);
const searchInputRef      = ref(null);
const paginationSentinelRef = ref(null);

const isOpen      = ref(false);
const searchTerm  = ref('');
const isLoading   = ref(false);
const focusedIndex = ref(-1);

// Кэш: содержит все известные опции (из props.cache, props.options и загруженные динамически)
const cacheData = ref(
    props.cache ? cloneDeep(props.cache) : cloneDeep(props.options)
);

// Пагинация
const currentPage   = ref(1);
const hasMorePages  = ref(false);
const PER_PAGE      = 20;

// Отображаемые опции (накапливаются при пагинации)
const displayedOptions = ref([]);

// ─── Computed ────────────────────────────────────────────────────────────────

const DEFAULT_PHRASES = {
    ru: { noResults: () => 'Совпадений не найдено', searching: () => 'Поиск ...', clear: () => 'Очистить' },
    en: { noResults: () => 'No results found', searching: () => 'Searching ...', clear: () => 'Clear' },
};

const phrases = computed(() => {
    if (props.lang && typeof props.lang === 'object') {
        return { ...DEFAULT_PHRASES.ru, ...props.lang };
    }

    return DEFAULT_PHRASES[props.lang] ?? DEFAULT_PHRASES.ru;
});

const countOptions = (items) => items.reduce(
    (count, item) => count + (item.children ? item.children.length : 1),
    0
);

const showSearchInput = computed(() => {
    if (props.multiple || props.createTag || props.queryFunction) return true;
    return countOptions(props.isDefaultFromCache ? cacheData.value : props.options) >= props.minimumResultsForSearch;
});

const selectedItems = computed(() => {
    const val = props.modelValue;
    if (val === null || val === undefined || val === '') return [];

    const ids = (Array.isArray(val) ? val : [val])
        .filter(v => v !== null && v !== undefined && v !== '')
        .map(v => String(v));

    const result = [];
    const visited = new Set();

    const tryAdd = (item) => {
        const sid = String(item.id);
        if (ids.includes(sid) && !visited.has(sid)) {
            visited.add(sid);
            result.push(item);
        }
    };

    for (const item of cacheData.value) {
        if (item.children) {
            item.children.forEach(tryAdd);
        } else {
            tryAdd(item);
        }
    }

    // Если не нашли в кэше — создаём заглушку чтобы не терять значение
    for (const id of ids) {
        if (!visited.has(id)) {
            result.push({ id, text: id });
        }
    }

    return result;
});

const filteredOptions = computed(() => displayedOptions.value);

// Плоский список всех опций для навигации с клавиатуры
const flatOptions = computed(() => {
    const flat = [];
    for (const opt of filteredOptions.value) {
        if (opt.children) {
            flat.push(...opt.children);
        } else {
            flat.push(opt);
        }
    }
    return flat;
});

// ─── Cache helpers ───────────────────────────────────────────────────────────

const mergeIntoCache = (items) => {
    let changed = false;

    for (const item of items) {
        if (item.children) {
            const group = cacheData.value.find(c => c.text === item.text && c.children);
            if (group) {
                for (const child of item.children) {
                    if (!group.children.find(c => String(c.id) === String(child.id))) {
                        group.children.push(child);
                        changed = true;
                    }
                }
            } else {
                cacheData.value.push(cloneDeep(item));
                changed = true;
            }
        } else {
            if (item.id !== undefined && !cacheData.value.find(c => !c.children && String(c.id) === String(item.id))) {
                cacheData.value.push(cloneDeep(item));
                changed = true;
            }
        }
    }

    if (changed) {
        emit('cache', cacheData.value);
    }
};

// ─── Search / Query ───────────────────────────────────────────────────────────

let searchDebounceTimer = null;
let searchRequestId = 0;

const applyLocalFilter = (term, page = 1) => {
    const source = cloneDeep(props.isDefaultFromCache ? cacheData.value : props.options);

    let filtered;
    if (term) {
        filtered = source.reduce((acc, opt) => {
            if (opt.children) {
                const children = opt.children.filter(props.searchFunction(term));
                if (children.length) acc.push({ ...opt, children });
            } else if (props.searchFunction(term)(opt)) {
                acc.push(opt);
            }
            return acc;
        }, []);
    } else {
        filtered = source;
    }

    const flat = [];
    filtered.forEach(o => o.children ? flat.push(...o.children) : flat.push(o));
    const total = flat.length;

    const offset = (page - 1) * PER_PAGE;
    const pageFlat = flat.slice(offset, offset + PER_PAGE);

    // Восстанавливаем группы для страницы
    const pageOptions = [];
    let flatIdx = 0;
    for (const opt of filtered) {
        if (opt.children) {
            const children = [];
            for (const child of opt.children) {
                if (pageFlat.find(p => String(p.id) === String(child.id))) children.push(child);
            }
            if (children.length) pageOptions.push({ ...opt, children });
        } else {
            if (pageFlat.find(p => String(p.id) === String(opt.id))) pageOptions.push(opt);
        }
    }

    return {
        results: pageOptions,
        pagination: { more: offset + PER_PAGE < total },
    };
};

const loadOptions = async (term = '', page = 1, append = false) => {
    const requestId = ++searchRequestId;

    if (!append) {
        displayedOptions.value = [];
    }
    isLoading.value = true;

    // Тег
    const tagResults = buildTagOption(term);

    const localData = applyLocalFilter(term, page);

    if (props.queryFunction && term) {
        // Асинхронный запрос
        await new Promise((resolve) => {
            props.queryFunction({ term, page }, (data) => {
                if (requestId !== searchRequestId) {
                    resolve();
                    return;
                }
                mergeIntoCache(data.results || []);
                const merged = mergeOptionLists(
                    tagResults,
                    mergeOptionLists(localData.results, data.results || [])
                );
                if (append) {
                    displayedOptions.value = mergeOptionLists(displayedOptions.value, merged);
                } else {
                    displayedOptions.value = merged;
                }
                hasMorePages.value = data.pagination?.more || localData.pagination.more;
                isLoading.value = false;
                resolve();
            });
        });
    } else {
        const merged = mergeOptionLists(tagResults, localData.results);
        if (append) {
            displayedOptions.value = mergeOptionLists(displayedOptions.value, merged);
        } else {
            displayedOptions.value = merged;
        }
        hasMorePages.value = localData.pagination.more;
        isLoading.value = false;
    }

    focusedIndex.value = -1;
};

// ─── Tag helpers ─────────────────────────────────────────────────────────────

const buildTagOption = (term) => {
    if (!props.createTag || !term) return [];
    const tag = props.createTag({ term });
    if (tag == null) return [];
    return [{ ...tag, isTag: true }];
};

// Очистить старые невыбранные теги из кэша
const removeOldTags = () => {
    const selectedIds = (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue])
        .filter(Boolean)
        .map(String);
    const nextCache = cacheData.value.filter(
        opt => !opt.isTag || selectedIds.includes(String(opt.id))
    );
    if (nextCache.length !== cacheData.value.length) {
        cacheData.value = nextCache;
        emit('cache', cacheData.value);
    }
};

// Tokenizer — разбивает term по разделителю и авто-добавляет теги
const processTokenizer = (term) => {
    if (!props.createTag || !term) return term;
    const parts = term.split(props.tagSeparator);
    if (parts.length <= 1) return term;

    for (let i = 0; i < parts.length - 1; i++) {
        const partTerm = parts[i].trim();
        if (!partTerm) continue;
        const tag = props.createTag({ term: partTerm });
        if (tag) {
            mergeIntoCache([{ ...tag, isTag: true }]);
            addValue(tag);
        }
    }
    return parts[parts.length - 1];
};

// ─── Options merge ────────────────────────────────────────────────────────────

const mergeOptionLists = (target, source) => {
    const result = cloneDeep(target);
    for (const item of source) {
        if (item.children) {
            const group = result.find(r => r.children && r.text === item.text);
            if (group) {
                for (const child of item.children) {
                    if (!group.children.find(c => String(c.id) === String(child.id))) {
                        group.children.push(child);
                    }
                }
            } else {
                result.push(cloneDeep(item));
            }
        } else {
            if (!result.find(r => !r.children && String(r.id) === String(item.id))) {
                result.push(cloneDeep(item));
            }
        }
    }
    return result;
};

// ─── Dropdown control ─────────────────────────────────────────────────────────

const openDropdown = async () => {
    if (isOpen.value || props.disabled) return;
    removeOldTags();
    currentPage.value = 1;
    searchTerm.value = '';
    isOpen.value = true;
    await loadOptions('', 1);
    await nextTick();
    searchInputRef.value?.focus();
    setupPaginationObserver();
};

const closeDropdown = () => {
    isOpen.value = false;
    searchTerm.value = '';
    focusedIndex.value = -1;
    searchRequestId++;
    destroyPaginationObserver();
};

const toggleDropdown = () => {
    isOpen.value ? closeDropdown() : openDropdown();
};

const isPointerClick = (event) => event.detail > 0;

const onControlClick = (event) => {
    if (props.disabled || isPointerClick(event)) return;
    toggleDropdown();
};

// ─── Pagination (IntersectionObserver) ────────────────────────────────────────

let paginationObserver = null;

const setupPaginationObserver = () => {
    destroyPaginationObserver();
    if (!paginationSentinelRef.value) return;
    paginationObserver = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasMorePages.value && !isLoading.value) {
            currentPage.value++;
            await loadOptions(searchTerm.value, currentPage.value, true);
        }
    }, { threshold: 0.1 });
    paginationObserver.observe(paginationSentinelRef.value);
};

const destroyPaginationObserver = () => {
    paginationObserver?.disconnect();
    paginationObserver = null;
};

// ─── Selection ────────────────────────────────────────────────────────────────

const isSelected = (option) => {
    const val = props.modelValue;
    if (val === null || val === undefined) return false;
    const id = String(option.id);
    if (Array.isArray(val)) return val.map(String).includes(id);
    return String(val) === id;
};

const addValue = (option) => {
    mergeIntoCache([option]);
    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        if (!current.map(String).includes(String(option.id))) {
            emit('update:modelValue', [...current, option.id]);
        }
    } else {
        emit('update:modelValue', option.id);
        closeDropdown();
    }
};

const selectOption = (option) => {
    if (isSelected(option) && props.multiple) {
        removeItem(option);
        return;
    }
    addValue(option);
    if (props.multiple) {
        searchTerm.value = '';
        loadOptions('', 1);
        nextTick(() => searchInputRef.value?.focus());
    }
};

const onOptionClick = (event, option) => {
    if (isPointerClick(event)) return;
    selectOption(option);
};

const removeItem = (option) => {
    if (props.multiple) {
        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        emit('update:modelValue', current.filter(v => String(v) !== String(option.id)));
    } else {
        emit('update:modelValue', null);
    }
};

const clearAll = () => {
    emit('update:modelValue', props.multiple ? [] : null);
};

// ─── Keyboard navigation ──────────────────────────────────────────────────────

const onControlKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
    }
    if (e.key === 'Escape') closeDropdown();
};

const onSearchKeydown = (e) => {
    if (e.key === 'Escape') { closeDropdown(); return; }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex.value = Math.min(focusedIndex.value + 1, flatOptions.value.length - 1);
        return;
    }
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
        return;
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        const focused = flatOptions.value[focusedIndex.value];
        if (focused) selectOption(focused);
        return;
    }
    if (e.key === 'Backspace' && !searchTerm.value && props.multiple) {
        const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
        if (current.length) {
            emit('update:modelValue', current.slice(0, -1));
        }
    }
};

const onSearchInput = async () => {
    emit('search', searchTerm.value);

    // Tokenizer
    const processed = processTokenizer(searchTerm.value);
    if (processed !== searchTerm.value) {
        searchTerm.value = processed;
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(async () => {
        currentPage.value = 1;
        removeOldTags();
        await loadOptions(searchTerm.value, 1);
        setupPaginationObserver();
    }, 250);
};

const onSearchBlur = () => {
    // Закрываем с задержкой — чтобы успел сработать клик по опции
    setTimeout(() => {
        if (!containerRef.value?.contains(document.activeElement)) {
            closeDropdown();
        }
    }, 150);
};

// ─── Outside click ────────────────────────────────────────────────────────────

const onClickOutside = (e) => {
    if (!containerRef.value?.contains(e.target)) {
        closeDropdown();
    }
};

// ─── Index helpers для :class focusedIndex ────────────────────────────────────

const getFlatIndex = (group, child) => {
    return flatOptions.value.findIndex(o => String(o.id) === String(child.id));
};

const getFlatIndexSimple = (option) => {
    return flatOptions.value.findIndex(o => String(o.id) === String(option.id));
};

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(() => props.options, (newOptions) => {
    if (!newOptions) return;
    mergeIntoCache(newOptions);
    if (isOpen.value) loadOptions(searchTerm.value, 1);
}, { deep: true });

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
    document.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener('click', onClickOutside);
    destroyPaginationObserver();
    clearTimeout(searchDebounceTimer);
});
</script>

<style scoped>
/* ── Контейнер ── */
.vue-select {
    position: relative;
    box-sizing: border-box;
    font-size: 14px;
    color: #333;
}

/* ── Основной элемент управления (имитирует Bootstrap 3 .form-control) ── */
.vue-select__control {
    display: flex;
    align-items: center;
    min-height: 34px;
    padding: 2px 6px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    flex-wrap: wrap;
    gap: 2px;
}

.vue-select__control:focus,
.vue-select--open .vue-select__control,
.vue-select__control--focus {
    border-color: #66afe9;
    outline: 0;
    box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
}

.vue-select--disabled .vue-select__control {
    background-color: #eee;
    cursor: not-allowed;
    opacity: 0.7;
}

.has-error .vue-select__control {
    border-color: #a94442;
}

/* ── Контейнер значений ── */
.vue-select__value-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;
    min-width: 0;
    /* Держит высоту контрола постоянной, когда при открытии single-режима контейнер пустеет
       (single-value скрыт, поиск отключён) — иначе поле «дёргается» по вертикали.
       box-sizing фиксируем явно: на хостах с глобальным reset (* { box-sizing: border-box })
       min-height иначе поглощал бы вертикальный padding и высота всё равно прыгала на 2px. */
    box-sizing: content-box;
    min-height: 28px; /* = line-height одиночного значения */
    gap: 2px;
    padding: 1px 0;
}

/* ── Одиночное значение ── */
.vue-select__single-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    line-height: 28px;
}

.vue-select__placeholder {
    color: #999;
    line-height: 28px;
}

/* ── Теги (множественный выбор) ── */
.vue-select__tag {
    display: inline-flex;
    align-items: center;
    background-color: #e4e4e4;
    border: 1px solid #aaa;
    border-radius: 3px;
    padding: 0 4px;
    font-size: 13px;
    line-height: 22px;
    max-width: 100%;
    overflow: hidden;
}

.vue-select__tag--created {
    background-color: #d9edf7;
    border-color: #bce8f1;
}

.vue-select__tag-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.vue-select__tag-remove {
    margin-left: 4px;
    cursor: pointer;
    color: #666;
    font-size: 15px;
    line-height: 1;
    flex-shrink: 0;
}

.vue-select__tag-remove:hover {
    color: #333;
}

/* ── Поле поиска ── */
.vue-select__search {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    line-height: 28px;
    min-width: 80px;
    flex: 1;
    padding: 0;
    color: #333;
}

.vue-select__search--single {
    width: 100%;
}

/* ── Правая часть: кнопка сброса + стрелка ── */
.vue-select__indicators {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: 4px;
}

.vue-select__clear {
    color: #999;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
}

.vue-select__clear:hover {
    color: #333;
}

.vue-select__separator {
    width: 1px;
    height: 20px;
    background-color: #ccc;
    margin: 0 4px;
}

.vue-select__arrow {
    color: #999;
    font-size: 10px;
    transition: transform 0.2s;
    display: inline-block;
}

.vue-select__arrow--up {
    transform: rotate(180deg);
}

/* ── Дропдаун ── */
.vue-select__dropdown {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 6px 12px rgba(0,0,0,.175);
    z-index: 1050;
    max-height: 240px;
    overflow-y: auto;
}

/* ── Статусные строки ── */
.vue-select__status {
    padding: 6px 12px;
    color: #999;
    font-size: 13px;
}

/* ── Метка группы ── */
.vue-select__group-label {
    padding: 6px 12px 3px;
    font-size: 12px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background-color: #f5f5f5;
}

/* ── Опция ── */
.vue-select__option {
    padding: 6px 12px;
    cursor: pointer;
    line-height: 1.4;
    transition: background-color 0.1s;
}

.vue-select__option--group-child {
    padding-left: 20px;
}

.vue-select__option:hover,
.vue-select__option--focused {
    background-color: #f5f5f5;
}

.vue-select__option--selected {
    background-color: #337ab7;
    color: #fff;
}

.vue-select__option--selected:hover,
.vue-select__option--selected.vue-select__option--focused {
    background-color: #286090;
}

.vue-select__option--tag {
    font-style: italic;
    color: #5bc0de;
}

.vue-select__option--selected.vue-select__option--tag {
    color: #fff;
}

/* ── Sentinel пагинации ── */
.vue-select__pagination-sentinel {
    height: 1px;
}
</style>
