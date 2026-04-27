<?php

namespace App\Traits;

/**
 * Base64 olarak gelen görsel verisini (JPEG, PNG, BMP) PNG'ye dönüştürür.
 * HEIC/HEIF frontend tarafında JPEG'e dönüştürülerek gönderilir.
 */
trait ConvertsImageToPng
{
    /**
     * @throws \InvalidArgumentException Geçersiz base64 verisi
     * @throws \RuntimeException Görsel açılamadı veya dönüştürülemedi
     */
    protected function convertBase64ToPng(string $base64Data): string
    {
        $binary = base64_decode($base64Data, strict: true);

        if ($binary === false) {
            throw new \InvalidArgumentException('Geçersiz base64 görsel verisi.');
        }

        $image = imagecreatefromstring($binary);

        if ($image === false) {
            throw new \RuntimeException('Görsel okunamadı (GD).');
        }

        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);

        if ($png === false || $png === '') {
            throw new \RuntimeException('PNG dönüşümü başarısız (GD).');
        }

        return $png;
    }
}
