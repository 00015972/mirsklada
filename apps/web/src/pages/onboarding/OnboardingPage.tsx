/**
 * Onboarding Page
 * Shown to new users to create their first workspace
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores";

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be less than 255 characters"),
});

type CreateWorkspaceForm = z.infer<typeof createWorkspaceSchema>;

export function OnboardingPage() {
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
          axiosError.response?.data?.message || "Failed to create workspace",
        );
      } else {
        setError("Failed to create workspace");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100">
            Welcome to Mirsklada
          </h1>
          <p className="text-surface-400 mt-2">
            Let's set up your first workspace to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Workspace</CardTitle>
            <p className="text-sm text-surface-400 mt-1">
              A workspace is where you'll manage your inventory, clients, and
              orders. You can invite team members later.
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
                label="Workspace Name"
                placeholder="e.g., My Fish Market"
                error={errors.name?.message}
                {...register("name")}
                autoFocus
              />

              <p className="text-xs text-surface-500">
                This will be the name of your business or organization. You can
                change it later in settings.
              </p>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-surface-500 mt-6">
          You can create additional workspaces later from the settings menu
        </p>
      </div>
    </div>
  );
}
