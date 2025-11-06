"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertTriangle, Check, History, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Subscription } from "@/lib/types";

const PaymentDialog = ({ subscription }: { subscription: Subscription }) => {
    const { currentUser, markAsPaid } = useAppStore();
    const [paymentMode, setPaymentMode] = useState("Card");

    const handlePayment = () => {
        if (!currentUser) return;
        markAsPaid(subscription.id, currentUser.id);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm">Process Payment</Button>
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

export default function FinanceDashboardPage() {
    const { currentUser, subscriptions, users } = useAppStore();

    if (!currentUser || currentUser.role !== 'finance') return null;
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const pendingPayments = subscriptions.filter(s => s.status === 'Approved');
    const upcomingPayments = subscriptions.filter(s => s.status === 'Active' && s.expiryDate && new Date(s.expiryDate) <= nextWeek && new Date(s.expiryDate) > now);
    const paymentHistory = subscriptions.filter(s => s.status === 'Active' || s.status === 'Expired');
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown';

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Welcome to the Finance Portal</h1>
                <p className="text-muted-foreground">Manage and track all subscription payments.</p>
            </header>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPayments.length}</div>
                        <p className="text-xs text-muted-foreground">Requests awaiting payment processing.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Renewals This Week</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingPayments.length}</div>
                        <p className="text-xs text-muted-foreground">Subscriptions due for renewal this week.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Subscriptions</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{paymentHistory.length}</div>
                        <p className="text-xs text-muted-foreground">Total subscriptions processed.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Payments</CardTitle>
                    <CardDescription>Subscriptions approved and ready for payment.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Approved By</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingPayments.length > 0 ? pendingPayments.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.toolName}</TableCell>
                                    <TableCell>{sub.department}</TableCell>
                                    <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                    <TableCell>{getUserName(sub.approvedBy!)}</TableCell>
                                    <TableCell className="text-right">
                                       <PaymentDialog subscription={sub} />
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No pending payments.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}