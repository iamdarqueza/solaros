import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Fleet Management Platform",
  description: "Sign in to your fleet management account",
};

export default function SignIn() {
  return <SignInForm />;
}
