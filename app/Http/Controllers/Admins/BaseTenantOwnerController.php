<?php

namespace App\Http\Controllers\Admins;

use App\Http\Controllers\Base\BaseController;

class BaseTenantOwnerController extends BaseController
{
    protected function ownerUser()
    {
        return auth('sanctum')->user();
    }
}
