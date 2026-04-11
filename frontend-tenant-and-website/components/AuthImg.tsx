'use client'

import { useAuthImage } from '@/hooks/useAuthImage'

interface AuthImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | null | undefined
    fallback?: React.ReactNode
}

/**
 * Bearer token ile auth gerektiren private API görsel URL'lerini yükler.
 * src prop'u bir API endpoint URL'i olmalıdır (blob URL veya data URL değil).
 *
 * @example
 * <AuthImg src={cls.logo_url} alt="logo" className="h-10 w-10 rounded-xl object-cover" />
 */
export default function AuthImg({ src, fallback = null, alt, ...props }: AuthImgProps) {
    const blobSrc = useAuthImage(src)

    if (!blobSrc) return <>{fallback}</>

    // eslint-disable-next-line @next/next/no-img-element
    return <img src={blobSrc} alt={alt ?? ''} {...props} />
}
