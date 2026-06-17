import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Fleet Management Platform",
  description: "Create your fleet management account",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
