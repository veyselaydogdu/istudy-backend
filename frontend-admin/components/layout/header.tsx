"use client"

import { Bell, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Header() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-slate-950 lg:ml-64 sticky top-0 z-20 shadow-sm">
            <div className="w-full flex-1" />
            <div className="flex items-center gap-2">
                {mounted && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        title="Tema Değiştir"
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5 text-slate-500" />
                        ) : (
                            <Moon className="h-5 w-5 text-slate-500" />
                        )}
                        <span className="sr-only">Tema Değiştir</span>
                    </Button>
                )}
                <Button size="icon" variant="ghost" className="relative">
                    <Bell className="h-5 w-5 text-slate-500" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"></span>
                    <span className="sr-only">Bildirimler</span>
                </Button>
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    SA
                </div>
            </div>
        </header>
    )
}
