"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Subscription } from "@/lib/types";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const StatusBadge = ({ status }: { status: string }) => {
    const colorClass = 
        status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-400' :
        status === 'Pending' ? 'bg-amber-500/20 text-amber-700 border-amber-400' :
        status === 'Approved' ? 'bg-sky-500/20 text-sky-700 border-sky-400' :
        status === 'Declined' ? 'bg-red-500/20 text-red-700 border-red-400' :
        'bg-gray-500/20 text-gray-700 border-gray-400';

    return <Badge variant="outline" className={`capitalize ${colorClass}`}>{status.toLowerCase()}</Badge>;
};

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
        <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4"/>Approve
            </Button>
            <Dialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
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
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Welcome, {currentUser.name}</h1>
                <p className="text-muted-foreground">Manage your department's subscription requests.</p>
            </header>

            {expiringSoon.length > 0 && (
                 <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <AlertCircle className="h-6 w-6 text-amber-600"/>
                        <CardTitle className="text-amber-800">Expiring Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                        {expiringSoon.map(sub => (
                            <li key={sub.id} className="text-sm">
                                Your department’s subscription for <strong>{sub.toolName}</strong> is expiring {formatDistanceToNow(new Date(sub.expiryDate!), { addSuffix: true })}.
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock /> Pending Approvals</CardTitle>
                    <CardDescription>Review and act on new subscription requests.</CardDescription>
                </CardHeader>
                <CardContent>
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
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No pending approvals.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}