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
     * Validate user access for school context
     */
    protected function validateSchoolAccess(): void
    {
        $user = $this->user();
        $schoolId = request()->route('school_id') ?? request('school_id');

        if ($schoolId) {
            $hasAccess = School::where('id', $schoolId)
                ->where('tenant_id', $user->tenant_id)
                ->exists();

            if (! $hasAccess) {
                abort(403, 'Bu okula erişim yetkiniz yok.');
            }

            $this->school = School::find($schoolId);
        }
    }

    /**
     * Get validated school
     */
    protected function getSchool(): ?School
    {
        return $this->school;
    }
}
