"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { AlertCircle, Clock, FileText, Send } from "lucide-react";
import RenewRequestDialog from "./renew-request-dialog";
import { Button } from "@/components/ui/button";

const StatusBadge = ({ status }: { status: string }) => {
    const variant: "default" | "secondary" | "destructive" | "outline" =
        status === 'Active' ? 'default' :
        status === 'Pending' ? 'secondary' :
        status === 'Declined' ? 'destructive' : 'outline';
    const colorClass = 
        status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-400' :
        status === 'Pending' ? 'bg-amber-500/20 text-amber-700 border-amber-400' :
        status === 'Approved' ? 'bg-sky-500/20 text-sky-700 border-sky-400' :
        status === 'Declined' ? 'bg-red-500/20 text-red-700 border-red-400' :
        'bg-gray-500/20 text-gray-700 border-gray-400';

    return <Badge variant="outline" className={`capitalize ${colorClass}`}>{status.toLowerCase()}</Badge>;
};

export default function EmployeeDashboardPage() {
    const { currentUser, subscriptions } = useAppStore();

    if (!currentUser) return null;

    const mySubscriptions = subscriptions.filter(s => s.requestedBy === currentUser.id && s.status === 'Active');
    const pendingRequests = subscriptions.filter(s => s.requestedBy === currentUser.id && (s.status === 'Pending' || s.status === 'Approved' || s.status === 'Declined'));
    const renewalAlerts = mySubscriptions.filter(s => s.expiryDate && new Date(s.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Welcome, {currentUser.name}!</h1>
                <p className="text-muted-foreground">Here's an overview of your software subscriptions.</p>
            </header>

            {renewalAlerts.length > 0 && (
                 <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <AlertCircle className="h-6 w-6 text-amber-600"/>
                        <CardTitle className="text-amber-800">Renewal Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                        {renewalAlerts.map(sub => (
                            <li key={sub.id} className="flex justify-between items-center text-sm">
                                <span>Your subscription for <strong>{sub.toolName}</strong> is expiring {formatDistanceToNow(new Date(sub.expiryDate!), { addSuffix: true })}.</span>
                                <RenewRequestDialog subscription={sub} trigger={<Button variant="outline" size="sm">Renew Now</Button>} />
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> My Subscriptions</CardTitle>
                    <CardDescription>All your active software subscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Expires In</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mySubscriptions.length > 0 ? mySubscriptions.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.toolName}</TableCell>
                                    <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                    <TableCell>{sub.expiryDate ? formatDistanceToNow(new Date(sub.expiryDate), { addSuffix: true }) : 'N/A'}</TableCell>
                                    <TableCell><StatusBadge status={sub.status} /></TableCell>
                                    <TableCell className="text-right">
                                      <RenewRequestDialog subscription={sub} trigger={<Button variant="ghost" size="sm">Renew</Button>} />
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No active subscriptions found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Send /> Pending Requests</CardTitle>
                    <CardDescription>Track the status of your new and renewal requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Requested On</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingRequests.length > 0 ? pendingRequests.map(sub => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.toolName}</TableCell>
                                    <TableCell>{sub.department}</TableCell>
                                    <TableCell>{format(new Date(sub.requestDate), "PP")}</TableCell>
                                    <TableCell><StatusBadge status={sub.status} /></TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={4} className="text-center">No pending requests found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
