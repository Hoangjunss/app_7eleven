"use client";

/**
 * Premium Login page with Glassmorphism styles and brand compliance.
 * Handles form validation via react-hook-form + zod, updates zustand store,
 * and performs role-based redirects.
 */
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Vui lòng điền đầy đủ thông tin: Email" }).email({ message: "Vui lòng nhập đúng định dạng email" }),
  password: z.string().min(1, { message: "Vui lòng điền đầy đủ thông tin: Mật khẩu" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, role } = useAuthStore();

  // Read error query parameter and display it once
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
      // Remove query param to avoid repeating toast on refresh/render
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, role, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const authResponse = await login(data.email, data.password);
      toast.success("Đăng nhập thành công!");
      
      if (authResponse.roles.includes("ADMIN")) {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const apiError =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(apiError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-radial from-zinc-900 via-zinc-950 to-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105">
            <span className="text-2xl font-black text-white italic tracking-tighter">7E</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Access the 7-Eleven Management System
          </p>
        </div>

        <Card className="border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <Field>
                <FieldLabel htmlFor="email" className="text-white/80">
                  Email address
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@7eleven.com"
                  className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus-visible:border-primary focus-visible:ring-primary/50"
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError className="text-destructive">{errors.email.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-white/80">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus-visible:border-primary focus-visible:ring-primary/50"
                  {...register("password")}
                />
                {errors.password && (
                  <FieldError className="text-destructive">{errors.password.message}</FieldError>
                )}
              </Field>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-white/10 bg-white/5 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-secondary text-white font-semibold transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
