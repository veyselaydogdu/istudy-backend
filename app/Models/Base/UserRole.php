<?php

namespace App\Models\Base;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Sistem rolleri — sabit ID'ler ile tanımlanmış lookup tablosu.
 *
 * @property int $id
 * @property string $name
 * @property string $label
 */
class UserRole extends Model
{
    protected $table = 'user_roles';

    protected $fillable = ['id', 'name', 'label'];

    /** Rol ID sabitleri */
    public const SUPER_ADMIN = 1;

    public const TENANT = 5;

    public const TEACHER = 10;

    public const PARENT = 15;

    public const STUDENT = 20;

    /** Tenant paneline giriş yapabilecek roller */
    public const TENANT_PANEL_ROLES = [self::SUPER_ADMIN, self::TENANT];

    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
