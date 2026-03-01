"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ── Primitives ────────────────────────────────────────────────────────────────

function SketchBox({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch ${className}`}
    >
      {children}
    </div>
  );
}

function InputField({
  label,
  hint,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className={`block font-sans text-[0.7rem] font-bold uppercase tracking-widest mb-1.5 ${
          error ? "text-blush" : "text-ink-faded"
        }`}
      >
        {label}
      </label>
      <input
        id={id}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full font-sans text-sm bg-parchment text-ink rounded-input px-3 py-2 outline-none transition-colors duration-150 border-2 ${
          error
            ? "border-blush"
            : focused
            ? "border-blush"
            : "border-sketch"
        } disabled:opacity-50 placeholder:text-ink-faded`}
        {...props}
      />
      {hint && !error && (
        <p className="font-display text-xs text-ink-faded mt-1">{hint}</p>
      )}
      {error && (
        <p className="font-display text-sm text-blush mt-1">✗ {error}</p>
      )}
    </div>
  );
}

function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full font-sans font-bold text-[0.95rem] py-2.5 rounded-sketch text-white border-2 transition-all duration-150 flex items-center justify-center gap-2
        ${
          loading
            ? "bg-tan border-sketch shadow-none cursor-not-allowed"
            : "bg-blush border-blush shadow-sketch-accent cursor-pointer hover:-translate-x-px hover:-translate-y-px"
        }`}
    >
      {loading ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Creating account...
        </>
      ) : (
        children
      )}
    </button>
  );
}

function OAuthButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full font-sans font-semibold text-sm text-ink bg-warm-white border-2 border-sketch rounded-sketch shadow-sketch py-2.5 px-3 flex items-center justify-center gap-2.5 transition-all duration-150 hover:bg-paper hover:-translate-x-px hover:-translate-y-px hover:shadow-sketch-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

function getPasswordStrength(pw: string) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Too weak",      bar: "w-1/5  bg-blush" };
  if (score <= 3) return { score, label: "Getting there", bar: "w-3/5  bg-[#D4A853]" };
  return               { score, label: "Strong ✦",        bar: "w-full bg-sage" };
}

// ── OAuth icons ───────────────────────────────────────────────────────────────

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
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
          callbackURL: "/dashboard",
        } as Parameters<typeof authClient.signUp.email>[0]
      );

      if (error) {
        if (error.message?.toLowerCase().includes("email")) {
          setErrors({ email: "An account with this email already exists" });
        } else {
          setErrors({ form: error.message ?? "Registration failed. Please try again." });
        }
      } else {
        router.push("/dashboard");
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
      await authClient.signIn.social({ provider, callbackURL: "/dashboard" });
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
                      ? "text-[#D4A853]"
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

            <SubmitButton loading={loading}>Create Account ✦</SubmitButton>
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
