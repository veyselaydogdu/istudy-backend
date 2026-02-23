// ─── Ortak ───────────────────────────────────────────────────────────────────

export type PaginatedResponse<T> = {
    success: boolean
    message: string
    data: T[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}

export type ApiResponse<T> = {
    success: boolean
    message: string
    data: T
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type User = {
    id: number
    name: string
    surname?: string
    email: string
    phone?: string
    tenant_id?: number
    country_id?: number
    created_at: string
    updated_at: string
    tenant?: {
        id: number
        name: string
    }
}

// ─── Package ─────────────────────────────────────────────────────────────────

export type PackageFeature = {
    id: number
    key: string
    label: string
    value_type: 'bool' | 'text'
    value?: string | null
    description?: string
    display_order?: number
}

export type Package = {
    id: number
    name: string
    description?: string
    max_schools: number
    max_classes_per_school: number
    max_students: number
    monthly_price: number
    yearly_price: number
    is_active: boolean
    sort_order?: number
    package_features?: PackageFeature[]
    yearly_discount_percentage?: number
    created_at: string
    updated_at: string
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type TenantSubscription = {
    id: number
    tenant_id: number
    package_id: number
    status: 'active' | 'cancelled' | 'expired' | 'trial'
    starts_at: string
    ends_at: string
    billing_cycle: 'monthly' | 'yearly'
    created_at: string
    package?: Package
}

export type SubscriptionUsage = {
    schools: { used: number; limit: number }
    students: { used: number; limit: number }
    classes: { used: number; limit: number }
}

// ─── School ──────────────────────────────────────────────────────────────────

export type School = {
    id: number
    tenant_id: number
    name: string
    address?: string
    phone?: string
    email?: string
    status?: string
    max_students?: number
    created_at: string
    updated_at: string
    classes_count?: number
    children_count?: number
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type Invoice = {
    id: number
    invoice_number?: string
    user_id?: number
    tenant_id?: number
    type: 'b2b' | 'b2c'
    status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'
    subtotal: number
    tax_amount: number
    total_amount: number
    currency: string
    due_date?: string
    paid_at?: string
    created_at: string
    items?: InvoiceItem[]
}

export type InvoiceItem = {
    id: number
    invoice_id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type TenantNotification = {
    id: number
    title: string
    body: string
    type: string
    is_read: boolean
    created_at: string
}
