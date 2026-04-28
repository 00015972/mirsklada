/**
 * Email Confirmation Page
 * Handles the token Supabase sends when a user clicks the confirmation link.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores";

type Status = "verifying" | "success" | "error";

export function ConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const isValidLink = !!tokenHash && type === "email";

  const [status, setStatus] = useState<Status>(isValidLink ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState<string>(
    isValidLink ? "" : "Invalid or missing confirmation link.",
  );

  useEffect(() => {
    if (!isValidLink) return;

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: "email" })
      .then(async ({ data, error }) => {
        if (error || !data.session) {
          setErrorMessage(
            error?.message || "Confirmation failed. The link may have expired.",
          );
          setStatus("error");
          return;
        }

        await setSession(data.session);
        setStatus("success");
        setTimeout(() => navigate("/onboarding"), 1500);
      });
  }, [isValidLink, tokenHash, navigate, setSession]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-10">
          {status === "verifying" && (
            <>
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                Verifying your email…
              </h2>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                Email confirmed!
              </h2>
              <p className="text-surface-500 dark:text-surface-400">
                Redirecting you to onboarding…
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
                Confirmation failed
              </h2>
              <p className="text-surface-500 dark:text-surface-400 mb-6">
                {errorMessage}
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate("/signup")}
              >
                Back to Sign Up
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
