import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
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

        {/* Form */}
        <div className="bg-background rounded-[12px] border border-border p-8 space-y-6">
          <div>
            <h1 className="section-title text-center">Sign In</h1>
            <p className="text-sm text-muted-fg text-center mt-1">
              Enter your credentials to continue
            </p>
          </div>

          {/* Mock Auth Info */}
          <div className="bg-surface-2 border border-border rounded-[8px] p-4 text-sm space-y-2">
            <p className="font-semibold text-foreground">Demo Accounts (Mock Mode)</p>
            <div className="space-y-1 text-muted-fg text-xs">
              <p><strong>Zerpa Staff:</strong> agent@zerpa.co.za</p>
              <p><strong>Funeral Client:</strong> admin@dignityfuneralhome.co.za</p>
              <p><strong>Automotive Client:</strong> admin@autoshop.co.za</p>
              <p><strong>Restaurant Client:</strong> manager@restaurants.co.za</p>
              <p><strong>Spa Client:</strong> owner@spa.co.za</p>
            </div>
          </div>

          {/* Quick Login Buttons */}
          <div className="space-y-2">
            <form action="/dashboard" method="GET">
              <Button type="submit" className="w-full" size="lg">
                Login as Zerpa Staff
              </Button>
            </form>

            <form action="/funeral/dashboard" method="GET">
              <Button type="submit" variant="outline" className="w-full" size="lg">
                Login as Funeral Client
              </Button>
            </form>

            <form action="/automotive/dashboard" method="GET">
              <Button type="submit" variant="outline" className="w-full" size="lg">
                Login as Automotive Client
              </Button>
            </form>
          </div>

          <p className="text-xs text-muted-fg text-center">
            In production, this will be replaced with AWS Cognito authentication.
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
