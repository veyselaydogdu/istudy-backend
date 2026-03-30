<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Base\BaseController;
use App\Models\Tenant\Tenant;

class BaseTenantController extends BaseController
{
    protected function tenant(): Tenant
    {
        $tenantId = $this->user()?->tenant_id;

        if (! $tenantId) {
            abort(403, 'Tenant bulunamadı.');
        }

        return Tenant::findOrFail($tenantId);
    }
}
