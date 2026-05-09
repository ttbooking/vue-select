import { vi, beforeEach } from 'vitest'

let _intersectionCallback = null

global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
  _intersectionCallback = callback
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }
})

export function triggerIntersection(isIntersecting = true) {
  _intersectionCallback?.([{ isIntersecting }])
}

beforeEach(() => {
  _intersectionCallback = null
})
