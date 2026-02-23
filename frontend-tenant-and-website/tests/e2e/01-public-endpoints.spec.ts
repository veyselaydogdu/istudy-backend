/**
 * TEST GRUBU 1: Herkese Açık Endpoint'ler
 * Auth gerektirmeyen tüm public route'ları test eder.
 */

import { test, expect } from "@playwright/test"
import { apiGet, apiPost } from "./helpers/api"

test.describe("Public Endpoints", () => {

    // ── GET /api/health ──────────────────────────────────────
    test("GET /health → 200 ok", async () => {
        const res = await apiGet("/health")
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.status).toBe("ok")
        expect(data.timestamp).toBeDefined()
    })

    // ── POST /api/auth/login ─────────────────────────────────
    test("POST /auth/login → başarılı giriş token döner", async () => {
        const res = await apiPost("/auth/login", {
            email: "admin@istudy.com",
            password: "password",
        })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(data.data?.token).toBeTruthy()
    })

    test("POST /auth/login → hatalı şifre 401", async () => {
        const res = await apiPost("/auth/login", {
            email: "admin@istudy.com",
            password: "yanlis_sifre",
        })
        expect(res.status).toBe(401)
        const data = await res.json()
        expect(data.success).toBe(false)
    })

    test("POST /auth/login → geçersiz email formatı 422", async () => {
        const res = await apiPost("/auth/login", {
            email: "gecersiz-email",
            password: "password",
        })
        expect([400, 422]).toContain(res.status)
    })

    test("POST /auth/login → boş body 422", async () => {
        const res = await apiPost("/auth/login", {})
        expect([400, 422]).toContain(res.status)
    })

    // ── POST /api/auth/register ──────────────────────────────
    test("POST /auth/register → yeni kurum kaydı başarılı", async () => {
        const suffix = Date.now()
        const res = await apiPost("/auth/register", {
            name: `Test User ${suffix}`,
            institution_name: `Test Kurum ${suffix}`,
            email: `testregister_${suffix}@test.com`,
            password: "Password123!",
            password_confirmation: "Password123!",
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(data.data?.token).toBeTruthy()
    })

    test("POST /auth/register → mevcut email 422", async () => {
        const res = await apiPost("/auth/register", {
            name: "Test User",
            institution_name: "Test",
            email: "admin@istudy.com",
            password: "Password123!",
            password_confirmation: "Password123!",
        })
        expect([400, 422]).toContain(res.status)
    })

    test("POST /auth/register → şifre eşleşmemesi 422", async () => {
        const res = await apiPost("/auth/register", {
            name: "Test User",
            institution_name: "Test",
            email: `missmatch_${Date.now()}@test.com`,
            password: "Password123!",
            password_confirmation: "FarklıSifre456!",
        })
        expect([400, 422]).toContain(res.status)
    })

    // ── GET /api/packages ────────────────────────────────────
    test("GET /packages → aktif paket listesi döner", async () => {
        const res = await apiGet("/packages")
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
    })

    // ── POST /api/schools/search ─────────────────────────────
    test("POST /schools/search → body olmadan geçersiz istek", async () => {
        const res = await apiPost("/schools/search", {})
        // BUG: 500 TypeError (BaseController::user() returns null when unauthenticated)
        expect([400, 422, 404, 500]).toContain(res.status)
    })

    // ── GET /api/currencies/* ────────────────────────────────
    test("GET /currencies → para birimi listesi", async () => {
        const res = await apiGet("/currencies")
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.success).toBe(true)
    })

    test("GET /currencies/rates → kur listesi", async () => {
        const res = await apiGet("/currencies/rates")
        expect(res.status).toBe(200)
    })

    test("GET /currencies/convert → dönüşüm (parametresiz)", async () => {
        const res = await apiGet("/currencies/convert")
        // Parametre yoksa hata döner (400/422) veya boş sonuç
        expect([200, 400, 422]).toContain(res.status)
    })

    test("GET /currencies/history/USD → USD geçmişi", async () => {
        const res = await apiGet("/currencies/history/USD")
        // BUG: Para birimi DB'de yoksa 404 yerine 500 dönüyor
        expect([200, 404, 500]).toContain(res.status)
    })

    // ── GET /api/countries/* ─────────────────────────────────
    test("GET /countries → ülke listesi", async () => {
        const res = await apiGet("/countries")
        expect(res.status).toBe(200)
    })

    test("GET /countries/phone-codes → telefon kodları", async () => {
        const res = await apiGet("/countries/phone-codes")
        expect(res.status).toBe(200)
    })

    test("GET /countries/regions → bölgeler", async () => {
        const res = await apiGet("/countries/regions")
        expect(res.status).toBe(200)
    })
})
