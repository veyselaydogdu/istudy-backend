<?php

namespace App\Http\Controllers\Admins;

use App\Http\Controllers\Base\BaseController;

class BaseSchoolAdminController extends BaseController
{
    protected function adminUser()
    {
        return auth('sanctum')->user();
    }
}
