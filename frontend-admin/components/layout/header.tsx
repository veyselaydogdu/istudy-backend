import { Bell, Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 dark:bg-slate-950 lg:ml-64 sticky top-0 z-20 shadow-sm">
            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <Input
                            className="w-full bg-white pl-8 shadow-none md:w-2/3 lg:w-1/3 dark:bg-slate-950"
                            placeholder="Ara..."
                            type="search"
                        />
                    </div>
                </form>
            </div>
            <div className="flex items-center gap-4">
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
