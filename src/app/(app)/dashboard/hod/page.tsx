
"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Subscription } from "@/lib/types";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ApprovalActions = ({ subscription }: { subscription: Subscription }) => {
    const { updateSubscriptionStatus } = useAppStore();
    const [isDeclineOpen, setIsDeclineOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState("");

    const handleApprove = () => {
        updateSubscriptionStatus(subscription.id, 'Approved');
    }

    const handleDecline = () => {
        updateSubscriptionStatus(subscription.id, 'Declined', declineReason);
        setIsDeclineOpen(false);
        setDeclineReason("");
    }

    return (
        <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 transition-all hover:scale-105" onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4"/>Approve
            </Button>
            <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105">
                        <XCircle className="mr-2 h-4 w-4"/>Decline
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Request</DialogTitle>
                        <DialogDescription>Please provide a reason for declining this subscription request for {subscription.toolName}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="decline-reason">Reason for Decline</Label>
                        <Textarea id="decline-reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="e.g., Budget constraints, duplicate tool, etc." />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDecline} disabled={!declineReason}>Confirm Decline</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function HODDashboardPage() {
    const { currentUser, subscriptions, users } = useAppStore();

    if (!currentUser || currentUser.role !== 'hod') return null;

    const departmentSubscriptions = subscriptions.filter(s => s.department === currentUser.department);
    const pendingApprovals = departmentSubscriptions.filter(s => s.status === 'Pending');
    const expiringSoon = departmentSubscriptions.filter(s => s.status === 'Active' && s.expiryDate && new Date(s.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown User';

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <header className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">Welcome, {currentUser.name}</h1>
                <p className="text-muted-foreground mt-1">Manage your department’s subscription requests efficiently.</p>
            </header>

            <div className="mt-6">
                {expiringSoon.length > 0 && (
                    <Card className="bg-[#FFF4E0] border-amber-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 mb-8">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-600"/>
                            <CardTitle className="text-amber-800">Expiring Soon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                            {expiringSoon.map(sub => (
                                <li key={sub.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                                    <span className="mb-2 sm:mb-0">
                                        Your department’s subscription for <strong>{sub.toolName}</strong> is expiring {formatDistanceToNow(new Date(sub.expiryDate!), { addSuffix: true })}.
                                    </span>
                                    <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100">Renew Now</Button>
                                </li>
                            ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-800"><Clock /> Pending Approvals</CardTitle>
                        <CardDescription>Review and act on new subscription requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* For Mobile - stacked cards */}
                        <div className="md:hidden space-y-4">
                            {pendingApprovals.length > 0 ? pendingApprovals.map(sub => (
                                <div key={sub.id} className="border rounded-lg p-4 space-y-3 bg-background shadow-sm">
                                    <div className="font-bold text-lg">{sub.toolName}</div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p><strong>Requested By:</strong> {getUserName(sub.requestedBy)}</p>
                                        <p><strong>Cost:</strong> <span className="font-semibold text-foreground">${sub.cost.toFixed(2)}</span></p>
                                        <p><strong>Date:</strong> {format(new Date(sub.requestDate), "PP")}</p>
                                    </div>
                                    <div className="pt-2">
                                    <ApprovalActions subscription={sub} />
                                    </div>
                                </div>
                            )) : <div className="text-center text-muted-foreground py-8">No pending approvals.</div>}
                        </div>
                        
                        {/* For Desktop - table */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tool</TableHead>
                                        <TableHead>Requested By</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Requested On</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingApprovals.length > 0 ? pendingApprovals.map(sub => (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.toolName}</TableCell>
                                            <TableCell>{getUserName(sub.requestedBy)}</TableCell>
                                            <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                            <TableCell>{format(new Date(sub.requestDate), "PP")}</TableCell>
                                            <TableCell className="text-right">
                                                <ApprovalActions subscription={sub} />
                                            </TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No pending approvals.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
