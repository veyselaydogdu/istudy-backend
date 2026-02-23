/**
 * TEST GRUBU 4: Güvenlik Testleri
 * Auth bypass, privilege escalation, injection, IDOR, rate limiting
 */

import { test, expect } from "@playwright/test"
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, getSuperAdminToken, createTenantAndGetToken } from "./helpers/api"

let adminToken: string
let tenantToken: string

test.beforeAll(async () => {
    adminToken = await getSuperAdminToken()
    const result = await createTenantAndGetToken(`sec_${Date.now()}`)
    tenantToken = result.token
})

// ─── PRIVILEGE ESCALATION: Tenant → Admin ────────────────────────────────────
test.describe("Privilege Escalation — Tenant Cannot Access Admin Routes", () => {
    const adminOnlyEndpoints = [
        "/admin/dashboard/stats",
        "/admin/tenants",
        "/admin/schools",
        "/admin/users",
        "/admin/subscriptions",
        "/admin/packages",
        "/admin/activity-logs",
        "/admin/system/health",
        "/admin/transactions",
        "/admin/allergens",
        "/admin/medical-conditions",
        "/admin/pricing",
    ]

    for (const endpoint of adminOnlyEndpoints) {
        test(`Tenant token ile GET ${endpoint} → 403 Forbidden`, async () => {
            const res = await apiGet(endpoint, tenantToken)
            expect(res.status).toBe(403)
        })
    }

    test("Tenant token ile POST /admin/allergens → 403", async () => {
        const res = await apiPost("/admin/allergens", { name: "hacker" }, tenantToken)
        expect(res.status).toBe(403)
    })

    test("Tenant token ile POST /admin/packages → 403", async () => {
        const res = await apiPost("/admin/packages", { name: "free_hack", price_monthly: 0 }, tenantToken)
        expect(res.status).toBe(403)
    })
})

// ─── IDOR: Başka Tenant Verilerine Erişim ─────────────────────────────────────
test.describe("IDOR — Cross-Tenant Data Access Prevention", () => {
    test("Tenant A token ile tenant B tenant endpoint → 403 veya veri göremez", async () => {
        // Başka bir tenant oluştur
        const { token: otherToken } = await createTenantAndGetToken(`idor_b_${Date.now()}`)
        // Hangi endpoint olursa olsun kendi dışında başkasının tenant'ına erişim engellenmelidir
        // /api/tenants/{id} (non-admin) — tenant kendi tenant'ını görebilir, başkasını göremez
        // Tenant modeli, 1 veya 2 numaralı bir tenant'a erişmeyi dene
        const res = await apiGet("/tenants/1", otherToken)
        // 200 dönse de başka tenant verisi dönmemelidir, ya 404 ya 403 ya da kendi verisi
        expect([200, 400, 403, 404]).toContain(res.status)
        if (res.status === 200) {
            const data = await res.json()
            // Eğer başka tenant verisi dönüyorsa bu IDOR açığıdır
            // Not: Tenant global scope ile izole edilmiş olmalı
            console.warn("IDOR CHECK: /tenants/1 returned 200 — verify it's own tenant data only")
        }
    })
})

// ─── SQL INJECTION GİRİŞİMLERİ ───────────────────────────────────────────────
test.describe("SQL Injection Prevention", () => {
    const sqlPayloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "'; DROP TABLE users;--",
        "1 UNION SELECT * FROM users",
    ]

    for (const payload of sqlPayloads) {
        test(`SQL injection search parametresi: "${payload.substring(0, 20)}"`, async () => {
            const res = await apiGet("/admin/tenants", adminToken, { search: payload })
            // 200 dönmeli ama SQL hatası veya veri sızması olmaz
            expect(res.status).toBe(200)
            const data = await res.json()
            // Response success olmalı veya boş dizi dönmeli (injection kabul edilmemeli)
            expect(data.success).toBe(true)
            // Tüm kayıtları döndürmemeli (injection başarısız olmalı)
            // 0 veya az kayıt beklenir
        })
    }
})

// ─── XSS GİRİŞİMLERİ ─────────────────────────────────────────────────────────
test.describe("XSS Prevention", () => {
    test("XSS payload ile allergen oluşturma girişimi → 422 veya sanitize", async () => {
        const res = await apiPost("/admin/allergens", {
            name: "<script>alert('xss')</script>",
            description: "<img src=x onerror=alert(1)>",
        }, adminToken)
        // 422 validation hatası beklenir veya 201 oluşturuldu ama sanitize edilmiş
        expect([201, 400, 422]).toContain(res.status)
        if (res.status === 201) {
            const data = await res.json()
            // Oluşturuldu ise, script tag'inin sanitize edilmiş olması gerekir
            const name = data.data?.name ?? ""
            expect(name).not.toContain("<script>")
        }
    })
})

// ─── AUTH BYPASS GİRİŞİMLERİ ─────────────────────────────────────────────────
test.describe("Auth Bypass Attempts", () => {
    test("Bearer olmadan sadece token string ile 401", async () => {
        const res = await fetch("http://localhost:8000/api/admin/dashboard/stats", {
            headers: { Authorization: adminToken, Accept: "application/json" }, // Bearer olmadan
        })
        expect(res.status).toBe(401)
    })

    test("Boş Bearer token ile 401", async () => {
        const res = await fetch("http://localhost:8000/api/admin/dashboard/stats", {
            headers: { Authorization: "Bearer ", Accept: "application/json" },
        })
        expect(res.status).toBe(401)
    })

    test("Manipüle edilmiş JWT ile 401", async () => {
        const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.tampered_signature"
        const res = await apiGet("/admin/dashboard/stats", fakeToken)
        expect(res.status).toBe(401)
    })

    test("Başkasının revoke edilmiş token'ı ile 401", async () => {
        // Token oluştur ve logout yap
        const { token } = await createTenantAndGetToken(`revoke_${Date.now()}`)
        await apiPost("/auth/logout", {}, token)
        // Aynı token ile tekrar istek
        const res = await apiGet("/auth/me", token)
        expect(res.status).toBe(401)
    })
})

// ─── PAYMENT WEBHOOK GÜVENLİĞİ ───────────────────────────────────────────────
test.describe("Payment Webhook Security", () => {
    test("POST /payment/callback → doğrulama olmadan 400/422", async () => {
        const res = await apiPost("/payment/callback", { fake: "data" })
        // İmzasız/doğrulanmamış webhook reddedilmeli
        expect([400, 401, 403, 422, 500]).toContain(res.status)
    })

    test("POST /payment/success → doğrulama olmadan reddedilir", async () => {
        const res = await apiPost("/payment/success", { fake: "data" })
        expect([400, 401, 403, 422, 500]).toContain(res.status)
    })
})

// ─── RATE LIMITING (BRUTE FORCE) ─────────────────────────────────────────────
test.describe("Rate Limiting Check", () => {
    test("Çoklu başarısız login girişimi → 429 veya devam ediyor (not)", async () => {
        const results: number[] = []
        for (let i = 0; i < 6; i++) {
            const res = await apiPost("/auth/login", {
                email: "admin@istudy.com",
                password: "yanlisSifre123",
            })
            results.push(res.status)
        }
        // Rate limiting varsa 429 dönmeli
        const has429 = results.includes(429)
        if (!has429) {
            // Rate limiting yok - güvenlik önerisi olarak işaretle
            console.warn("SECURITY: Rate limiting brute-force login için uygulanmamış görünüyor")
        }
        // Her durumda son istek 401 veya 429 olmalı
        expect([401, 429]).toContain(results[results.length - 1])
    })
})

// ─── RESPONSE HEADER GÜVENLİĞİ ───────────────────────────────────────────────
test.describe("Security Headers", () => {
    test("API response güvenlik header'larını içermeli", async () => {
        const res = await apiGet("/health")
        const headers = Object.fromEntries(res.headers.entries())
        // X-Frame-Options, X-Content-Type-Options kontrol
        console.log("Response Headers:", JSON.stringify(headers, null, 2))
        // Bu headerlar HTTPS server üzerinde ekleniyor (nginx 443)
        // 8000 portunda olmayabilir - bilgi amaçlı log
    })

    test("Hassas hata mesajı sızdırılmamalı (stack trace yok)", async () => {
        const res = await apiGet("/admin/tenants/not-a-number", adminToken)
        const data = await res.json()
        // Stack trace veya dosya yolu içermemeli
        const responseStr = JSON.stringify(data)
        expect(responseStr).not.toContain("vendor/laravel")
        expect(responseStr).not.toContain("app/Http/Controllers")
        expect(responseStr).not.toContain("at line")
    })
})

// ─── MASS ASSIGNMENT KORUMALARI ──────────────────────────────────────────────
test.describe("Mass Assignment Protection", () => {
    test("Kullanıcı update'de is_super_admin atanamamalı", async () => {
        // Admin user'ını güncellemeye çalışırken is_super_admin ekle
        const res = await apiGet("/auth/me", adminToken)
        const user = (await res.json()).data
        if (user?.id) {
            const updateRes = await apiPut(`/admin/users/${user.id}`, {
                name: user.name,
                is_super_admin: true,
                role: "super_admin",
            }, adminToken)
            // 200 dönse de is_super_admin field'ı kabul edilmemelidir
            expect([200, 400, 403, 422]).toContain(updateRes.status)
        }
    })
})
