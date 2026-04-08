/**
 * Signup Page
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { UserPlus, Mail, Lock, User, Sun, Moon } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LanguageSwitcher,
} from "@/components/ui";
import { authApi } from "@/lib/api";
import { useAuthStore, useThemeStore } from "@/stores";

const signupSchema = z
  .object({
    name: z.string().min(2, "auth.signup.errorNameLength"),
    email: z.string().email("auth.signup.errorInvalidEmail"),
    password: z.string().min(8, "auth.signup.errorPasswordLength"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.signup.errorPasswordMismatch",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

interface ApiErrorShape {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme, toggleTheme } = useThemeStore();
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
        await setAuth(user, session, []);
        navigate("/onboarding");
      }
    } catch (err: unknown) {
      const apiError = err as ApiErrorShape;
      const message =
        apiError.response?.data?.error?.message ||
        t("auth.signup.errorGeneric");
      setError(message);
    }
  };

  const topBar = (
    <div className="fixed top-4 right-4 flex items-center gap-2">
      <LanguageSwitcher variant="compact" />
      <button
        type="button"
        onClick={toggleTheme}
        className="p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors shadow-sm"
        title={t("common.theme")}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
        {topBar}
        <Card className="max-w-md w-full text-center">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
              {t("auth.signup.checkEmailTitle")}
            </h2>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
              {t("auth.signup.checkEmailMessage")}
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full">
                {t("auth.signup.backToLogin")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      {topBar}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {t("auth.appName")}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t("auth.createAccount")}
          </p>
        </div>

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("auth.signup.title")}
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                <Input
                  {...register("name")}
                  type="text"
                  placeholder={t("auth.signup.namePlaceholder")}
                  error={
                    errors.name?.message ? t(errors.name.message) : undefined
                  }
                  className="pl-10"
                  autoComplete="name"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder={t("auth.signup.emailPlaceholder")}
                  error={
                    errors.email?.message ? t(errors.email.message) : undefined
                  }
                  className="pl-10"
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                <Input
                  {...register("password")}
                  type="password"
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  error={
                    errors.password?.message
                      ? t(errors.password.message)
                      : undefined
                  }
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400 dark:text-surface-500 pointer-events-none" />
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder={t("auth.signup.confirmPasswordPlaceholder")}
                  error={
                    errors.confirmPassword?.message
                      ? t(errors.confirmPassword.message)
                      : undefined
                  }
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                {t("auth.signup.submit")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
              {t("auth.signup.haveAccount")}{" "}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
              >
                {t("auth.signup.signIn")}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-surface-500 mt-8">
          {t("auth.footer")}
        </p>
      </div>
    </div>
  );
}
