
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { format } from "date-fns";
import { XCircle } from "lucide-react";

interface DeclineInfoDialogProps {
  subscription: Subscription;
  children: React.ReactNode;
}

export default function DeclineInfoDialog({ subscription, children }: DeclineInfoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { users } = useAppStore();

  const requester = users.find(u => u.id === subscription.requestedBy);
  const declineReason = subscription.remarks?.replace("Declined by HOD: ", "") || "No reason provided.";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onDoubleClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="text-destructive" />
            Decline Details
          </DialogTitle>
          <DialogDescription>
            Details for the declined subscription request for <strong>{subscription.toolName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2 text-sm">
            <p><strong>Tool Name:</strong> {subscription.toolName}</p>
            <p><strong>Requested By:</strong> {requester?.name || 'Unknown'}</p>
            <p><strong>Date of Decline:</strong> {subscription.approvalDate ? format(new Date(subscription.approvalDate), "PPP") : 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Reason for Decline:</p>
            <p className="mt-1 text-destructive italic p-3 bg-red-50/50 rounded-md border border-red-100">{declineReason}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
