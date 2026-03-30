/**
 * API Test Helper — tüm endpoint testleri için yardımcı fonksiyonlar
 * Base: http://localhost:8000/api (Docker yerel ortamı)
 */

const BASE = "http://localhost:8000/api"

const DEFAULT_HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

export async function apiGet(
    path: string,
    token?: string,
    params?: Record<string, string>
): Promise<Response> {
    const url = new URL(`${BASE}${path}`)
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }
    return fetch(url.toString(), {
        headers: {
            ...DEFAULT_HEADERS,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })
}

export async function apiPost(
    path: string,
    body: unknown,
    token?: string
): Promise<Response> {
    return fetch(`${BASE}${path}`, {
        method: "POST",
        headers: {
            ...DEFAULT_HEADERS,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })
}

export async function apiPatch(
    path: string,
    body: unknown,
    token?: string
): Promise<Response> {
    return fetch(`${BASE}${path}`, {
        method: "PATCH",
        headers: {
            ...DEFAULT_HEADERS,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })
}

export async function apiPut(
    path: string,
    body: unknown,
    token?: string
): Promise<Response> {
    return fetch(`${BASE}${path}`, {
        method: "PUT",
        headers: {
            ...DEFAULT_HEADERS,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })
}

export async function apiDelete(
    path: string,
    token?: string
): Promise<Response> {
    return fetch(`${BASE}${path}`, {
        method: "DELETE",
        headers: {
            ...DEFAULT_HEADERS,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })
}

/**
 * Super Admin token al
 */
export async function getSuperAdminToken(): Promise<string> {
    const res = await apiPost("/auth/login", {
        email: "admin@istudy.com",
        password: "password",
    })
    const data = await res.json()
    const token = data?.data?.token
    if (!token) throw new Error("Super admin token alınamadı: " + JSON.stringify(data))
    return token
}

/**
 * Test tenant kaydı oluştur ve token al
 */
export async function createTenantAndGetToken(
    suffix: string = Date.now().toString()
): Promise<{ token: string; email: string }> {
    const email = `testuser_${suffix}@test.com`
    const res = await apiPost("/auth/register", {
        name: `Test User ${suffix}`,
        institution_name: `Test Kurum ${suffix}`,
        email,
        password: "Password123!",
        password_confirmation: "Password123!",
    })
    const data = await res.json()
    const token = data?.data?.token
    if (!token) throw new Error("Tenant token alınamadı: " + JSON.stringify(data))
    return { token, email }
}
