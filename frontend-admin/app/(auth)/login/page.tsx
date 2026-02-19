"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import apiClient from "@/lib/apiClient"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Zod Schema for Validation
const loginSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true)
        try {
            const response = await apiClient.post('/auth/login', data)
            const token = response.data?.data?.token

            if (!token) {
                throw new Error("Token alınamadı.")
            }

            localStorage.setItem('admin_token', token)
            toast.success("Giriş başarılı!")
            router.push("/")
        } catch (error: any) {
            const message = error.response?.data?.message || "E-posta veya şifre hatalı."
            toast.error("Giriş Başarısız", { description: message })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-indigo-600">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">iStudy Admin</CardTitle>
                    <CardDescription className="text-center">
                        Yönetici hesabınızla giriş yapın
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@istudy.com"
                                {...register("email")}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Şifre</Label>
                                <a
                                    href="#"
                                    className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                    Şifremi Unuttum?
                                </a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Giriş Yapılıyor...
                                </>
                            ) : (
                                "Giriş Yap"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
