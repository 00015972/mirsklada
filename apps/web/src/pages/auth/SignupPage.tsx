/**
 * Signup Page
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);

    try {
      const response = await authApi.signup({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      const { user, session, confirmationRequired } = response.data;

      if (confirmationRequired) {
        setSuccess(true);
      } else if (session) {
        setAuth(user, session, []);
        navigate("/onboarding");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        "Signup failed. Please try again.";
      setError(message);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-surface-100 mb-2">
              Check your email
            </h2>
            <p className="text-surface-400 mb-6">
              We've sent a confirmation link to your email address. Please click
              the link to verify your account.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Mirsklada</h1>
          <p className="text-surface-400 mt-1">Create your account</p>
        </div>

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Sign Up
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500 pointer-events-none" />
                <Input
                  {...register("name")}
                  type="text"
                  placeholder="Full name"
                  error={errors.name?.message}
                  className="pl-10"
                  autoComplete="name"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500 pointer-events-none" />
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500 pointer-events-none" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Password (min 8 characters)"
                  error={errors.password?.message}
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500 pointer-events-none" />
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Confirm password"
                  error={errors.confirmPassword?.message}
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-surface-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-surface-500 mt-8">
          © 2026 Mirsklada. All rights reserved.
        </p>
      </div>
    </div>
  );
}
