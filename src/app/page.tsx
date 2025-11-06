"use client"
import Link from "next/link"
import { ArrowRight, Briefcase, Building, ShieldCheck, User } from "lucide-react"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

const portals = [
  {
    name: "Employee Portal",
    href: "/login/employee",
    icon: <User className="h-8 w-8 text-primary" />,
    description: "Request new subscriptions and manage your renewals.",
  },
  {
    name: "HOD Portal",
    href: "/login/hod",
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    description: "Approve or decline subscription requests from your team.",
  },
  {
    name: "Finance Portal",
    href: "/login/finance",
    icon: <Building className="h-8 w-8 text-primary" />,
    description: "Process payments and manage subscription finances.",
  },
  {
    name: "Admin Portal",
    href: "/login/admin",
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    description: "Oversee all subscriptions, users, and system analytics.",
  },
]

export default function Home() {
  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" } },
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="flex flex-col items-center text-center space-y-6"
        >
          <motion.div variants={FADE_IN_ANIMATION_VARIANTS}>
            <Logo />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-foreground"
            variants={FADE_IN_ANIMATION_VARIANTS}
          >
            Welcome to AutoTrack Pro
          </motion.h1>
          <motion.p
            className="max-w-[700px] text-muted-foreground md:text-xl"
            variants={FADE_IN_ANIMATION_VARIANTS}
          >
            The unified system for managing software subscriptions. Please select your portal to continue.
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          animate="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4,
              },
            },
          }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {portals.map((portal) => (
            <motion.div key={portal.name} variants={FADE_IN_ANIMATION_VARIANTS}>
              <Card className="h-full transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center gap-4">
                  {portal.icon}
                  <CardTitle className="text-xl">{portal.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{portal.description}</p>
                  <Button asChild className="w-full group">
                    <Link href={portal.href}>
                      Login <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  )
}
