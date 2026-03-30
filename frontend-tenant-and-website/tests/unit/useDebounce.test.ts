/**
 * Unit Tests: useDebounce hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "../../hooks/useDebounce"

describe("useDebounce", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("should return initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("hello", 400))
        expect(result.current).toBe("hello")
    })

    it("should not update immediately on value change", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => useDebounce(value, 400),
            { initialProps: { value: "initial" } }
        )

        rerender({ value: "changed" })
        expect(result.current).toBe("initial")
    })

    it("should update after delay", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => useDebounce(value, 400),
            { initialProps: { value: "initial" } }
        )

        rerender({ value: "updated" })

        act(() => {
            vi.advanceTimersByTime(400)
        })

        expect(result.current).toBe("updated")
    })

    it("should not update before delay expires", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => useDebounce(value, 500),
            { initialProps: { value: "initial" } }
        )

        rerender({ value: "updated" })

        act(() => {
            vi.advanceTimersByTime(499)
        })

        expect(result.current).toBe("initial")
    })

    it("should reset timer on rapid value changes", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => useDebounce(value, 300),
            { initialProps: { value: "a" } }
        )

        rerender({ value: "ab" })
        act(() => { vi.advanceTimersByTime(100) })

        rerender({ value: "abc" })
        act(() => { vi.advanceTimersByTime(100) })

        // Henüz 300ms geçmedi, hâlâ başlangıç değeri
        expect(result.current).toBe("a")

        act(() => { vi.advanceTimersByTime(300) })
        expect(result.current).toBe("abc")
    })

    it("should use default delay of 400ms", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: string }) => useDebounce(value),
            { initialProps: { value: "first" } }
        )

        rerender({ value: "second" })

        act(() => { vi.advanceTimersByTime(399) })
        expect(result.current).toBe("first")

        act(() => { vi.advanceTimersByTime(1) })
        expect(result.current).toBe("second")
    })

    it("should work with number type", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: number }) => useDebounce(value, 200),
            { initialProps: { value: 0 } }
        )

        rerender({ value: 42 })
        act(() => { vi.advanceTimersByTime(200) })
        expect(result.current).toBe(42)
    })

    it("should work with object type", () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: { q: string } }) => useDebounce(value, 200),
            { initialProps: { value: { q: "initial" } } }
        )

        const newValue = { q: "updated" }
        rerender({ value: newValue })
        act(() => { vi.advanceTimersByTime(200) })
        expect(result.current).toEqual({ q: "updated" })
    })
})
