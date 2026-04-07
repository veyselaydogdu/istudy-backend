<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->ulid,
            'user_id' => $this->user_id,
            'school_id' => $this->school_id,

            // Kişisel bilgiler
            'title' => $this->title,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'gender' => $this->gender,
            'nationality' => $this->nationality,
            'profile_photo' => $this->profile_photo,

            // Profesyonel bilgiler
            'bio' => $this->bio,
            'education_summary' => $this->education_summary,
            'experience_years' => $this->experience_years,
            'specialization' => $this->specialization,
            'hire_date' => $this->hire_date?->format('Y-m-d'),
            'employment_type' => $this->employment_type,
            'employment_type_label' => $this->employment_type_label,
            'languages' => $this->languages,

            // Sosyal
            'linkedin_url' => $this->linkedin_url,
            'website_url' => $this->website_url,

            // Profil tamamlanma
            'profile_completeness' => $this->profile_completeness,
            'full_title' => $this->full_title,

            // Onay istatistikleri
            'pending_approval_count' => $this->when(
                $this->relationLoaded('pendingCertificates') || $this->relationLoaded('pendingCourses'),
                fn () => $this->pending_approval_count
            ),

            // İlişkiler
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),

            'school' => $this->whenLoaded('school', fn () => [
                'id' => $this->school->id,
                'name' => $this->school->name,
            ]),

            'country' => $this->whenLoaded('country', fn () => [
                'id' => $this->country->id,
                'name' => $this->country->name,
                'iso2' => $this->country->iso2,
                'flag_emoji' => $this->country->flag_emoji,
            ]),

            // CV Bileşenleri
            'educations' => $this->whenLoaded('educations', fn () => $this->educations->map(fn ($e) => [
                'id' => $e->id,
                'institution' => $e->institution,
                'degree' => $e->degree,
                'degree_label' => $e->degree_label,
                'field_of_study' => $e->field_of_study,
                'start_date' => $e->start_date?->format('Y-m-d'),
                'end_date' => $e->end_date?->format('Y-m-d'),
                'is_current' => $e->is_current,
                'gpa' => $e->gpa,
                'description' => $e->description,
                'country' => $e->country ? [
                    'id' => $e->country->id, 'name' => $e->country->name,
                    'flag_emoji' => $e->country->flag_emoji,
                ] : null,
            ])
            ),

            'certificates' => $this->whenLoaded('certificates', fn () => $this->certificates->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'issuing_organization' => $c->issuing_organization,
                'issue_date' => $c->issue_date?->format('Y-m-d'),
                'expiry_date' => $c->expiry_date?->format('Y-m-d'),
                'credential_id' => $c->credential_id,
                'credential_url' => $c->credential_url,
                'approval_status' => $c->approval_status,
                'status_label' => $c->status_label,
                'is_expired' => $c->isExpired(),
                'rejection_reason' => $c->rejection_reason,
                'approved_at' => $c->approved_at?->format('Y-m-d H:i'),
            ])
            ),

            'courses' => $this->whenLoaded('courses', fn () => $this->courses->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'type_label' => $c->type_label,
                'provider' => $c->provider,
                'start_date' => $c->start_date?->format('Y-m-d'),
                'end_date' => $c->end_date?->format('Y-m-d'),
                'duration_hours' => $c->duration_hours,
                'is_online' => $c->is_online,
                'approval_status' => $c->approval_status,
                'status_label' => $c->status_label,
                'rejection_reason' => $c->rejection_reason,
                'approved_at' => $c->approved_at?->format('Y-m-d H:i'),
            ])
            ),

            'skills' => $this->whenLoaded('skills', fn () => $this->skills->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'level' => $s->level,
                'level_label' => $s->level_label,
                'category' => $s->category,
                'category_label' => $s->category_label,
                'proficiency' => $s->proficiency,
            ])
            ),

            'classes' => $this->whenLoaded('classes', fn () => $this->classes->map(fn ($cl) => [
                'id' => $cl->id,
                'name' => $cl->name,
            ])
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
