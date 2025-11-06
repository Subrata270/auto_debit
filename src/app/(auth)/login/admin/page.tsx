"use client"
import Link from "next/link";
import LoginForm from "@/app/components/auth/login-form";

export default function AdminLoginPage() {
    return (
        <div className="flex flex-col gap-4">
            <LoginForm role="admin" title="Admin Portal" />
            <div className="text-center text-sm">
                Don't have an account? <Link href="/register" className="underline">Register</Link>
            </div>
        </div>
    );
}