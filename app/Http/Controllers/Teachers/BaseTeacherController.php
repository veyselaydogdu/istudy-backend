<?php

namespace App\Http\Controllers\Teachers;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\TeacherProfile;

class BaseTeacherController extends BaseController
{
    protected function teacherProfile(): TeacherProfile
    {
        return $this->user()->teacherProfiles()->firstOrFail();
    }
}
