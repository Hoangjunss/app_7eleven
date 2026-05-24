"use client";

/**
 * Premium Register page with Glassmorphism styles and brand compliance.
 * Handles form validation via react-hook-form + zod, and redirects on successful sign-up.
 * Field matching: email, password, and fullName (phone excluded for backend parity).
 */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Vui lòng điền đầy đủ thông tin: Họ và tên"),
    email: z
      .string()
      .min(1, "Vui lòng điền đầy đủ thông tin: Email")
      .email("Vui lòng nhập đúng định dạng email"),
    password: z
      .string()
      .min(1, "Vui lòng điền đầy đủ thông tin: Mật khẩu")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng điền đầy đủ thông tin: Xác nhận mật khẩu")
      .min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register: registerUser, isAuthenticated, role } = useAuthStore();

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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { email, password, fullName } = data;
      await registerUser({ email, password, fullName });
      toast.success("Đăng ký tài khoản thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Register error:", error);
      const apiError =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
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
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Join the 7-Eleven Management System
          </p>
        </div>

        <Card className="border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <Field>
                <FieldLabel htmlFor="fullName" className="text-white/80">
                  Full Name
                </FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus-visible:border-primary focus-visible:ring-primary/50"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <FieldError className="text-destructive">{errors.fullName.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className="text-white/80">
                  Email address
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
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

              <Field>
                <FieldLabel htmlFor="confirmPassword" className="text-white/80">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="border-white/10 bg-white/5 text-white placeholder-zinc-500 focus-visible:border-primary focus-visible:ring-primary/50"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <FieldError className="text-destructive">
                    {errors.confirmPassword.message}
                  </FieldError>
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
                    Registering...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
