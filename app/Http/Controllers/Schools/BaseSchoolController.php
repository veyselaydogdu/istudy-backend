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
        $schoolId = request('school_id');

        // If no school_id provided, we might default or let it pass if route doesn't require it,
        // but typically school routes need context. Assuming strict check if ID present.
        if ($schoolId) {
            $hasAccess = $user->schools()
                ->where('schools.id', $schoolId)
                ->exists();

            if (! $hasAccess) {
                abort(403, 'Bu okula erişim yetkiniz yok.');
            }

            // Cache the school model
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
