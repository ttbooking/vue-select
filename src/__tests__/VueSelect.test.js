import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VueSelect from '../VueSelect.vue'
import { triggerIntersection } from './setup.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const OPTIONS = [
  { id: '1', text: 'Apple' },
  { id: '2', text: 'Banana' },
  { id: '3', text: 'Cherry' },
]

const GROUPED_OPTIONS = [
  {
    text: 'Fruits',
    children: [
      { id: 'f1', text: 'Apple' },
      { id: 'f2', text: 'Banana' },
    ],
  },
  {
    text: 'Veggies',
    children: [
      { id: 'v1', text: 'Carrot' },
    ],
  },
]

const MANY_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  text: `Item ${i + 1}`,
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function factory(props = {}) {
  return mount(VueSelect, {
    props: { options: OPTIONS, ...props },
    attachTo: document.body,
  })
}

async function openDropdown(wrapper) {
  await wrapper.find('.vue-select__control').trigger('click')
  await flushPromises()
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('VueSelect', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders root element', () => {
      wrapper = factory()
      expect(wrapper.find('.vue-select').exists()).toBe(true)
    })

    it('shows placeholder when no value', () => {
      wrapper = factory({ placeholder: 'Pick one' })
      expect(wrapper.find('.vue-select__placeholder').text()).toBe('Pick one')
    })

    it('shows selected value in single mode', () => {
      wrapper = factory({ modelValue: '2' })
      expect(wrapper.find('.vue-select__single-value').text()).toBe('Banana')
    })

    it('shows selected tags in multiple mode', () => {
      wrapper = factory({ modelValue: ['1', '3'], multiple: true })
      const tags = wrapper.findAll('.vue-select__tag-text')
      expect(tags).toHaveLength(2)
      expect(tags[0].text()).toBe('Apple')
      expect(tags[1].text()).toBe('Cherry')
    })

    it('adds has-error class', () => {
      wrapper = factory({ hasError: true })
      expect(wrapper.find('.vue-select').classes()).toContain('has-error')
    })

    it('adds disabled class and prevents opening', async () => {
      wrapper = factory({ disabled: true })
      expect(wrapper.find('.vue-select').classes()).toContain('vue-select--disabled')
      await wrapper.find('.vue-select__control').trigger('click')
      await flushPromises()
      expect(wrapper.find('.vue-select').classes()).not.toContain('vue-select--open')
    })

    it('renders hidden native select when name is set', () => {
      wrapper = factory({ name: 'my-field', modelValue: '1' })
      const sel = wrapper.find('select[name="my-field"]')
      expect(sel.exists()).toBe(true)
      expect(sel.element.style.display).toBe('none')
      expect(sel.find('option').element.value).toBe('1')
    })
  })

  // ── Dropdown ───────────────────────────────────────────────────────────────

  describe('Dropdown open / close', () => {
    it('opens on control click', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select').classes()).toContain('vue-select--open')
    })

    it('closes on second click (toggle)', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__control').trigger('click')
      expect(wrapper.find('.vue-select').classes()).not.toContain('vue-select--open')
    })

    it('closes on Escape key from control', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__control').trigger('keydown', { key: 'Escape' })
      expect(wrapper.find('.vue-select').classes()).not.toContain('vue-select--open')
    })

    it('closes on outside click', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await flushPromises()
      expect(wrapper.find('.vue-select').classes()).not.toContain('vue-select--open')
    })

    it('shows all options when opened', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      expect(wrapper.findAll('.vue-select__option')).toHaveLength(OPTIONS.length)
    })

    it('shows noResults message when no options', async () => {
      wrapper = factory({ options: [] })
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select__status').text()).toBe('Совпадений не найдено')
    })

    it('supports English status messages', async () => {
      wrapper = factory({ options: [], lang: 'en' })
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select__status').text()).toBe('No results found')
    })

    it('supports custom phrase objects', async () => {
      wrapper = factory({
        options: [],
        lang: { noResults: () => 'Empty', searching: () => 'Loading' },
      })
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select__status').text()).toBe('Empty')
    })
  })

  // ── Single selection ───────────────────────────────────────────────────────

  describe('Single selection', () => {
    it('emits update:modelValue with option id on select', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.findAll('.vue-select__option')[1].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
    })

    it('closes dropdown after selection', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.findAll('.vue-select__option')[0].trigger('click')
      expect(wrapper.find('.vue-select').classes()).not.toContain('vue-select--open')
    })

    it('shows clear button when value is set', () => {
      wrapper = factory({ modelValue: '1' })
      expect(wrapper.find('.vue-select__clear').exists()).toBe(true)
    })

    it('hides clear button when no value', () => {
      wrapper = factory({ modelValue: null })
      expect(wrapper.find('.vue-select__clear').exists()).toBe(false)
    })

    it('clearAll emits null', async () => {
      wrapper = factory({ modelValue: '1' })
      await wrapper.find('.vue-select__clear').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
    })
  })

  // ── Multiple selection ─────────────────────────────────────────────────────

  describe('Multiple selection', () => {
    it('emits array on first select', async () => {
      wrapper = factory({ multiple: true, modelValue: [] })
      await openDropdown(wrapper)
      await wrapper.findAll('.vue-select__option')[0].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1']])
    })

    it('appends to existing selection', async () => {
      wrapper = factory({ multiple: true, modelValue: ['1'] })
      await openDropdown(wrapper)
      await wrapper.findAll('.vue-select__option')[1].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1', '2']])
    })

    it('deselects already-selected option', async () => {
      wrapper = factory({ multiple: true, modelValue: ['1', '2'] })
      await openDropdown(wrapper)
      const selected = wrapper.find('.vue-select__option--selected')
      await selected.trigger('click')
      const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0]
      expect(emitted).not.toContain('1')
    })

    it('removes tag on × click', async () => {
      wrapper = factory({ multiple: true, modelValue: ['1', '2'] })
      await wrapper.findAll('.vue-select__tag-remove')[0].trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['2']])
    })

    it('clearAll emits empty array', async () => {
      wrapper = factory({ multiple: true, modelValue: ['1', '2'] })
      await wrapper.find('.vue-select__clear').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]])
    })

    it('Backspace removes last item', async () => {
      wrapper = factory({ multiple: true, modelValue: ['1', '2'] })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').trigger('keydown', { key: 'Backspace' })
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1']])
    })
  })

  // ── Search filtering ───────────────────────────────────────────────────────

  describe('Search filtering', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('filters options after 250 ms debounce', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('Apple')
      vi.advanceTimersByTime(300)
      await flushPromises()
      const options = wrapper.findAll('.vue-select__option')
      expect(options).toHaveLength(1)
      expect(options[0].text()).toBe('Apple')
    })

    it('shows noResults after debounce if nothing matches', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('zzz')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(wrapper.find('.vue-select__status').text()).toBe('Совпадений не найдено')
    })

    it('uses a custom searchFunction prop', async () => {
      const searchFn = vi.fn(() => () => false)
      wrapper = factory({ searchFunction: searchFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('a')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(searchFn).toHaveBeenCalled()
      expect(wrapper.find('.vue-select__status').text()).toBe('Совпадений не найдено')
    })

    it('emits search event on input', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('Apple')
      expect(wrapper.emitted('search')?.[0]).toEqual(['Apple'])
    })

    it('hides single-mode search input below minimumResultsForSearch', async () => {
      wrapper = factory({ minimumResultsForSearch: 10 })
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select__search').isVisible()).toBe(false)
    })

    it('shows single-mode search input when minimumResultsForSearch is reached', async () => {
      wrapper = factory({ options: MANY_OPTIONS, minimumResultsForSearch: 10 })
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select__search').isVisible()).toBe(true)
    })
  })

  // ── Tag creation ───────────────────────────────────────────────────────────

  describe('Tag creation (createTag)', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    const createTagFn = ({ term }) => ({ id: `tag:${term}`, text: term })

    it('shows tag option for non-empty search term', async () => {
      wrapper = factory({ createTag: createTagFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('newtag')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(wrapper.find('.vue-select__option--tag').exists()).toBe(true)
    })

    it('does not show tag option when term is empty', async () => {
      wrapper = factory({ createTag: createTagFn })
      await openDropdown(wrapper)
      expect(wrapper.find('.vue-select__option--tag').exists()).toBe(false)
    })

    it('hides tag option when createTag returns null', async () => {
      wrapper = factory({ createTag: () => null })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('something')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(wrapper.find('.vue-select__option--tag').exists()).toBe(false)
    })

    it('emits modelValue with tag id on tag select', async () => {
      wrapper = factory({ createTag: createTagFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('mytag')
      vi.advanceTimersByTime(300)
      await flushPromises()
      await wrapper.find('.vue-select__option--tag').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tag:mytag'])
    })

    it('tokenizer auto-creates tag when separator char is typed', async () => {
      wrapper = factory({ createTag: createTagFn, multiple: true, modelValue: [] })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('hello,')
      vi.advanceTimersByTime(300)
      await flushPromises()
      const emittedValues = wrapper.emitted('update:modelValue') ?? []
      const added = emittedValues.some(([val]) =>
        Array.isArray(val) && val.includes('tag:hello')
      )
      expect(added).toBe(true)
    })
  })

  // ── Option grouping ────────────────────────────────────────────────────────

  describe('Option grouping', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('renders group labels', async () => {
      wrapper = factory({ options: GROUPED_OPTIONS })
      await openDropdown(wrapper)
      const labels = wrapper.findAll('.vue-select__group-label')
      expect(labels).toHaveLength(2)
      expect(labels[0].text()).toBe('Fruits')
      expect(labels[1].text()).toBe('Veggies')
    })

    it('renders children inside groups', async () => {
      wrapper = factory({ options: GROUPED_OPTIONS })
      await openDropdown(wrapper)
      const children = wrapper.findAll('.vue-select__option--group-child')
      expect(children).toHaveLength(3)
    })

    it('filters children within groups', async () => {
      wrapper = factory({ options: GROUPED_OPTIONS })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('Banana')
      vi.advanceTimersByTime(300)
      await flushPromises()
      const children = wrapper.findAll('.vue-select__option--group-child')
      expect(children).toHaveLength(1)
      expect(children[0].text()).toBe('Banana')
    })

    it('hides group label when all its children are filtered out', async () => {
      wrapper = factory({ options: GROUPED_OPTIONS })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('Carrot')
      vi.advanceTimersByTime(300)
      await flushPromises()
      const labels = wrapper.findAll('.vue-select__group-label')
      expect(labels).toHaveLength(1)
      expect(labels[0].text()).toBe('Veggies')
    })

    it('emits grouped child id on select', async () => {
      wrapper = factory({ options: GROUPED_OPTIONS })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__option--group-child').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['f1'])
    })
  })

  // ── Async queryFunction ────────────────────────────────────────────────────

  describe('queryFunction (async search)', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('calls queryFunction with term and page', async () => {
      const queryFn = vi.fn().mockImplementation((_, cb) =>
        cb({ results: [], pagination: { more: false } })
      )
      wrapper = factory({ queryFunction: queryFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('ba')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(queryFn).toHaveBeenCalledWith({ term: 'ba', page: 1 }, expect.any(Function))
    })

    it('displays remote results', async () => {
      const remote = [{ id: 'r1', text: 'Remote Item' }]
      const queryFn = vi.fn().mockImplementation((_, cb) =>
        cb({ results: remote, pagination: { more: false } })
      )
      wrapper = factory({ options: [], queryFunction: queryFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('rem')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(wrapper.findAll('.vue-select__option').some(o => o.text() === 'Remote Item')).toBe(true)
    })

    it('shows loading status while async call is pending', async () => {
      let resolve
      const queryFn = vi.fn().mockImplementation((_, cb) => { resolve = cb })
      wrapper = factory({ queryFunction: queryFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('x')
      vi.advanceTimersByTime(300)
      await flushPromises()
      expect(wrapper.find('.vue-select__status').text()).toBe('Поиск ...')
      resolve({ results: [], pagination: { more: false } })
      await flushPromises()
      expect(wrapper.find('.vue-select__status').text()).toBe('Совпадений не найдено')
    })

    it('emits cache event after remote results arrive', async () => {
      const remote = [{ id: 'r2', text: 'Cached' }]
      const queryFn = vi.fn().mockImplementation((_, cb) =>
        cb({ results: remote, pagination: { more: false } })
      )
      wrapper = factory({ options: [], queryFunction: queryFn })
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').setValue('c')
      vi.advanceTimersByTime(300)
      await flushPromises()
      const cacheEmits = wrapper.emitted('cache') ?? []
      expect(cacheEmits.length).toBeGreaterThan(0)
      const lastCache = cacheEmits[cacheEmits.length - 1][0]
      expect(lastCache.some(item => item.id === 'r2')).toBe(true)
    })

    it('ignores stale async search responses', async () => {
      const callbacks = []
      const queryFn = vi.fn().mockImplementation((_, cb) => callbacks.push(cb))
      wrapper = factory({ options: [], queryFunction: queryFn })
      await openDropdown(wrapper)

      await wrapper.find('.vue-select__search').setValue('old')
      vi.advanceTimersByTime(300)
      await flushPromises()

      await wrapper.find('.vue-select__search').setValue('new')
      vi.advanceTimersByTime(300)
      await flushPromises()

      callbacks[1]({ results: [{ id: 'new', text: 'New result' }], pagination: { more: false } })
      await flushPromises()
      expect(wrapper.find('.vue-select__option').text()).toBe('New result')

      callbacks[0]({ results: [{ id: 'old', text: 'Old result' }], pagination: { more: false } })
      await flushPromises()
      expect(wrapper.find('.vue-select__option').text()).toBe('New result')
    })
  })

  // ── Keyboard navigation ────────────────────────────────────────────────────

  describe('Keyboard navigation', () => {
    it('ArrowDown on control opens dropdown', async () => {
      wrapper = factory()
      await wrapper.find('.vue-select__control').trigger('keydown', { key: 'ArrowDown' })
      await flushPromises()
      expect(wrapper.find('.vue-select').classes()).toContain('vue-select--open')
    })

    it('Space on control opens dropdown', async () => {
      wrapper = factory()
      await wrapper.find('.vue-select__control').trigger('keydown', { key: ' ' })
      await flushPromises()
      expect(wrapper.find('.vue-select').classes()).toContain('vue-select--open')
    })

    it('ArrowDown moves focus to next option', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      const search = wrapper.find('.vue-select__search')
      await search.trigger('keydown', { key: 'ArrowDown' })
      await search.trigger('keydown', { key: 'ArrowDown' })
      const focused = wrapper.findAll('.vue-select__option--focused')
      expect(focused).toHaveLength(1)
      expect(focused[0].text()).toBe('Banana') // index 1
    })

    it('ArrowUp clamps focus at index 0', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      const search = wrapper.find('.vue-select__search')
      await search.trigger('keydown', { key: 'ArrowDown' }) // index 0
      await search.trigger('keydown', { key: 'ArrowUp' })  // clamp → stays 0
      await search.trigger('keydown', { key: 'ArrowUp' })  // clamp → stays 0
      const focused = wrapper.findAll('.vue-select__option--focused')
      expect(focused).toHaveLength(1)
      expect(focused[0].text()).toBe('Apple')
    })

    it('Enter selects the focused option', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      const search = wrapper.find('.vue-select__search')
      await search.trigger('keydown', { key: 'ArrowDown' }) // focus index 0
      await search.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['1'])
    })

    it('Escape closes dropdown from search input', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.find('.vue-select__search').trigger('keydown', { key: 'Escape' })
      expect(wrapper.find('.vue-select').classes()).not.toContain('vue-select--open')
    })
  })

  // ── Pagination ─────────────────────────────────────────────────────────────

  describe('Pagination (IntersectionObserver)', () => {
    it('creates IntersectionObserver when dropdown opens', async () => {
      wrapper = factory({ options: MANY_OPTIONS })
      await openDropdown(wrapper)
      expect(global.IntersectionObserver).toHaveBeenCalled()
    })

    it('loads first 20 items on open (PER_PAGE = 20)', async () => {
      wrapper = factory({ options: MANY_OPTIONS })
      await openDropdown(wrapper)
      expect(wrapper.findAll('.vue-select__option')).toHaveLength(20)
    })

    it('loads next page and appends when sentinel becomes visible', async () => {
      wrapper = factory({ options: MANY_OPTIONS })
      await openDropdown(wrapper)
      triggerIntersection(true)
      await flushPromises()
      expect(wrapper.findAll('.vue-select__option')).toHaveLength(25)
    })

    it('does not load more when sentinel is not intersecting', async () => {
      wrapper = factory({ options: MANY_OPTIONS })
      await openDropdown(wrapper)
      triggerIntersection(false)
      await flushPromises()
      expect(wrapper.findAll('.vue-select__option')).toHaveLength(20)
    })
  })

  // ── Cache management ───────────────────────────────────────────────────────

  describe('Cache management', () => {
    it('resolves selected value from options-initialized cache', () => {
      wrapper = factory({ modelValue: '2' })
      expect(wrapper.find('.vue-select__single-value').text()).toBe('Banana')
    })

    it('resolves selected value from explicit cache prop', () => {
      const cache = [{ id: '99', text: 'Cached Option' }]
      wrapper = factory({ options: [], cache, modelValue: '99' })
      expect(wrapper.find('.vue-select__single-value').text()).toBe('Cached Option')
    })

    it('falls back to id string when value is not in cache', () => {
      wrapper = factory({ options: [], modelValue: 'unknown' })
      expect(wrapper.find('.vue-select__single-value').text()).toBe('unknown')
    })

    it('merges new options when options prop changes', async () => {
      wrapper = factory({ modelValue: '99' })
      expect(wrapper.find('.vue-select__single-value').text()).toBe('99')
      await wrapper.setProps({ options: [...OPTIONS, { id: '99', text: 'New Item' }] })
      await flushPromises()
      expect(wrapper.find('.vue-select__single-value').text()).toBe('New Item')
    })

    it('does not emit cache event when selecting an already cached option', async () => {
      wrapper = factory()
      await openDropdown(wrapper)
      await wrapper.findAll('.vue-select__option')[0].trigger('click')
      expect(wrapper.emitted('cache')).toBeFalsy()
    })
  })
})
