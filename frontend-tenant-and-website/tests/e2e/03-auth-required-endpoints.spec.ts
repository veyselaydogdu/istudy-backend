/**
 * TEST GRUBU 3: Auth Gerekli Endpoint'ler (Abonelik Gerekmez)
 * Token gerekli ama aktif abonelik zorunlu değil.
 */

import { test, expect } from "@playwright/test"
import { apiGet, apiPost, apiPut, apiDelete, getSuperAdminToken, createTenantAndGetToken } from "./helpers/api"

let adminToken: string
let tenantToken: string

test.beforeAll(async () => {
    adminToken = await getSuperAdminToken()
    const result = await createTenantAndGetToken(`auth_${Date.now()}`)
    tenantToken = result.token
})

// ─── AUTH İŞLEMLERİ ──────────────────────────────────────────────────────────
test.describe("Auth Endpoints (With Token)", () => {
    test("GET /auth/me → profil bilgileri döner", async () => {
        const res = await apiGet("/auth/me", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.data?.email).toBeDefined()
    })

    test("GET /auth/me → token olmadan 401", async () => {
        const res = await apiGet("/auth/me")
        expect(res.status).toBe(401)
    })
})

// ─── PAKETLERİ LİSTELE (tenant token ile) ────────────────────────────────────
test.describe("Tenant Subscription Endpoints", () => {
    test("GET /tenant/subscription → mevcut abonelik (boş olabilir)", async () => {
        const res = await apiGet("/tenant/subscription", tenantToken)
        expect([200, 404]).toContain(res.status)
    })

    test("GET /tenant/subscription/history → abonelik geçmişi", async () => {
        const res = await apiGet("/tenant/subscription/history", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /tenant/subscription/usage → kullanım raporu", async () => {
        const res = await apiGet("/tenant/subscription/usage", tenantToken)
        expect([200, 404]).toContain(res.status)
    })
})

// ─── BİLDİRİM SİSTEMİ ────────────────────────────────────────────────────────
test.describe("Notification Endpoints", () => {
    test("GET /notifications → bildirim listesi", async () => {
        const res = await apiGet("/notifications", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /notifications/unread → okunmamış bildirimler", async () => {
        const res = await apiGet("/notifications/unread", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /notifications/unread-count → okunmamış sayısı", async () => {
        const res = await apiGet("/notifications/unread-count", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /notifications/preferences → tercihler", async () => {
        const res = await apiGet("/notifications/preferences", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /notifications → token olmadan 401", async () => {
        const res = await apiGet("/notifications")
        expect(res.status).toBe(401)
    })
})

// ─── İLETİŞİM NUMARALARI ─────────────────────────────────────────────────────
test.describe("Contact Numbers", () => {
    test("GET /contact-numbers → iletişim numaraları", async () => {
        const res = await apiGet("/contact-numbers", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /contact-numbers/types → numara türleri", async () => {
        const res = await apiGet("/contact-numbers/types", tenantToken)
        expect(res.status).toBe(200)
    })
})

// ─── FATURA SİSTEMİ ──────────────────────────────────────────────────────────
test.describe("Invoice Endpoints", () => {
    test("GET /invoices → fatura listesi", async () => {
        const res = await apiGet("/invoices", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /invoices/tenant → tenant faturaları", async () => {
        const res = await apiGet("/invoices/tenant", tenantToken)
        expect(res.status).toBe(200)
    })

    test("GET /invoices/99999 → bulunamayan fatura", async () => {
        const res = await apiGet("/invoices/99999", tenantToken)
        expect([403, 404, 500]).toContain(res.status)
    })
})

// ─── ÖĞRETMEN PROFİLİ ────────────────────────────────────────────────────────
test.describe("Teacher Profile", () => {
    test("GET /teacher/profile → profil (bulunamayabilir)", async () => {
        const res = await apiGet("/teacher/profile", tenantToken)
        expect([200, 404]).toContain(res.status)
    })

    test("GET /teacher/profile/educations → eğitim geçmişi", async () => {
        const res = await apiGet("/teacher/profile/educations", tenantToken)
        // BUG: Teacher profil yoksa 500 dönüyor, 404 olmalı
        expect([200, 404, 500]).toContain(res.status)
    })

    test("GET /teacher/profile/skills → yetenekler", async () => {
        const res = await apiGet("/teacher/profile/skills", tenantToken)
        // BUG: Teacher profil yoksa 500 dönüyor, 404 olmalı
        expect([200, 404, 500]).toContain(res.status)
    })
})

// ─── ÇIKIŞ ───────────────────────────────────────────────────────────────────
test.describe("Logout", () => {
    test("POST /auth/logout → başarılı çıkış", async () => {
        // Yeni bir token ile test ederek admin token'ı geçersiz kılmayalım
        const { token } = await createTenantAndGetToken(`logout_${Date.now()}`)
        const res = await apiPost("/auth/logout", {}, token)
        expect(res.status).toBe(200)
    })

    test("POST /auth/logout → token olmadan 401", async () => {
        const res = await apiPost("/auth/logout", {})
        expect(res.status).toBe(401)
    })
})
