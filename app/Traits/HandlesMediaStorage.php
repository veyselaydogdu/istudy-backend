<?php

namespace App\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Private/public dosya depolama ve güvenli URL üretimi için ortak trait.
 *
 * Private dosyalar: storage/app/private/ (web'den erişilemez)
 * Public dosyalar: storage/app/public/ (symlink ile web'den erişilebilir)
 *
 * Kullanım:
 *   use HandlesMediaStorage;
 *   $path = $this->storePrivate($file, 'folder/sub');
 *   $url  = $this->privateSignedUrl('route.name', ['id' => 1]);
 *   return $this->servePrivate($path);
 */
trait HandlesMediaStorage
{
    /**
     * Dosyayı private (local) diske kaydeder.
     * storage/app/private/{folder}/ altına yazar, web'den erişilemez.
     */
    protected function storePrivate(UploadedFile $file, string $folder): string
    {
        return $file->store($folder, 'local');
    }

    /**
     * Dosyayı public diske kaydeder (web'den erişilebilir).
     * storage/app/public/{folder}/ altına yazar.
     */
    protected function storePublic(UploadedFile $file, string $folder): string
    {
        return $file->store($folder, 'public');
    }

    /**
     * Private diskten dosya siler (null-safe, yoksa sessizce geçer).
     */
    protected function deletePrivate(?string $path): void
    {
        if ($path && Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
        }
    }

    /**
     * Public diskten dosya siler (null-safe).
     */
    protected function deletePublic(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Private dosya için imzalı route URL'i üretir.
     * Hem auth:sanctum hem signed middleware kullanılan route'lar için.
     *
     * @param  array<string, mixed>  $params
     */
    protected function privateSignedUrl(string $routeName, array $params, int $minutes = 5): string
    {
        return URL::signedRoute($routeName, $params, now()->addMinutes($minutes));
    }

    /**
     * Private diskten dosyayı güvenli HTTP response olarak sunar.
     * Cache engelleyici header'lar ekler.
     * Dosya yoksa 404 döner.
     *
     * @param  array<string, string>  $extraHeaders
     */
    protected function servePrivate(
        string $path,
        ?string $filename = null,
        array $extraHeaders = []
    ): StreamedResponse|\Illuminate\Http\Response {
        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, $filename, array_merge([
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ], $extraHeaders));
    }

    /**
     * Private diskten dosyanın içeriğini binary string olarak döner.
     * Dosya yoksa null döner.
     */
    protected function readPrivate(string $path): ?string
    {
        if (! Storage::disk('local')->exists($path)) {
            return null;
        }

        return Storage::disk('local')->get($path);
    }

    /**
     * Private diskteki dosyanın MIME tipini döner.
     */
    protected function mimeTypePrivate(string $path): string
    {
        return Storage::disk('local')->mimeType($path) ?: 'application/octet-stream';
    }
}
