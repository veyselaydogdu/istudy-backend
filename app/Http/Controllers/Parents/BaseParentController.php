<?php

namespace App\Http\Controllers\Parents;

use App\Http\Controllers\Base\BaseController;

class BaseParentController extends BaseController
{
    protected function parentUser()
    {
        return auth('sanctum')->user();
    }
}
