<?php

namespace App\Http\Controllers\Parents;

use App\Http\Controllers\Base\BaseController;
use App\Models\Child\FamilyProfile;

class BaseParentController extends BaseController
{
    protected function familyProfile(): FamilyProfile
    {
        return $this->user()->familyProfiles()->firstOrFail();
    }
}
