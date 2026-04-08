/**
 * Onboarding Page
 * Shown to new users to create their first workspace
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LanguageSwitcher,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "onboarding.errorNameLength")
    .max(255, "onboarding.errorNameTooLong"),
});

type CreateWorkspaceForm = z.infer<typeof createWorkspaceSchema>;

export function OnboardingPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkspaceForm>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateWorkspaceForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/tenants", data);
      const tenant = response.data.tenant;

      // Update auth store with the new tenant
      const { tenants } = useAuthStore.getState();
      useAuthStore.setState({
        tenants: [...tenants, tenant],
        currentTenantId: tenant.id,
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || t("onboarding.errorGeneric"),
        );
      } else {
        setError(t("onboarding.errorGeneric"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <LanguageSwitcher variant="compact" />
      </div>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {t("onboarding.welcome")}
          </h1>
          <p className="text-surface-400 mt-2">{t("onboarding.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("onboarding.createTitle")}</CardTitle>
            <p className="text-sm text-surface-400 mt-1">
              {t("onboarding.createSubtitle")}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Input
                label={t("onboarding.nameLabel")}
                placeholder={t("onboarding.namePlaceholder")}
                error={
                  errors.name?.message ? t(errors.name.message) : undefined
                }
                {...register("name")}
                autoFocus
              />

              <p className="text-xs text-surface-500">
                {t("onboarding.nameHelp")}
              </p>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t("onboarding.creating")}
                  </>
                ) : (
                  <>
                    {t("onboarding.createButton")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-surface-500 mt-6">
          {t("onboarding.footer")}
        </p>
      </div>
    </div>
  );
}
