
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Subscription } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, DollarSign, FileText, Gem, User, Wallet } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentProcessDialogProps {
  subscription: Subscription;
  children: React.ReactNode;
}

export default function PaymentProcessDialog({ subscription, children }: PaymentProcessDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { users } = useAppStore();

  const requester = users.find(u => u.id === subscription.requestedBy);
  const approver = users.find(u => u.id === subscription.approvedBy);
  const payer = users.find(u => u.id === subscription.paidBy);
  
  const getStatus = (date: string | undefined, type: 'Approved' | 'Paid') => {
      if (date) {
        return { text: type, date: format(new Date(date), "PPP"), variant: 'success' as const, icon: <CheckCircle className="h-4 w-4"/> };
      }
      return { text: `Pending ${type}`, date: 'Not yet completed', variant: 'warning' as const, icon: <Clock className="h-4 w-4"/> };
  }

  const processTimeline = [
    { text: 'Requested', date: format(new Date(subscription.requestDate), "PPP"), variant: 'info' as const, icon: <FileText className="h-4 w-4"/>, by: requester?.name },
  ];
  if(subscription.status !== 'Pending') {
      const approvalStatus = getStatus(subscription.approvalDate, 'Approved');
      processTimeline.push({ ...approvalStatus, by: approver?.name });
  }
  if(subscription.status === 'Active' || subscription.status === 'Expired') {
    const paymentStatus = getStatus(subscription.paymentDate, 'Paid');
    processTimeline.push({ ...paymentStatus, by: payer?.name });
  }

  const statusColors = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-4">
           <div className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-12 w-12 shrink-0">
             <Gem className="h-2/3 w-2/3" />
           </div>
           <div>
            <DialogTitle className="text-2xl">{subscription.toolName}</DialogTitle>
            <DialogDescription>Payment Process History</DialogDescription>
           </div>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><div><strong>Requester:</strong><p>{requester?.name}</p></div></div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-muted-foreground"/><div><strong>Approver:</strong><p>{approver?.name || 'N/A'}</p></div></div>
                  <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground"/><div><strong>Department:</strong><p>{subscription.department}</p></div></div>
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground"/><div><strong>Cost:</strong><p>${subscription.cost.toFixed(2)}</p></div></div>
              </div>

            <div>
              <h3 className="font-semibold mb-3">Timeline</h3>
              <div className="space-y-4">
                {processTimeline.map((item, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${statusColors[item.variant]}`}>
                    <div className="mt-1">{item.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.text}</p>
                      <p className="text-xs">{item.date}</p>
                      {item.by && <p className="text-xs mt-1">by {item.by}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
