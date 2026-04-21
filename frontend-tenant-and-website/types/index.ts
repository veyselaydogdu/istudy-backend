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
    icon?: string | null
    logo?: string | null
    logo_url?: string | null
    is_active?: boolean
    children_count?: number
    teachers_count?: number
    created_at?: string
}

// ─── Teacher ─────────────────────────────────────────────────────────────────

/** Sınıf atama modalinde kullanılan minimal öğretmen tipi */
export type Teacher = {
    id: number
    user_id: number
    school_id?: number | null
    name: string
    title?: string
    role?: string
    role_type?: { id: number; name: string } | null
}

/** Tenant-level öğretmen yönetim sayfasında kullanılan tam profil tipi */
export type TeacherProfile = {
    id: number
    user_id: number
    name: string
    email?: string
    phone?: string
    phone_country_code?: string | null
    whatsapp_number?: string | null
    whatsapp_country_code?: string | null
    nationality_country_id?: number | null
    nationality?: { id: number; name: string; iso2: string; flag_emoji: string | null } | null
    identity_number?: string | null
    passport_number?: string | null
    title?: string
    specialization?: string
    employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern' | 'volunteer'
    employment_label?: string
    experience_years?: number
    profile_photo?: string | null
    bio?: string
    hire_date?: string | null
    linkedin_url?: string | null
    website_url?: string | null
    school_count?: number
    schools?: { id: number; name: string; is_active: boolean; role_type_name?: string | null }[]
    classes?: { id: number; name: string; school_id: number }[]
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
    photo_url?: string | null
    ingredients?: { id: number; name: string; allergens?: { id: number; name: string }[] }[]
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
    is_enrollment_required?: boolean
    cancellation_allowed?: boolean
    cancellation_deadline?: string | null
    price?: number
    capacity?: number | null
    start_date?: string
    start_time?: string | null
    end_date?: string
    end_time?: string | null
    address?: string | null
    materials?: string[]
    school?: { id: number; name: string }
    classes?: SchoolClass[]
    enrollments_count?: number
    gallery_count?: number
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
}

export type ActivityGalleryItem = {
    id: number
    file_type: 'image' | 'video' | 'document'
    mime_type: string
    file_size: number
    original_name: string
    caption?: string | null
    sort_order: number
    url: string
    created_at: string
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
    first_name: string
    last_name: string
    // legacy aliases returned by ChildResource
    name: string
    surname: string
    full_name: string
    birth_date?: string
    gender?: string
    blood_type?: string
    identity_number?: string
    passport_number?: string
    parent_notes?: string
    special_notes?: string
    languages?: string[]
    status?: string
    profile_photo?: string
    school_id?: number
    academic_year_id?: number
    nationality?: { id: number; name: string; flag_emoji?: string } | null
    family_profile?: {
        id: number
        family_name?: string
        owner?: { id: number; name: string; surname: string; email: string; phone?: string } | null
        members?: Array<{
            id: number
            role: string
            is_active: boolean
            user?: { id: number; name: string; surname: string; email: string; phone?: string } | null
        }>
    } | null
    classes?: Array<{ id: number; name: string; school_id: number }>
    allergens?: Array<{ id: number; name: string; status?: string }>
    conditions?: Array<{ id: number; name: string; status?: string }>
    medications?: Array<{ id: number; name: string }>
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type Invoice = {
    id: number
    invoice_no?: string
    invoice_number?: string  // legacy compat
    type: string
    module: 'subscription' | 'activity_class' | 'manual' | 'event' | 'activity'
    invoice_type: 'invoice' | 'refund'
    original_invoice_id?: number | null
    refund_reason?: string | null
    status: 'draft' | 'pending' | 'paid' | 'cancelled' | 'overdue' | 'refunded'
    subtotal: number
    tax_rate: number
    tax_amount: number
    discount_amount: number
    total_amount: number
    currency: string
    notes?: string | null
    issue_date?: string | null
    due_date?: string | null
    paid_at?: string | null
    is_overdue?: boolean
    created_at: string
    updated_at?: string
    user?: { id: number; name: string; email: string } | null
    school?: { id: number; name: string } | null
    tenant?: { id: number; name: string } | null
    activity_class_invoice?: {
        id: number
        invoice_number: string
        child?: { id: number; full_name: string } | null
    } | null
    items?: InvoiceItem[]
    transactions?: Transaction[]
    transactions_count?: number
}

export type InvoiceItem = {
    id: number
    invoice_id: number
    description: string
    quantity: number
    unit_price: number
    total_price: number
    item_type?: string | null
}

export type Transaction = {
    id: number
    order_id: string
    invoice_id: number
    amount: number
    currency: string
    status: 0 | 1 | 2  // 0=Bekliyor, 1=Başarılı, 2=Başarısız
    payment_gateway?: string
    bank_name?: string | null
    card_last_four?: string | null
    card_type?: string | null
    installment?: number
    error_message?: string | null
    completed_at?: string | null
    created_at: string
}

export type InvoiceStats = {
    total_invoices: number
    draft_count: number
    pending_count: number
    paid_count: number
    overdue_count: number
    cancelled_count: number
    refunded_count: number
    total_revenue: number
    pending_revenue: number
    this_month_revenue: number
    this_month_invoices: number
    by_module: {
        subscription: number
        activity_class: number
        manual: number
    }
}

// ─── Teacher Role Type ────────────────────────────────────────────────────────

export type TeacherRoleType = {
    id: number
    tenant_id: number
    name: string
    sort_order?: number
    is_active?: boolean
}

/** Okul detay sayfasının Öğretmenler sekmesinde kullanılır */
export type SchoolTeacher = {
    id: number
    user_id: number
    name: string
    title?: string
    employment_type?: string
    is_active: boolean
    role_type?: { id: number; name: string } | null
    classes?: Array<{ id: number; name: string }>
}

// ─── Enrollment Request (Veli Kayıt Talebi) ──────────────────────────────────

export type EnrollmentRequest = {
    id: number
    school_id: number
    parent_name?: string | null
    parent_surname?: string | null
    parent_email?: string | null
    parent_phone?: string | null
    status: 'pending' | 'approved' | 'rejected'
    message?: string | null
    rejection_reason?: string | null
    reviewed_at?: string | null
    reviewer?: { id: number; name: string } | null
    created_at: string
}

/** Okula kayıtlı veli */
export type SchoolParent = {
    id: number
    family_name?: string | null
    owner_name: string
    email?: string | null
    phone?: string | null
    children: { id: number; name: string; birth_date?: string | null; gender?: string | null; status?: string | null }[]
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

export type SocialPostEditSnapshot = {
    edited_at: string
    title: string | null
    content: string | null
    visibility: string
    is_pinned: boolean
}

export type SocialPost = {
    id: number
    school_id: number
    title?: string | null
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
    edit_history: SocialPostEditSnapshot[]
    reactions_count: number
    user_reaction?: 'like' | 'heart' | 'clap' | null
    comments_count: number
    created_at: string
    updated_at?: string | null
}

export type SocialPostComment = {
    id: number
    is_deleted: boolean
    user: {
        id: number
        name: string
        avatar?: string | null
    }
    content: string | null
    parent_id?: number | null
    replies?: SocialPostComment[]
    deleted_at?: string | null
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

// ─── Activity Classes ─────────────────────────────────────────────────────────

export type ActivityClass = {
    id: number
    school_id: number | null
    name: string
    description?: string | null
    language: string
    age_min?: number | null
    age_max?: number | null
    capacity?: number | null
    active_enrollments_count?: number
    is_school_wide: boolean
    is_active: boolean
    is_paid: boolean
    price?: string | null
    currency: string
    invoice_required: boolean
    start_date?: string | null
    end_date?: string | null
    schedule?: string | null
    location?: string | null
    address?: string | null
    notes?: string | null
    school_classes?: Array<{ id: number; name: string }>
    teachers?: Array<{ id: number; name: string; role?: string | null }>
    materials?: ActivityClassMaterial[]
    created_at: string
    updated_at: string
}

export type ActivityClassMaterial = {
    id: number
    activity_class_id: number
    name: string
    description?: string | null
    quantity?: string | null
    is_required: boolean
    sort_order: number
}

export type ActivityClassEnrollment = {
    id: number
    activity_class_id: number
    child_id: number
    status: 'pending' | 'active' | 'cancelled'
    enrolled_by: 'tenant' | 'parent'
    enrolled_at: string
    notes?: string | null
    child?: { id: number; full_name: string; birth_date?: string }
    invoice?: ActivityClassInvoice | null
}

export type ActivityClassInvoice = {
    id: number
    invoice_number: string
    invoice_type: 'invoice' | 'refund'
    original_invoice_id?: number | null
    refund_reason?: string | null
    amount: string
    currency: string
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
    payment_required: boolean
    due_date?: string | null
    paid_at?: string | null
    payment_method?: string | null
    notes?: string | null
    child?: { id: number; full_name: string } | null
    refund_invoice?: { id: number; invoice_number: string; status: string } | null
}

export type ActivityClassGalleryItem = {
    id: number
    caption?: string | null
    url: string
    sort_order: number
    original_name?: string | null
    mime_type?: string | null
    file_size?: number | null
    created_at: string
}
