"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("admin_token")
        if (!token) {
            router.push("/login")
        } else {
            setIsAuthenticated(true)
        }
    }, [router])

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900">
            <Sidebar />
            <div className="flex flex-col">
                <Header />
                <main className="flex-1 p-6 lg:ml-64">
                    {children}
                </main>
            </div>
        </div>
    )
}
