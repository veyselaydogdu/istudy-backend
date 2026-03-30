"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RootPage() {
    const router = useRouter()

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
        if (token) {
            router.replace("/tenants")
        } else {
            router.replace("/login")
        }
    }, [router])

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    )
}
