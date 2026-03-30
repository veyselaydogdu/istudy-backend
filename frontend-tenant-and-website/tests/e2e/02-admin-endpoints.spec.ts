/**
 * TEST GRUBU 2: Admin Only Endpoint'ler (Super Admin)
 * /api/admin/* prefix'li tüm route'ları kapsar.
 */

import { test, expect } from "@playwright/test"
import { apiGet, apiPost, apiPatch, apiPut, apiDelete, getSuperAdminToken } from "./helpers/api"

let adminToken: string

test.beforeAll(async () => {
    adminToken = await getSuperAdminToken()
})

// ─── AUTH GUARD TESTLERİ ─────────────────────────────────────────────────────
test.describe("Admin Auth Guard", () => {
    const adminEndpoints = [
        "/admin/dashboard/stats",
        "/admin/tenants",
        "/admin/schools",
        "/admin/users",
        "/admin/subscriptions",
        "/admin/subscriptions/stats",
        "/admin/packages",
        "/admin/activity-logs",
        "/admin/activity-logs/stats",
        "/admin/activity-logs/daily-summary",
        "/admin/system/health",
        "/admin/transactions",
        "/admin/transactions/stats",
        "/admin/currencies",
        "/admin/countries",
        "/admin/allergens",
        "/admin/medical-conditions",
        "/admin/food-ingredients",
        "/admin/medications",
    ]

    for (const endpoint of adminEndpoints) {
        test(`GET ${endpoint} → auth olmadan 401`, async () => {
            const res = await apiGet(endpoint)
            expect(res.status).toBe(401)
        })

        test(`GET ${endpoint} → yanlış token 401`, async () => {
            const res = await apiGet(endpoint, "yanlis_token_12345")
            expect(res.status).toBe(401)
        })
    }
})

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
test.describe("Admin Dashboard", () => {
    test("GET /admin/dashboard/stats → nested stats döner", async () => {
        const res = await apiGet("/admin/dashboard/stats", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(data.data?.tenants).toBeDefined()
        expect(data.data?.schools).toBeDefined()
        expect(data.data?.subscriptions).toBeDefined()
        expect(data.data?.users).toBeDefined()
    })

    test("GET /admin/dashboard/recent-activities → aktivite listesi", async () => {
        const res = await apiGet("/admin/dashboard/recent-activities", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
    })

    test("GET /admin/dashboard/growth → büyüme trendi", async () => {
        const res = await apiGet("/admin/dashboard/growth", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/dashboard/top-schools → top okullar", async () => {
        const res = await apiGet("/admin/dashboard/top-schools", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/dashboard/package-distribution → paket dağılımı", async () => {
        const res = await apiGet("/admin/dashboard/package-distribution", adminToken)
        expect(res.status).toBe(200)
    })
})

// ─── TENANT YÖNETİMİ ─────────────────────────────────────────────────────────
test.describe("Admin Tenants", () => {
    test("GET /admin/tenants → data dizisi ve meta döner", async () => {
        const res = await apiGet("/admin/tenants", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
        expect(data.meta?.current_page).toBeDefined()
        expect(data.meta?.total).toBeDefined()
    })

    test("GET /admin/tenants → per_page parametresi çalışır", async () => {
        const res = await apiGet("/admin/tenants", adminToken, { per_page: "5" })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.meta?.per_page).toBe(5)
    })

    test("GET /admin/tenants → search parametresi çalışır", async () => {
        const res = await apiGet("/admin/tenants", adminToken, { search: "xyz_nonexistent" })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data.data)).toBe(true)
        expect(data.data.length).toBe(0)
    })

    test("GET /admin/tenants/99999 → 404 veya 500", async () => {
        const res = await apiGet("/admin/tenants/99999", adminToken)
        expect([404, 500]).toContain(res.status)
    })
})

// ─── OKUL YÖNETİMİ ───────────────────────────────────────────────────────────
test.describe("Admin Schools", () => {
    test("GET /admin/schools → data dizisi ve meta döner", async () => {
        const res = await apiGet("/admin/schools", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
        expect(data.meta).toBeDefined()
    })

    test("GET /admin/schools → is_active filtresi", async () => {
        const res = await apiGet("/admin/schools", adminToken, { is_active: "true" })
        expect(res.status).toBe(200)
    })

    test("GET /admin/schools/99999 → 404", async () => {
        const res = await apiGet("/admin/schools/99999", adminToken)
        expect([404, 500]).toContain(res.status)
    })
})

// ─── KULLANICI YÖNETİMİ ──────────────────────────────────────────────────────
test.describe("Admin Users", () => {
    test("GET /admin/users → data dizisi döner", async () => {
        const res = await apiGet("/admin/users", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
    })

    test("GET /admin/users → role filtresi", async () => {
        const res = await apiGet("/admin/users", adminToken, { role: "super_admin" })
        expect(res.status).toBe(200)
    })

    test("GET /admin/users/99999 → 404", async () => {
        const res = await apiGet("/admin/users/99999", adminToken)
        expect([404, 500]).toContain(res.status)
    })
})

// ─── ABONELİK YÖNETİMİ ───────────────────────────────────────────────────────
test.describe("Admin Subscriptions", () => {
    test("GET /admin/subscriptions/stats → istatistikler döner", async () => {
        const res = await apiGet("/admin/subscriptions/stats", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(data.data?.active).toBeDefined()
        expect(data.data?.cancelled).toBeDefined()
        expect(data.data?.expired).toBeDefined()
    })

    test("GET /admin/subscriptions → liste döner", async () => {
        const res = await apiGet("/admin/subscriptions", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data.data)).toBe(true)
    })

    test("GET /admin/subscriptions → status filtresi", async () => {
        const res = await apiGet("/admin/subscriptions", adminToken, { status: "active" })
        expect(res.status).toBe(200)
    })

    test("GET /admin/subscriptions/99999 → 404", async () => {
        const res = await apiGet("/admin/subscriptions/99999", adminToken)
        expect([404, 500]).toContain(res.status)
    })
})

// ─── PAKET YÖNETİMİ ──────────────────────────────────────────────────────────
test.describe("Admin Packages", () => {
    test("GET /admin/packages → paket listesi döner", async () => {
        const res = await apiGet("/admin/packages", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
    })

    test("POST /admin/packages → geçersiz body 422", async () => {
        const res = await apiPost("/admin/packages", {}, adminToken)
        expect([400, 422]).toContain(res.status)
    })
})

// ─── SİSTEM SAĞLIĞI ──────────────────────────────────────────────────────────
test.describe("Admin System", () => {
    test("GET /admin/system/health → sistem sağlığı", async () => {
        const res = await apiGet("/admin/system/health", adminToken)
        expect([200, 500]).toContain(res.status)
    })

    test("GET /admin/system/notifications → bildirimler", async () => {
        const res = await apiGet("/admin/system/notifications", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/system/enrollments/pending → bekleyen kayıtlar", async () => {
        const res = await apiGet("/admin/system/enrollments/pending", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/system/enrollments → tüm kayıtlar", async () => {
        const res = await apiGet("/admin/system/enrollments", adminToken)
        expect(res.status).toBe(200)
    })
})

// ─── AKTİVİTE LOGLARI ────────────────────────────────────────────────────────
test.describe("Admin Activity Logs", () => {
    test("GET /admin/activity-logs → log listesi", async () => {
        const res = await apiGet("/admin/activity-logs", adminToken)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(Array.isArray(data.data)).toBe(true)
    })

    test("GET /admin/activity-logs/stats → istatistik", async () => {
        const res = await apiGet("/admin/activity-logs/stats", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/activity-logs/daily-summary → günlük özet", async () => {
        const res = await apiGet("/admin/activity-logs/daily-summary", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/activity-logs/models → model türleri", async () => {
        const res = await apiGet("/admin/activity-logs/models", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/activity-logs/user/1 → kullanıcı aktivitesi", async () => {
        const res = await apiGet("/admin/activity-logs/user/1", adminToken)
        expect([200, 404]).toContain(res.status)
    })
})

// ─── FİNANS ──────────────────────────────────────────────────────────────────
test.describe("Admin Transactions & Invoices", () => {
    test("GET /admin/transactions → işlem listesi", async () => {
        const res = await apiGet("/admin/transactions", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/transactions/stats → işlem istatistikleri", async () => {
        const res = await apiGet("/admin/transactions/stats", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/transactions/monthly → aylık istatistik", async () => {
        const res = await apiGet("/admin/transactions/monthly", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/invoices → fatura listesi", async () => {
        const res = await apiGet("/admin/invoices", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/invoices/stats → fatura istatistikleri", async () => {
        const res = await apiGet("/admin/invoices/stats", adminToken)
        expect(res.status).toBe(200)
    })
})

// ─── PARA BİRİMİ ─────────────────────────────────────────────────────────────
test.describe("Admin Currencies", () => {
    test("GET /admin/currencies → para birimi listesi", async () => {
        const res = await apiGet("/admin/currencies", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/currencies/stats → istatistik", async () => {
        const res = await apiGet("/admin/currencies/stats", adminToken)
        expect([200, 404]).toContain(res.status)
    })

    test("GET /admin/currencies/logs → güncelleme logları", async () => {
        const res = await apiGet("/admin/currencies/logs", adminToken)
        expect(res.status).toBe(200)
    })
})

// ─── ÜLKE YÖNETİMİ ───────────────────────────────────────────────────────────
test.describe("Admin Countries", () => {
    test("GET /admin/countries → ülke listesi", async () => {
        const res = await apiGet("/admin/countries", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/countries/stats → istatistik", async () => {
        const res = await apiGet("/admin/countries/stats", adminToken)
        expect([200, 404]).toContain(res.status)
    })

    test("GET /admin/countries/regions → bölgeler", async () => {
        const res = await apiGet("/admin/countries/regions", adminToken)
        expect(res.status).toBe(200)
    })
})

// ─── SAĞLIK VERİLERİ ─────────────────────────────────────────────────────────
test.describe("Admin Health Data", () => {
    test("GET /admin/allergens → alerjen listesi", async () => {
        const res = await apiGet("/admin/allergens", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/medical-conditions → tıbbi durum listesi", async () => {
        const res = await apiGet("/admin/medical-conditions", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/food-ingredients → besin içerik listesi", async () => {
        const res = await apiGet("/admin/food-ingredients", adminToken)
        expect(res.status).toBe(200)
    })

    test("GET /admin/medications → ilaç listesi", async () => {
        const res = await apiGet("/admin/medications", adminToken)
        expect(res.status).toBe(200)
    })

    test("POST /admin/allergens → geçersiz body 422", async () => {
        const res = await apiPost("/admin/allergens", {}, adminToken)
        expect([400, 422]).toContain(res.status)
    })

    test("POST /admin/medical-conditions → geçersiz body 422", async () => {
        const res = await apiPost("/admin/medical-conditions", {}, adminToken)
        expect([400, 422]).toContain(res.status)
    })
})

// ─── ÇOCUK FİYATLANDIRMA ─────────────────────────────────────────────────────
test.describe("Admin Pricing", () => {
    test("GET /admin/pricing → fiyatlandırma ayarları", async () => {
        const res = await apiGet("/admin/pricing", adminToken)
        expect(res.status).toBe(200)
    })
})
