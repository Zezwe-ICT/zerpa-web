"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Step1Form } from "@/components/auth/step1-form";
import { Step2Form } from "@/components/auth/step2-form";
import { Step3Form } from "@/components/auth/step3-form";
import { ProgressIndicator } from "@/components/auth/progress-indicator";
import { useAuth } from "@/lib/auth/context";
import { createCompany } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Step 1: User account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Business profile
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [vertical, setVertical] = useState("");

  // Step 3: Vertical-specific details
  const [verticalDetails, setVerticalDetails] = useState<Record<string, any>>({});

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  async function handleStep1Next() {
    setIsLoading(true);
    try {
      // Register the user account
      await register({ email, fullName, password });
      setCurrentStep(2);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create account";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleStep2Next() {
    setCurrentStep(3);
  }

  async function handleStep3Submit() {
    setIsLoading(true);
    try {
      // Create the company with details
      await createCompany({
        name: companyName,
        phone: phone || undefined,
        vertical: vertical || undefined,
        details: verticalDetails,
      });

      toast.success("Account setup complete! Welcome to Zerpa.");
      router.push("/select-company");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create company";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary text-primary-fg flex items-center justify-center font-bold text-xl">
              Z
            </div>
            <span className="font-display text-xl font-normal">Zerpa</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={3}
          labels={["Account", "Business", "Details"]}
        />

        {/* Main Card */}
        <div className="bg-background rounded-[12px] border border-border p-8">
          {currentStep === 1 && (
            <Step1Form
              fullName={fullName}
              email={email}
              password={password}
              onFullNameChange={setFullName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onNext={handleStep1Next}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && (
            <Step2Form
              companyName={companyName}
              phone={phone}
              vertical={vertical}
              onCompanyNameChange={setCompanyName}
              onPhoneChange={setPhone}
              onVerticalChange={setVertical}
              onNext={handleStep2Next}
              onBack={() => setCurrentStep(1)}
              isLoading={isLoading}
            />
          )}

          {currentStep === 3 && (
            <Step3Form
              vertical={vertical}
              data={verticalDetails}
              onChange={(field, value) =>
                setVerticalDetails((prev) => ({ ...prev, [field]: value }))
              }
              onSubmit={handleStep3Submit}
              onBack={() => setCurrentStep(2)}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-fg">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-primary hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
