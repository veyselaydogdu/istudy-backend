/**
 * Unit Tests: exportToCsv utility
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { exportToCsv } from "../../lib/exportUtils"

// jsdom ortamında URL.createObjectURL ve DOM click işlemlerini mock'la
const mockClick = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockCreateObjectURL = vi.fn(() => "blob:http://localhost/test-url")

beforeEach(() => {
    mockClick.mockClear()
    mockRevokeObjectURL.mockClear()
    mockCreateObjectURL.mockClear()

    // document.createElement mock — sadece anchor için
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
        if (tag === "a") {
            return {
                href: "",
                download: "",
                click: mockClick,
            } as unknown as HTMLAnchorElement
        }
        return document.createElement(tag)
    })

    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL
})

describe("exportToCsv", () => {
    it("should call URL.createObjectURL with a Blob", () => {
        exportToCsv("test", [{ name: "Alice", age: 30 }], [
            { key: "name", label: "Ad" },
            { key: "age", label: "Yaş" },
        ])
        expect(mockCreateObjectURL).toHaveBeenCalledOnce()
        const blob = mockCreateObjectURL.mock.calls[0][0]
        expect(blob).toBeInstanceOf(Blob)
    })

    it("should set correct filename with .csv extension", () => {
        let capturedAnchor: { download: string; href: string; click: () => void } | null = null
        vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
            if (tag === "a") {
                capturedAnchor = { href: "", download: "", click: vi.fn() }
                return capturedAnchor as unknown as HTMLAnchorElement
            }
            return document.createElement(tag)
        })
        exportToCsv("my-file", [], [{ key: "id", label: "ID" }])
        expect(capturedAnchor).not.toBeNull()
        expect(capturedAnchor!.download).toBe("my-file.csv")
    })

    it("should trigger anchor click", () => {
        exportToCsv("test", [{ id: 1 }], [{ key: "id", label: "ID" }])
        expect(mockClick).toHaveBeenCalledOnce()
    })

    it("should revoke object URL after click", () => {
        exportToCsv("test", [{ id: 1 }], [{ key: "id", label: "ID" }])
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/test-url")
    })

    it("should produce correct CSV header row", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("test", [], [
            { key: "name", label: "İsim" },
            { key: "email", label: "E-posta" },
        ])

        expect(capturedBlob).not.toBeNull()
        return capturedBlob!.text().then((text) => {
            const lines = text.replace(/^\uFEFF/, "").split("\n")
            expect(lines[0]).toBe('"İsim","E-posta"')
        })
    })

    it("should produce correct CSV data rows", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("test", [{ name: "Ali", email: "ali@test.com" }], [
            { key: "name", label: "İsim" },
            { key: "email", label: "E-posta" },
        ])

        return capturedBlob!.text().then((text) => {
            const lines = text.replace(/^\uFEFF/, "").split("\n")
            expect(lines[1]).toBe('"Ali","ali@test.com"')
        })
    })

    it("should escape double quotes in cell values", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("test", [{ name: 'Say "hello"' }], [
            { key: "name", label: "İsim" },
        ])

        return capturedBlob!.text().then((text) => {
            const lines = text.replace(/^\uFEFF/, "").split("\n")
            expect(lines[1]).toBe('"Say ""hello"""')
        })
    })

    it("should use custom format function when provided", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("test", [{ status: "active" }], [
            {
                key: "status",
                label: "Durum",
                format: (row) => (row.status === "active" ? "Aktif" : "Pasif"),
            },
        ])

        return capturedBlob!.text().then((text) => {
            const lines = text.replace(/^\uFEFF/, "").split("\n")
            expect(lines[1]).toBe('"Aktif"')
        })
    })

    it("should handle empty rows array — only header", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("empty", [], [{ key: "id", label: "ID" }])

        return capturedBlob!.text().then((text) => {
            const lines = text.replace(/^\uFEFF/, "").split("\n")
            expect(lines).toHaveLength(1)
            expect(lines[0]).toBe('"ID"')
        })
    })

    it("should include BOM character for Excel UTF-8 compatibility", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("test", [], [{ key: "id", label: "ID" }])

        expect(capturedBlob).not.toBeNull()
        // Blob tipinin UTF-8 charset içerdiğini doğrula
        expect(capturedBlob!.type).toContain("text/csv")
        // BOM içerik olarak oluşturuldu mu — ArrayBuffer ile doğrula
        return capturedBlob!.arrayBuffer().then((buf) => {
            const bytes = new Uint8Array(buf)
            // UTF-8 BOM: 0xEF 0xBB 0xBF
            expect(bytes[0]).toBe(0xef)
            expect(bytes[1]).toBe(0xbb)
            expect(bytes[2]).toBe(0xbf)
        })
    })

    it("should handle null/undefined values as empty string", () => {
        let capturedBlob: Blob | null = null
        global.URL.createObjectURL = vi.fn((blob: Blob) => {
            capturedBlob = blob
            return "blob:test"
        })

        exportToCsv("test", [{ name: null as unknown as string, age: undefined as unknown as number }], [
            { key: "name", label: "Ad" },
            { key: "age", label: "Yaş" },
        ])

        return capturedBlob!.text().then((text) => {
            const lines = text.replace(/^\uFEFF/, "").split("\n")
            expect(lines[1]).toBe('"",""')
        })
    })
})
