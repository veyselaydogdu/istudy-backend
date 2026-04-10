import { useEffect, useState } from 'react'
import apiClient from '@/lib/apiClient'

/**
 * Auth gerektiren private API URL'lerini Bearer token ile çekip
 * blob URL'e çevirir. <img src={blobUrl}> ile kullanılır.
 *
 * @example
 * const src = useAuthImage(cls.logo_url)
 * return <img src={src ?? ''} alt="logo" />
 */
export function useAuthImage(url: string | null | undefined): string | null {
    const [src, setSrc] = useState<string | null>(null)

    useEffect(() => {
        if (!url) {
            setSrc(null)
            return
        }

        let objectUrl: string | null = null
        let cancelled = false

        apiClient
            .get(url, { responseType: 'blob', baseURL: '' })
            .then((res) => {
                if (cancelled) return
                objectUrl = URL.createObjectURL(res.data as Blob)
                setSrc(objectUrl)
            })
            .catch(() => {
                if (!cancelled) setSrc(null)
            })

        return () => {
            cancelled = true
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [url])

    return src
}
