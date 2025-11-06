"use client"
import LoginForm from "@/app/components/auth/login-form";

export default function FinanceLoginPage() {
    return <LoginForm role="finance" title="Finance Portal" subRoleOptions={['apa', 'am']} />;
}
