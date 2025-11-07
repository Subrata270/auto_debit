
"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { AlertTriangle, Check, CheckCircle, History, Hourglass, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Subscription } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import DeclineInfoDialog from "../../components/decline-info-dialog";
import PaymentProcessDialog from "../../components/payment-process-dialog";
import { useToast } from "@/hooks/use-toast";

const ApaApprovalDialog = ({ subscription, onApprove }: { subscription: Subscription; onApprove: () => void; }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-105 transition-transform">Approve</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Finance Approval</DialogTitle>
                    <DialogDescription>
                        Confirming this will send the request to the Accounts Manager for final payment processing.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4 text-sm">
                    <div><strong>Tool:</strong> {subscription.toolName}</div>
                    <div><strong>Department:</strong> {subscription.department}</div>
                    <div><strong>Cost:</strong> <span className="font-bold text-lg">${subscription.cost.toFixed(2)}</span></div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <DialogClose asChild>
                        <Button onClick={onApprove}><Check className="mr-2 h-4 w-4" />Confirm Approval</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const PaymentDialog = ({ subscription }: { subscription: Subscription }) => {
    const { currentUser, markAsPaid } = useAppStore();
    const [paymentMode, setPaymentMode] = useState("Card");

    const handlePayment = () => {
        if (!currentUser) return;
        markAsPaid(subscription.id, currentUser.id, paymentMode);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 transition-transform">Process Payment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve Payment</DialogTitle>
                    <DialogDescription>Confirm payment for {subscription.toolName}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-sm"><strong>Tool:</strong> {subscription.toolName}</div>
                    <div className="text-sm"><strong>Department:</strong> {subscription.department}</div>
                    <div className="text-sm"><strong>Amount:</strong> <span className="font-bold text-lg">${subscription.cost.toFixed(2)}</span></div>
                    <div className="text-sm"><strong>Payment Date:</strong> {format(new Date(), "PP")}</div>
                    <div>
                        <Label className="text-sm font-medium">Mode of Payment</Label>
                        <RadioGroup defaultValue="Card" onValueChange={setPaymentMode} className="mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Card" id="card" />
                                <Label htmlFor="card">Card</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="UPI" id="upi" />
                                <Label htmlFor="upi">UPI</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="NetBanking" id="netbanking" />
                                <Label htmlFor="netbanking">NetBanking</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handlePayment}><Check className="mr-2 h-4 w-4" />Confirm Payment</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const HistoryCard = ({ title, icon, data, bgColor, isDecline = false }: { title: string, icon: React.ReactNode, data: Subscription[], bgColor: string, isDecline?: boolean }) => (
    <Card className={`rounded-xl shadow-md ${bgColor}`}>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">{icon}{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-72">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tool</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map(sub => (
                           isDecline ? (
                             <DeclineInfoDialog key={sub.id} subscription={sub}>
                               <TableRow className="cursor-pointer hover:bg-red-100/50">
                                 <TableCell className="font-medium">{sub.toolName}</TableCell>
                                 <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                 <TableCell>{sub.approvalDate ? format(new Date(sub.approvalDate), "PP") : 'N/A'}</TableCell>
                               </TableRow>
                             </DeclineInfoDialog>
                           ) : (
                            <PaymentProcessDialog subscription={sub} key={sub.id}>
                                <TableRow className="cursor-pointer hover:bg-green-100/50">
                                    <TableCell className="font-medium">{sub.toolName}</TableCell>
                                    <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                    <TableCell>{sub.paymentDate ? format(new Date(sub.paymentDate), "PP") : 'N/A'}</TableCell>
                                </TableRow>
                            </PaymentProcessDialog>
                           )
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No history found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
);

const APADashboard = () => {
    const { currentUser, subscriptions, users, approveByAPA } = useAppStore();
    const { toast } = useToast();
    
    if (!currentUser) return null;

    const pendingApaApproval = subscriptions.filter(s => s.status === 'Approved by HOD');
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';
    
    const handleApaApprove = (subscriptionId: string) => {
        if (!currentUser) return;
        approveByAPA(subscriptionId, currentUser.id);
        toast({
            title: "Request Approved",
            description: "Request sent to Accounts Manager for payment approval.",
        });
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">APA Dashboard</h1>
                <p className="text-muted-foreground mt-1">Review and approve HOD-approved subscription requests.</p>
            </header>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="rounded-xl shadow-md">
                    <CardHeader>
                        <CardTitle>Subscription Request Process</CardTitle>
                        <CardDescription>Requests approved by HODs, awaiting your verification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>HOD</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingApaApproval.length > 0 ? pendingApaApproval.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>{sub.department}</TableCell>
                                        <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                        <TableCell>{getUserName(sub.approvedBy!)}</TableCell>
                                        <TableCell className="text-right">
                                            <ApaApprovalDialog subscription={sub} onApprove={() => handleApaApprove(sub.id)} />
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No requests awaiting your approval.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

const AMDashboard = () => {
    const { currentUser, subscriptions, users } = useAppStore();

    if (!currentUser) return null;

    const pendingPayment = subscriptions.filter(s => s.status === 'Approved by APA');
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Accounts Manager Dashboard</h1>
                <p className="text-muted-foreground mt-1">Process final payments for approved subscriptions.</p>
            </header>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="rounded-xl shadow-md">
                    <CardHeader>
                        <CardTitle>Payment Processing</CardTitle>
                        <CardDescription>Subscriptions approved by APA and ready for payment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Approved By (APA)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingPayment.length > 0 ? pendingPayment.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>{sub.department}</TableCell>
                                        <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                        <TableCell>{getUserName(sub.apaApprovedBy!)}</TableCell>
                                        <TableCell className="text-right">
                                            <PaymentDialog subscription={sub} />
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No pending payments.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};


export default function FinanceDashboardPage() {
    const { currentUser } = useAppStore();

    if (!currentUser || currentUser.role !== 'finance') return null;

    if (currentUser.subrole === 'apa') {
        return <APADashboard />;
    }

    if (currentUser.subrole === 'am') {
        return <AMDashboard />;
    }

    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Please select a valid sub-role to view the finance dashboard.</p>
        </div>
    );
}

    