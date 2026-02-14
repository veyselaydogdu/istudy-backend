<?php

namespace App\Models\School;

use App\Models\Academic\SchoolClass;
use App\Models\Base\BaseModel;
use App\Models\Base\Country;
use App\Models\User;

/**
 * TeacherProfile — Öğretmen Profili
 *
 * Bir öğretmenin bir okuldaki profili.
 * CV/özgeçmiş, eğitim geçmişi, sertifikalar, kurslar ve yetenekler bu profil üzerinden yönetilir.
 */
class TeacherProfile extends BaseModel
{
    protected $table = 'teacher_profiles';

    protected $fillable = [
        'user_id',
        'school_id',
        'title',
        'date_of_birth',
        'gender',
        'nationality',
        'country_id',
        'profile_photo',
        'bio',
        'education_summary',
        'experience_years',
        'specialization',
        'hire_date',
        'employment_type',
        'linkedin_url',
        'website_url',
        'profile_completeness',
        'languages',
        'certifications',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'languages'             => 'array',
        'certifications'        => 'array',
        'experience_years'      => 'integer',
        'profile_completeness'  => 'integer',
        'date_of_birth'         => 'date',
        'hire_date'             => 'date',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relations — Mevcut
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id')->withDefault();
    }

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id')->withDefault();
    }

    public function classes()
    {
        return $this->belongsToMany(SchoolClass::class, 'class_teacher_assignments', 'teacher_profile_id', 'class_id')
            ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Relations — Yeni Profil Bileşenleri
    |--------------------------------------------------------------------------
    */

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    /**
     * Eğitim geçmişi
     */
    public function educations()
    {
        return $this->hasMany(TeacherEducation::class, 'teacher_profile_id')
            ->orderByDesc('start_date');
    }

    /**
     * Sertifikalar (tümü)
     */
    public function certificates()
    {
        return $this->hasMany(TeacherCertificate::class, 'teacher_profile_id')
            ->orderByDesc('issue_date');
    }

    /**
     * Onaylı sertifikalar
     */
    public function approvedCertificates()
    {
        return $this->hasMany(TeacherCertificate::class, 'teacher_profile_id')
            ->where('approval_status', 'approved')
            ->orderByDesc('issue_date');
    }

    /**
     * Onay bekleyen sertifikalar
     */
    public function pendingCertificates()
    {
        return $this->hasMany(TeacherCertificate::class, 'teacher_profile_id')
            ->where('approval_status', 'pending');
    }

    /**
     * Kurs & Seminer katılımları (tümü)
     */
    public function courses()
    {
        return $this->hasMany(TeacherCourse::class, 'teacher_profile_id')
            ->orderByDesc('start_date');
    }

    /**
     * Onaylı kurs & seminer katılımları
     */
    public function approvedCourses()
    {
        return $this->hasMany(TeacherCourse::class, 'teacher_profile_id')
            ->where('approval_status', 'approved')
            ->orderByDesc('start_date');
    }

    /**
     * Onay bekleyen kurs & seminer katılımları
     */
    public function pendingCourses()
    {
        return $this->hasMany(TeacherCourse::class, 'teacher_profile_id')
            ->where('approval_status', 'pending');
    }

    /**
     * Yetenekler & Uzmanlık alanları
     */
    public function skills()
    {
        return $this->hasMany(TeacherSkill::class, 'teacher_profile_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Profil tamamlanma yüzdesini hesapla
     */
    public function getCalculatedCompletenessAttribute(): int
    {
        $score = 0;
        $total = 10;

        // Temel bilgiler
        if ($this->bio) $score++;
        if ($this->title) $score++;
        if ($this->date_of_birth) $score++;
        if ($this->profile_photo) $score++;
        if ($this->specialization) $score++;
        if ($this->experience_years > 0) $score++;

        // İlişkili veriler
        if ($this->educations()->exists()) $score++;
        if ($this->approvedCertificates()->exists()) $score++;
        if ($this->approvedCourses()->exists()) $score++;
        if ($this->skills()->exists()) $score++;

        return (int) round(($score / $total) * 100);
    }

    /**
     * Tam ad (title + user name)
     */
    public function getFullTitleAttribute(): string
    {
        $title = $this->title ? "{$this->title} " : '';

        return "{$title}{$this->user->name}";
    }

    /**
     * İstihdam türü etiketi
     */
    public function getEmploymentTypeLabelAttribute(): string
    {
        return match ($this->employment_type) {
            'full_time'  => 'Tam Zamanlı',
            'part_time'  => 'Yarı Zamanlı',
            'contract'   => 'Sözleşmeli',
            'intern'     => 'Stajyer',
            'volunteer'  => 'Gönüllü',
            default      => $this->employment_type ?? 'Belirtilmemiş',
        };
    }

    /**
     * Tüm onay bekleyen öğe sayısı
     */
    public function getPendingApprovalCountAttribute(): int
    {
        return $this->pendingCertificates()->count() + $this->pendingCourses()->count();
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Profil tamamlanma yüzdesini güncelle
     */
    public function updateCompleteness(): void
    {
        $this->update([
            'profile_completeness' => $this->calculated_completeness,
        ]);
    }
}
