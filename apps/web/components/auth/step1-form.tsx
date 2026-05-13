/**
 * @file components/auth/step1-form.tsx
 * @description Step 1 of the registration flow: captures full name, email and
 * password. Calls onNext() on submit for the parent page to advance the step.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; {
  fullName: string;
  email: string;
  password: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

export function Step1Form({
  fullName,
  email,
  password,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onNext,
  isLoading,
}: Step1FormProps) {
  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
    return null;
  }

  const isValid = fullName.trim() && email.trim() && validatePassword(password) === null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-fg">Let's get started with your Zerpa journey</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) onNext();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Smith"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <p className="text-xs text-muted-fg">
            Min 8 characters, 1 uppercase letter, 1 number.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={!isValid || isLoading}>
          {isLoading ? "Creating account…" : "Next →"}
        </Button>
      </form>
    </div>
  );
}
