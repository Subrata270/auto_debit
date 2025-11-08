
"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Check, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { Subscription, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import PaymentProcessDialog from "../../components/payment-process-dialog";

const APAApprovalActions = ({ subscription }: { subscription: Subscription }) => {
    const { updateFinanceStatus, currentUser } = useAppStore();
    const [isDeclineOpen, setIsDeclineOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    const handleApprove = () => {
        if (!currentUser) return;
        updateFinanceStatus(subscription.id, 'Approved by APA', currentUser.id);
    };

    const handleDecline = () => {
        if (!currentUser || !declineReason) return;
        updateFinanceStatus(subscription.id, 'Declined by APA', currentUser.id, declineReason);
        setIsDeclineOpen(false);
    };

    return (
        <div className="flex gap-2 justify-end">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Decline</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Request</DialogTitle>
                        <DialogDescription>Please provide a reason for declining this request for {subscription.toolName}.</DialogDescription>
                    </DialogHeader>
                    <Textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for declining..." />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeclineOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDecline} disabled={!declineReason}>Confirm Decline</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const PaymentFormDialog = ({ subscription }: { subscription: Subscription }) => {
    const { currentUser, markAsPaid } = useAppStore();
    const { toast } = useToast();
    const [paymentMode, setPaymentMode] = useState("Card");
    const [transactionId, setTransactionId] = useState("");
    const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

    const handlePayment = () => {
        if (!currentUser || !paymentDate) return;
        markAsPaid(subscription.id, currentUser.id, { mode: paymentMode, transactionId, date: paymentDate.toISOString() });
        toast({
            title: "Payment Processed",
            description: `Payment for ${subscription.toolName} has been recorded.`,
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 transition-transform">Fill Payment Form</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment Details</DialogTitle>
                    <DialogDescription>Submit the details for the manual payment of {subscription.toolName}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-sm"><strong>Tool:</strong> {subscription.toolName}</div>
                    <div className="text-sm"><strong>Amount:</strong> <span className="font-bold text-lg">${subscription.cost.toFixed(2)}</span></div>
                    
                    <div>
                        <Label className="text-sm font-medium">Payment Mode</Label>
                        <RadioGroup defaultValue={paymentMode} onValueChange={setPaymentMode} className="mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Card" id="card" /><Label htmlFor="card">Card</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="UPI" id="upi" /><Label htmlFor="upi">UPI</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Bank Transfer" id="netbanking" /><Label htmlFor="netbanking">Bank Transfer</Label></div>
                        </RadioGroup>
                    </div>
                     <div>
                        <Label htmlFor="transactionId">Transaction ID</Label>
                        <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID" />
                    </div>
                     <div>
                        <Label>Payment Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}>
                                    {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <DialogClose asChild>
                      <Button onClick={handlePayment} disabled={!paymentMode || !paymentDate}><Check className="mr-2 h-4 w-4" />Submit Payment Details</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const APADashboard = () => {
    const { currentUser } = useAppStore();
    const firestore = useFirestore();
    
    const pendingApaQuery = useMemo(() => {
        if (!currentUser) return null;
        return query(collection(firestore, 'subscriptions'), where('status', '==', 'Approved by HOD'), where('department', '==', currentUser.department));
    }, [firestore, currentUser]);

    const historyQuery = useMemo(() => {
        if (!currentUser) return null;
        return query(collection(firestore, 'subscriptions'), where('apaApprovedBy', '==', currentUser.id));
    }, [firestore, currentUser]);

    const { data: pendingApaApproval, isLoading: pendingLoading } = useCollection<Subscription>(pendingApaQuery);
    const { data: history, isLoading: historyLoading } = useCollection<Subscription>(historyQuery);
    const { data: users, isLoading: usersLoading } = useCollection<User>(collection(firestore, 'users'));
    
    if (!currentUser || pendingLoading || historyLoading || usersLoading || !pendingApaApproval || !history || !users) {
         return <div>Loading APA dashboard...</div>;
    }
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">APA Dashboard - {currentUser.department}</h1>
                <p className="text-muted-foreground mt-1">Review HOD-approved requests for your department.</p>
            </header>
             <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                    <TabsTrigger value="history">Approve/Decline History</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                    <Card className="rounded-xl shadow-md">
                        <CardHeader>
                            <CardTitle>Subscription Request Process</CardTitle>
                            <CardDescription>Requests awaiting your verification.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Cost</TableHead><TableHead>HOD</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {pendingApaApproval.length > 0 ? pendingApaApproval.map(sub => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.toolName}</TableCell>
                                            <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                            <TableCell>{getUserName(sub.approvedBy!)}</TableCell>
                                            <TableCell className="text-right"><APAApprovalActions subscription={sub} /></TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No requests awaiting your approval.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="history">
                     <Card className="rounded-xl shadow-md">
                        <CardHeader><CardTitle>Action History</CardTitle><CardDescription>Your past approval and decline actions.</CardDescription></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {history.length > 0 ? history.map(sub => (
                                        <TableRow key={sub.id}>
                                            <TableCell>{sub.toolName}</TableCell>
                                            <TableCell>{sub.status}</TableCell>
                                            <TableCell>{sub.apaApprovalDate ? format(new Date(sub.apaApprovalDate), "PP") : 'N/A'}</TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No history found.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

const AMDashboard = () => {
    const { currentUser } = useAppStore();
    const firestore = useFirestore();

    const pendingPaymentQuery = useMemo(() => query(collection(firestore, 'subscriptions'), where('status', '==', 'Approved by APA')), [firestore]);
    const paymentHistoryQuery = useMemo(() => query(collection(firestore, 'subscriptions'), where('paidBy', '==', currentUser?.id)), [firestore, currentUser]);

    const { data: pendingPayment, isLoading: pendingLoading } = useCollection<Subscription>(pendingPaymentQuery);
    const { data: paymentHistory, isLoading: historyLoading } = useCollection<Subscription>(paymentHistoryQuery);
    const { data: users, isLoading: usersLoading } = useCollection<User>(collection(firestore, 'users'));

    if (!currentUser || pendingLoading || historyLoading || usersLoading || !pendingPayment || !paymentHistory || !users) {
        return <div>Loading AM dashboard...</div>;
    }

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Accounts Manager Dashboard</h1>
                <p className="text-muted-foreground mt-1">Process final payments for approved subscriptions.</p>
            </header>
            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending Payment Requests</TabsTrigger>
                    <TabsTrigger value="history">Payment History</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                     <Card className="rounded-xl shadow-md">
                        <CardHeader><CardTitle>Payment Processing</CardTitle><CardDescription>Subscriptions ready for payment.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Department</TableHead><TableHead>Cost</TableHead><TableHead>Approved By (APA)</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {pendingPayment.length > 0 ? pendingPayment.map(sub => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.toolName}</TableCell>
                                            <TableCell>{sub.department}</TableCell>
                                            <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                            <TableCell>{getUserName(sub.apaApprovedBy!)}</TableCell>
                                            <TableCell className="text-right"><PaymentFormDialog subscription={sub} /></TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No pending payments.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="history">
                     <Card className="rounded-xl shadow-md">
                        <CardHeader><CardTitle>Completed Payments</CardTitle><CardDescription>Record of all processed payments.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Tool</TableHead><TableHead>Dept</TableHead><TableHead>Amount</TableHead><TableHead>Txn ID</TableHead><TableHead>Paid On</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {paymentHistory.length > 0 ? paymentHistory.map(sub => (
                                         <PaymentProcessDialog subscription={sub} key={sub.id}>
                                            <TableRow className="cursor-pointer hover:bg-gray-50">
                                                <TableCell>{sub.toolName}</TableCell>
                                                <TableCell>{sub.department}</TableCell>
                                                <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                                <TableCell>{sub.paymentDetails?.transactionId || 'N/A'}</TableCell>
                                                <TableCell>{sub.paymentDate ? format(new Date(sub.paymentDate), "PP") : 'N/A'}</TableCell>
                                            </TableRow>
                                        </PaymentProcessDialog>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No payment history.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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

    