import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "success" | "warning" | "danger" | "secondary" | "outline"

type BadgeProps = {
    variant?: BadgeVariant
    className?: string
    children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    secondary: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    outline: "border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
