"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, FileText, Bell, PlusCircle } from "lucide-react";
import RenewRequestDialog from "./renew-request-dialog";
import { Button } from "@/components/ui/button";
import NewRequestDialog from "./new-request-dialog";
import { useState } from "react";

const StatusBadge = ({ status }: { status: string }) => {
    const variant: "default" | "secondary" | "destructive" | "outline" =
        status === 'Active' ? 'default' :
        status === 'Pending' ? 'secondary' :
        status === 'Declined' ? 'destructive' : 'outline';
    
    let colorClass = 'bg-gray-200 text-gray-800';
    if (status === 'Active') colorClass = 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
    if (status === 'Pending' || status === 'Approved') colorClass = 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
    if (status === 'Expired' || status === 'Declined') colorClass = 'bg-gradient-to-r from-red-400 to-rose-500 text-white';


    return <Badge className={`capitalize border-none ${colorClass}`}>{status.toLowerCase()}</Badge>;
};

export default function DepartmentPOCDashboardPage() {
    const { currentUser, subscriptions } = useAppStore();
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

    if (!currentUser) return null;

    const mySubscriptions = subscriptions.filter(s => s.requestedBy === currentUser.id && s.status === 'Active');
    const pendingRequests = subscriptions.filter(s => s.requestedBy === currentUser.id && (s.status === 'Pending' || s.status === 'Approved' || s.status === 'Declined'));
    const renewalAlerts = mySubscriptions.filter(s => s.expiryDate && new Date(s.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Welcome to the Department of POC Dashboard!</h1>
                    <p className="text-slate-500">Manage your department's active subscriptions and renewal alerts efficiently.</p>
                </div>
                 <div className="flex-shrink-0">
                    <Button onClick={() => setIsNewRequestOpen(true)} className="bg-gradient-to-r from-primary to-blue-500 text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg w-full md:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4"/> Request New Subscription
                    </Button>
                    <NewRequestDialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen} />
                </div>
            </header>

            {renewalAlerts.length > 0 && (
                 <Card className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Bell className="h-6 w-6 text-amber-600"/>
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

            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">📋 Department Subscriptions</CardTitle>
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
                                      <RenewRequestDialog subscription={sub} trigger={<Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Renew</Button>} />
                                    </TableCell>
                                </TableRow>
                            )) : <TableRow><TableCell colSpan={5} className="text-center">No active subscriptions found.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800"><FileText /> Pending Requests</CardTitle>
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
