"use client";
import React, { useState } from "react";

interface CompanySetupProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  onComplete: () => Promise<void>;
}

type Step = "company_name" | "systems_installed" | "biggest_challenge" | "creating";

type SystemsRange = "under_100" | "100_500" | "500_2000" | "2000_plus";
type Challenge =
  | "customer_support"
  | "warranty_management"
  | "maintenance_scheduling"
  | "technician_management"
  | "monitoring"
  | "everything";

const STEPS: Step[] = ["company_name", "systems_installed", "biggest_challenge", "creating"];
const STEP_INDEX: Record<Step, number> = {
  company_name: 0,
  systems_installed: 1,
  biggest_challenge: 2,
  creating: 3,
};

const SYSTEMS_OPTIONS: { value: SystemsRange; label: string }[] = [
  { value: "under_100", label: "Under 100" },
  { value: "100_500", label: "100–500" },
  { value: "500_2000", label: "500–2,000" },
  { value: "2000_plus", label: "2,000+" },
];

const CHALLENGE_OPTIONS: { value: Challenge; label: string; icon: string }[] = [
  { value: "customer_support", label: "Customer support", icon: "💬" },
  { value: "warranty_management", label: "Warranty management", icon: "🛡️" },
  { value: "maintenance_scheduling", label: "Maintenance scheduling", icon: "🔧" },
  { value: "technician_management", label: "Technician management", icon: "👷" },
  { value: "monitoring", label: "Monitoring", icon: "📊" },
  { value: "everything", label: "Everything", icon: "🚀" },
];



export default function CompanySetup({ user, onComplete }: CompanySetupProps) {
  const [step, setStep] = useState<Step>("company_name");
  const [companyName, setCompanyName] = useState("");
  const [systemsInstalled, setSystemsInstalled] = useState<SystemsRange | null>(null);
  const [biggestChallenge, setBiggestChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creationDone, setCreationDone] = useState(false);

  const currentStepIndex = STEP_INDEX[step];
  const totalSteps = 3; // exclude "creating" from the visible progress

  const goNext = () => {
    const idx = STEP_INDEX[step];
    setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEP_INDEX[step];
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const createWorkspace = async () => {
    setStep("creating");
    setLoading(true);
    setError("");

    try {
      // TODO: Wire up Supabase writes once backend is ready
      // Simulate workspace creation with a brief animation
      await new Promise((r) => setTimeout(r, 1400));
      setCreationDone(true);

      await new Promise((r) => setTimeout(r, 800));
      await onComplete();
    } catch (err: unknown) {
      console.error("Error creating workspace:", err);
      setError((err as Error).message || "Failed to create workspace");
      setStep("biggest_challenge");
    } finally {
      setLoading(false);
    }
  };

  // ─── Progress bar ────────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="w-full max-w-sm mx-auto mb-10">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= currentStepIndex
                ? "bg-brand-600"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
        Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
      </p>
    </div>
  );

  // ─── Back button ─────────────────────────────────────────────────────────────
  const BackButton = () => (
    <button
      onClick={goBack}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-8 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );

  // ─── Screen 2: Company name ───────────────────────────────────────────────────
  if (step === "company_name") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-6">
        <div className="w-full max-w-sm">
          <ProgressBar />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              What's your company name?
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This will be your workspace name on Fewblocs.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/10 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Solar Future Inc"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && companyName.trim()) goNext();
              }}
              autoFocus
              className="w-full px-4 py-3.5 text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />

            <button
              onClick={() => {
                if (!companyName.trim()) {
                  setError("Please enter your company name");
                  return;
                }
                setError("");
                goNext();
              }}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Screen 3: Systems installed ─────────────────────────────────────────────
  if (step === "systems_installed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-6">
        <div className="w-full max-w-sm">
          <BackButton />
          <ProgressBar />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              How many systems have you installed?
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This helps us tailor your experience.
            </p>
          </div>

          <div className="space-y-3">
            {SYSTEMS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSystemsInstalled(opt.value);
                  goNext();
                }}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-all duration-150 group ${
                  systemsInstalled === opt.value
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/10"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <svg
                  className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                    systemsInstalled === opt.value ? "opacity-100 text-brand-600" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Screen 4: Biggest challenge ─────────────────────────────────────────────
  if (step === "biggest_challenge") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-6">
        <div className="w-full max-w-sm">
          <BackButton />
          <ProgressBar />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              What is your biggest challenge?
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              We'll prioritize the tools that matter most to you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CHALLENGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBiggestChallenge(opt.value)}
                className={`flex flex-col items-start gap-2 px-4 py-4 rounded-xl border text-left transition-all duration-150 ${
                  biggestChallenge === opt.value
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-200 dark:ring-brand-800"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-700"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (!biggestChallenge) {
                setError("Please select your biggest challenge");
                return;
              }
              setError("");
              createWorkspace();
            }}
            disabled={!biggestChallenge}
            className="mt-6 w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Create my workspace →
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // ─── Screen 5: Creating workspace ────────────────────────────────────────────
  if (step === "creating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-6">
        <div className="w-full max-w-sm text-center">
          {!creationDone ? (
            <>
              {/* Animated spinner */}
              <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-full bg-brand-50 dark:bg-brand-900/20">
                <div className="w-10 h-10 border-4 border-brand-200 dark:border-brand-800 border-t-brand-600 rounded-full animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Creating your workspace…
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Setting up <span className="font-medium text-gray-600 dark:text-gray-300">{companyName}</span> on Fewblocs
              </p>

              {/* Animated progress steps */}
              <div className="mt-10 space-y-3 text-left max-w-xs mx-auto">
                {[
                  "Creating your organization",
                  "Setting up your workspace",
                  "Preparing your dashboard",
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        loading
                          ? i === 0
                            ? "bg-brand-600"
                            : "bg-gray-200 dark:bg-gray-700"
                          : "bg-brand-600"
                      } transition-all duration-700`}
                      style={{ transitionDelay: `${i * 300}ms` }}
                    >
                      {(!loading || i === 0) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-full bg-green-50 dark:bg-green-900/20 animate-[bounceIn_0.5s_ease-out]">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                You're all set! 🎉
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Taking you to your dashboard…
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}