
"use client"
import Link from "next/link"
import { ArrowRight, Briefcase, Building, ShieldCheck, User, Database } from "lucide-react"
import { motion } from "framer-motion"
import { doc, setDoc } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { useFirestore, FirebaseClientProvider } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

const portals = [
  {
    name: "Department POC Portal",
    href: "/login/employee",
    icon: <User className="h-8 w-8 text-primary" />,
    description: "Submit new subscription requests and manage department tool renewals.",
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
]

function HomePageContent() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleCreateSampleUser = async () => {
    try {
      const userRef = doc(firestore, "users", "sample-user-id");
      const sampleUser = {
        id: "sample-user-id",
        name: "Sample User",
        email: "sample@example.com",
        role: "employee",
        department: "Engineering",
        subrole: null,
      };
      await setDoc(userRef, sampleUser);
      toast({
        title: "Success!",
        description: "Sample user created and 'users' collection should now exist.",
      });
    } catch (error: any) {
      console.error("Detailed error from handleCreateSampleUser:", error);
      toast({
        variant: "destructive",
        title: "Error Creating Sample User",
        description: `Failed to create sample user. Check the browser console for details. Message: ${error.message}`,
      });
    }
  };


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
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {portals.map((portal) => (
            <motion.div key={portal.name} variants={FADE_IN_ANIMATION_VARIANTS}>
              <Card className="h-full flex flex-col transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <CardHeader className="flex flex-row items-center gap-4">
                  {portal.icon}
                  <CardTitle className="text-xl">{portal.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <p className="text-muted-foreground mb-4 flex-grow">{portal.description}</p>
                  <Button asChild className="w-full group mt-auto">
                    <Link href={portal.href}>
                      Login <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
         <div className="mt-12 text-center">
            <Button variant="outline" onClick={handleCreateSampleUser}>
              <Database className="mr-2 h-4 w-4" />
              Create Sample User Collection
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Click this to create the 'users' collection in Firestore.</p>
        </div>
      </div>
    </main>
  )
}


export default function Home() {
  return (
    <FirebaseClientProvider>
      <HomePageContent />
    </FirebaseClientProvider>
  )
}
