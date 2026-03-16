"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { SketchBox, InputField, SubmitButton, OAuthButton, DiscordIcon, GoogleIcon } from "@/components/auth-ui";

function getPasswordStrength(pw: string) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Too weak",      bar: "w-1/5  bg-blush" };
  if (score <= 3) return { score, label: "Getting there", bar: "w-3/5  bg-gold" };
  return               { score, label: "Strong ✦",        bar: "w-full bg-sage" };
}

const DEFAULT_CALLBACK = "/dashboard";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form> & { form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"discord" | "google" | null>(null);

  const strength = getPasswordStrength(form.password);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined, form: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!form.displayName.trim()) newErrors.displayName = "Display name is required";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 8) newErrors.password = "Must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords don't match";
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true);
    try {
      const { error } = await authClient.signUp.email(
        {
          email: form.email,
          password: form.password,
          name: form.displayName,
          displayName: form.displayName,
          callbackURL: callbackUrl,
        } as Parameters<typeof authClient.signUp.email>[0]
      );

      if (error) {
        if (error.message?.toLowerCase().includes("email")) {
          setErrors({ email: "An account with this email already exists" });
        } else {
          const message = error.message ?? (error as { code?: string }).code ?? "Registration failed. Please try again.";
          setErrors({ form: message });
          if (process.env.NODE_ENV === "development") {
            console.error("[Register] signUp.email error:", error);
          }
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrors({ form: message });
      if (process.env.NODE_ENV === "development") {
        console.error("[Register] exception:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "discord" | "google") {
    setOauthLoading(provider);
    try {
      await authClient.signIn.social({ provider, callbackURL: callbackUrl });
    } catch {
      setErrors({ form: `Failed to sign in with ${provider}. Try again?` });
      setOauthLoading(null);
    }
  }

  const isAnyLoading = loading || oauthLoading !== null;

  return (
    <main className="min-h-screen bg-parchment bg-paper-texture flex items-center justify-center p-6 font-sans antialiased">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-13 h-13 bg-blush border-2 border-blush-dark rounded-logo shadow-logo flex items-center justify-center text-2xl mb-3">
            ⚔️
          </div>
          <h1 className="font-display text-4xl text-ink leading-none mb-1">Join Nat20</h1>
          <p className="text-ink-faded text-xs">Create your account and start your adventure</p>
        </div>

        {/* Card */}
        <SketchBox className="p-7">

          {/* Form-level error */}
          {errors.form && (
            <div className="bg-blush/10 border border-blush/30 rounded-input px-3.5 py-2.5 mb-5">
              <p className="font-display text-sm text-blush">✗ {errors.form}</p>
            </div>
          )}

          {/* OAuth */}
          <div className="flex flex-col gap-2.5 mb-5">
            <OAuthButton
              icon={<DiscordIcon />}
              label="Sign up with Discord"
              onClick={() => handleOAuth("discord")}
              disabled={isAnyLoading}
            />
            <OAuthButton
              icon={<GoogleIcon />}
              label="Sign up with Google"
              onClick={() => handleOAuth("google")}
              disabled={isAnyLoading}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-tan" />
            <span className="font-display text-sm text-ink-faded">or with email</span>
            <div className="flex-1 h-px bg-tan" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="Display Name"
              name="displayName"
              type="text"
              placeholder="How should we call you?"
              value={form.displayName}
              onChange={handleChange}
              error={errors.displayName}
              hint="Shown to other players in campaigns"
              disabled={isAnyLoading}
              autoComplete="nickname"
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              disabled={isAnyLoading}
              autoComplete="email"
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isAnyLoading}
              autoComplete="new-password"
            />

            {/* Password strength meter */}
            {form.password && strength && (
              <div className="-mt-2 mb-4">
                <div className="h-1 bg-tan rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.bar}`}
                  />
                </div>
                <p
                  className={`font-display text-xs ${
                    strength.score <= 1
                      ? "text-blush"
                      : strength.score <= 3
                      ? "text-gold"
                      : "text-sage"
                  }`}
                >
                  {strength.label}
                </p>
              </div>
            )}

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={isAnyLoading}
              autoComplete="new-password"
            />

            <SubmitButton loading={loading} loadingText="Creating account...">Create Account ✦</SubmitButton>
          </form>
        </SketchBox>

        {/* Footer links */}
        <div className="flex justify-center gap-5 mt-4">
          <Link
            href="/login"
            className="font-sans text-xs text-ink-faded underline decoration-dotted underline-offset-2 hover:text-ink-soft transition-colors"
          >
            Already have an account?
          </Link>
          <span className="text-tan text-xs">·</span>
          <Link
            href="/"
            className="font-sans text-xs text-ink-faded underline decoration-dotted underline-offset-2 hover:text-ink-soft transition-colors"
          >
            Back to home
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-parchment bg-paper-texture flex items-center justify-center p-6 font-sans antialiased">
        <div className="w-13 h-13 bg-blush/20 border-2 border-sketch rounded-logo animate-pulse" />
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
