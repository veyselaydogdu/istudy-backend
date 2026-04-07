<?php

namespace App\Http\Controllers\Schools;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\School;

class BaseSchoolController extends BaseController
{
    protected ?School $school = null;

    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $this->validateSchoolAccess();

            return $next($request);
        });
    }

    /**
     * Validate user access for school context.
     *
     * Supports both ULID (26-char) and legacy integer school_id params
     * so the frontend can transition gradually.
     */
    protected function validateSchoolAccess(): void
    {
        $user = $this->user();
        $schoolParam = request()->route('school_id') ?? request('school_id');

        if ($schoolParam) {
            // Resolve by ULID (26-char alphanum) or by integer PK (legacy)
            $query = School::where('tenant_id', $user->tenant_id);

            if (is_numeric($schoolParam)) {
                $query->where('id', (int) $schoolParam);
            } else {
                $query->where('ulid', $schoolParam);
            }

            $school = $query->first();

            if (! $school) {
                abort(403, 'Bu okula erişim yetkiniz yok.');
            }

            $this->school = $school;

            // Normalize the route param to the integer PK so downstream controllers
            // that type-hint `int $school_id` receive the correct integer value,
            // regardless of whether the caller sent a ULID or an integer.
            request()->route()->setParameter('school_id', $school->id);
        }
    }

    /**
     * Get validated school
     */
    protected function getSchool(): ?School
    {
        return $this->school;
    }

    /**
     * Returns the integer PK of the resolved school.
     * Use this in Eloquent queries instead of the raw route param,
     * which may be a ULID string after the hybrid-ULID migration.
     */
    protected function resolvedSchoolId(): ?int
    {
        return $this->school?->id;
    }
}
