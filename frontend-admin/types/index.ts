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
    tenant_id?: number
    country_id?: number
    created_at: string
    updated_at: string
    roles?: Role[]
    tenant?: Tenant
}

export type Role = {
    id: number
    name: string
    display_name?: string
}

// ─── Tenant ──────────────────────────────────────────────────────────────────

export type Tenant = {
    id: number
    name: string
    contact_email?: string
    status?: string
    owner_user_id?: number
    created_at: string
    updated_at: string
    subscription?: TenantSubscription
    owner?: User
    schools_count?: number
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
    features?: string[]
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
    tenant?: Tenant
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
    tenant?: Tenant
    classes_count?: number
    children_count?: number
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type Invoice = {
    id: number
    invoice_number?: string
    user_id?: number
    tenant_id?: number
    school_id?: number
    type: 'b2b' | 'b2c'
    status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue'
    subtotal: number
    tax_amount: number
    total_amount: number
    currency: string
    due_date?: string
    paid_at?: string
    created_at: string
    tenant?: Tenant
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

export type Transaction = {
    id: number
    invoice_id?: number
    amount: number
    currency: string
    status: 'pending' | 'success' | 'failed' | 'refunded'
    gateway?: string
    gateway_transaction_id?: string
    created_at: string
    invoice?: Invoice
}

export type TransactionStats = {
    total_count: number
    success_count: number
    failed_count: number
    total_amount: number
    success_amount: number
    today_amount: number
    this_month_amount: number
}

// ─── Currency ────────────────────────────────────────────────────────────────

export type Currency = {
    id: number
    code: string
    name: string
    symbol: string
    is_base: boolean
    is_active: boolean
    decimal_places: number
    created_at: string
    exchange_rate?: ExchangeRate
}

export type ExchangeRate = {
    id: number
    base_currency_id: number
    target_currency_id: number
    rate: number
    date: string
}

// ─── Country ─────────────────────────────────────────────────────────────────

export type Country = {
    id: number
    name: string
    iso2: string
    iso3?: string
    phone_code?: string
    flag_emoji?: string
    region?: string
    subregion?: string
    capital?: string
    currency_code?: string
    currency_name?: string
    is_active: boolean
    sort_order?: number
    created_at: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export type DashboardStats = {
    total_tenants: number
    active_tenants: number
    total_schools: number
    total_users: number
    active_subscriptions: number
    monthly_revenue: number
    total_revenue: number
    pending_payments?: number
}

export type RecentActivity = {
    id: number
    user_name: string
    action: string
    model_label: string
    created_at: string
}

// ─── Health ──────────────────────────────────────────────────────────────────

export type Allergen = {
    id: number
    name: string
    description?: string
    risk_level?: 'low' | 'medium' | 'high'
    tenant_id?: number | null
    created_at: string
}

export type MedicalCondition = {
    id: number
    name: string
    description?: string
    tenant_id?: number | null
    created_at: string
}

export type Medication = {
    id: number
    name: string
    usage_notes?: string
    tenant_id?: number | null
    created_at: string
}

export type FoodIngredient = {
    id: number
    name: string
    allergen_info?: string
    allergens?: { id: number; name: string }[]
    tenant_id?: number | null
    created_at: string
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export type ActivityLog = {
    id: number
    user_id?: number
    user_name?: string
    user_email?: string
    model_type?: string
    model_label?: string
    model_id?: number
    action: 'created' | 'updated' | 'deleted' | 'restored' | 'force_deleted'
    old_values?: Record<string, unknown>
    new_values?: Record<string, unknown>
    changed_fields?: string[]
    tenant_id?: number
    school_id?: number
    ip_address?: string
    url?: string
    method?: string
    created_at: string
}

export type ActivityLogStats = {
    total_logs: number
    today: number
    this_week: number
    this_month: number
    by_action: Record<string, number>
}
