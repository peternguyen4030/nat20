"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { SketchBox, InputField, SubmitButton, OAuthButton, DiscordIcon, GoogleIcon } from "@/components/auth-ui";

const DEFAULT_CALLBACK = "/dashboard";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_CALLBACK;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"discord" | "google" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length) return setErrors(newErrors);

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });
      if (error) {
        setErrors({ form: "Invalid email or password. Try again?" });
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
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
          <h1 className="font-display text-4xl text-ink leading-none mb-1">Nat20</h1>
          <p className="text-ink-faded text-xs">Sign in to your campaign journal</p>
        </div>

        {/* Card */}
        <SketchBox className="p-7">

          {/* Form-level error */}
          {errors.form && (
            <div className="bg-blush/10 border border-blush/30 rounded-input px-3.5 py-2.5 mb-5 flex items-center gap-2">
              <span className="text-blush text-sm">✗</span>
              <p className="font-display text-sm text-blush">{errors.form}</p>
            </div>
          )}

          {/* OAuth */}
          <div className="flex flex-col gap-2.5 mb-5">
            <OAuthButton
              icon={<DiscordIcon />}
              label="Continue with Discord"
              onClick={() => handleOAuth("discord")}
              disabled={isAnyLoading}
            />
            <OAuthButton
              icon={<GoogleIcon />}
              label="Continue with Google"
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
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isAnyLoading}
              autoComplete="email"
            />
            <InputField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isAnyLoading}
              autoComplete="current-password"
            />
            <SubmitButton loading={loading} loadingText="Signing in...">Sign In ✦</SubmitButton>
          </form>
        </SketchBox>

        {/* Footer links */}
        <div className="flex justify-center gap-5 mt-4">
          <Link
            href="/register"
            className="font-sans text-xs text-ink-faded underline decoration-dotted underline-offset-2 hover:text-ink-soft transition-colors"
          >
            Create an account
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-parchment bg-paper-texture flex items-center justify-center p-6 font-sans antialiased">
        <div className="w-13 h-13 bg-blush/20 border-2 border-sketch rounded-logo animate-pulse" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
