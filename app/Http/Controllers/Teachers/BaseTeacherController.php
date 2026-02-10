<?php

namespace App\Http\Controllers\Teachers;

use App\Http\Controllers\Base\BaseController;

class BaseTeacherController extends BaseController
{
    protected function teacherUser()
    {
        return auth('sanctum')->user();
    }
}
