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

// ─── Country ─────────────────────────────────────────────────────────────────

export type Country = {
    id: number
    name: string
    iso2: string
    phone_code?: string
}

// ─── School ──────────────────────────────────────────────────────────────────

export type School = {
    id: number
    tenant_id: number
    country_id?: number
    name: string
    description?: string
    code?: string
    address?: string
    city?: string
    phone?: string
    fax?: string
    gsm?: string
    whatsapp?: string
    email?: string
    website?: string
    status?: string
    is_active?: boolean
    created_at: string
    updated_at: string
    classes_count?: number
    children_count?: number
    country?: { id: number; name: string; iso2: string }
}

// ─── Class ───────────────────────────────────────────────────────────────────

export type SchoolClass = {
    id: number
    school_id: number
    academic_year_id?: number
    name: string
    description?: string
    age_min?: number
    age_max?: number
    capacity?: number
    color?: string
    is_active?: boolean
    children_count?: number
    teachers_count?: number
    created_at?: string
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

export type Teacher = {
    id: number
    user_id: number
    school_id: number
    name: string
    title?: string
    role?: string
}

// ─── Allergen ────────────────────────────────────────────────────────────────

export type Allergen = {
    id: number
    name: string
    description?: string
    risk_level?: 'low' | 'medium' | 'high'
    tenant_id?: number | null
}

// ─── Meal & Food ─────────────────────────────────────────────────────────────

export type FoodIngredient = {
    id: number
    name: string
    is_custom?: boolean
    allergens?: Allergen[]
}

export type Meal = {
    id: number
    school_id: number
    name: string
    meal_type?: string
    ingredients?: { id: number; name: string }[]
}

export type SchoolMealType = {
    id: number
    school_id: number
    name: string
    sort_order?: number
    is_active?: boolean
}

// ─── Supply List ─────────────────────────────────────────────────────────────

export type SupplyItem = {
    id: number
    name: string
    description?: string
    quantity?: number
    due_date?: string
    class_id?: number
    school_id?: number
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export type Attendance = {
    id: number
    child_id: number
    class_id: number
    attendance_date: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
}

// ─── Activity / Event ────────────────────────────────────────────────────────

export type Activity = {
    id: number
    school_id: number
    academic_year_id?: number
    name: string
    description?: string
    is_paid?: boolean
    price?: number
    start_date?: string
    end_date?: string
    classes?: SchoolClass[]
    created_at?: string
}

export type AcademicYear = {
    id: number
    school_id: number
    name: string
    start_date: string
    end_date: string
    is_active?: boolean
}

// ─── Child ───────────────────────────────────────────────────────────────────

export type Child = {
    id: number
    name: string
    surname?: string
    birth_date?: string
    gender?: string
    status?: string
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

// ─── Social Network ──────────────────────────────────────────────────────────

export type SocialPostMedia = {
    id: number
    type: 'image' | 'video' | 'file'
    url: string
    original_name: string
    file_size: number
    mime_type?: string
    sort_order?: number
}

export type SocialPost = {
    id: number
    school_id: number
    visibility: 'school' | 'class'
    content?: string | null
    is_pinned: boolean
    published_at?: string | null
    author: {
        id: number
        name: string
        avatar?: string | null
    }
    media: SocialPostMedia[]
    classes?: { id: number; name: string }[]
    reactions_count: number
    user_reaction?: 'like' | 'heart' | 'clap' | null
    comments_count: number
    created_at: string
}

export type SocialPostComment = {
    id: number
    user: {
        id: number
        name: string
        avatar?: string | null
    }
    content: string
    parent_id?: number | null
    replies?: SocialPostComment[]
    created_at: string
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
