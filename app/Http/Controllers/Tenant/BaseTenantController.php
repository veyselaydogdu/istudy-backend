<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Base\BaseController;
use App\Models\Tenant\Tenant;

class BaseTenantController extends BaseController
{
    protected function tenant(): Tenant
    {
        return $this->user()->tenants()->firstOrFail();
    }
}
