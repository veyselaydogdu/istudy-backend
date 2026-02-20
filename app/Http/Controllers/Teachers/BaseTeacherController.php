<?php

namespace App\Http\Controllers\Teachers;

use App\Http\Controllers\Base\BaseController;
use App\Models\School\TeacherProfile;
use Illuminate\Http\JsonResponse;

class BaseTeacherController extends BaseController
{
    /**
     * Giriş yapmış kullanıcının öğretmen profilini döner.
     * Profil bulunamazsa 404 JsonResponse fırlatır.
     *
     * @throws JsonResponse
     */
    protected function teacherProfile(): TeacherProfile|JsonResponse
    {
        $profile = $this->user()?->teacherProfiles()->first();

        if (! $profile) {
            return $this->errorResponse('Öğretmen profili bulunamadı.', 404);
        }

        return $profile;
    }
}
