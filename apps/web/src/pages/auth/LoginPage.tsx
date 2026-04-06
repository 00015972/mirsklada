/**
 * Login Page
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Mail, Lock, Sun, Moon } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { authApi } from "@/lib/api";
import { useAuthStore, useThemeStore } from "@/stores";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, toggleTheme } = useThemeStore();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);

    try {
      const response = await authApi.signin(data);
      const { user, session, tenants } = response.data;

      await setAuth(user, session, tenants);

      // Redirect based on tenant
      if (tenants.length === 0) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message || "Login failed. Please try again.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors shadow-sm"
        title="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Mirsklada
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Inventory Management System
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Email address"
                  error={errors.email?.message}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Password"
                  error={errors.password?.message}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                  <input
                    type="checkbox"
                    className="rounded border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-surface-500 mt-8">
          &copy; 2026 Mirsklada. All rights reserved.
        </p>
      </div>
    </div>
  );
}
