
"use client"

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { Bell, FileText, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import RenewRequestDialog from "./renew-request-dialog";
import { Button } from "@/components/ui/button";
import NewRequestDialog from "./new-request-dialog";
import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Subscription } from "@/lib/types";
import DeclineInfoDialog from "../../components/decline-info-dialog";

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
                            <TableHead>Cost</TableHead>
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
                                      <TableCell>{format(new Date(sub.approvalDate || sub.requestDate), "PP")}</TableCell>
                                  </TableRow>
                                </DeclineInfoDialog>
                               ) : (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.toolName}</TableCell>
                                    <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                    <TableCell>{format(new Date(sub.approvalDate || sub.requestDate), "PP")}</TableCell>
                                </TableRow>
                               )
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No history found.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
);

export default function DepartmentPOCDashboardPage() {
    const { currentUser, subscriptions } = useAppStore();
    const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

    if (!currentUser) return null;

    const mySubscriptions = subscriptions.filter(s => s.requestedBy === currentUser.id);
    const activeSubscriptions = mySubscriptions.filter(s => s.status === 'Active');
    const pendingRequests = mySubscriptions.filter(s => s.status === 'Pending' || s.status === 'Approved');
    const renewalAlerts = activeSubscriptions.filter(s => s.expiryDate && new Date(s.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    const approvedHistory = mySubscriptions.filter(s => s.status === 'Active' || s.status === 'Expired' && s.approvedBy);
    const declinedHistory = mySubscriptions.filter(s => s.status === 'Declined');
    
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeOut"
            }
        })
    };


    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">Welcome to the Department of POC Dashboard!</h1>
                <p className="text-slate-500">Manage your department's active subscriptions and renewal alerts efficiently.</p>
            </header>
            
            <NewRequestDialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {renewalAlerts.length > 0 && (
                     <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
                        <Card className="rounded-xl bg-amber-50 border-amber-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Bell className="h-6 w-6 text-amber-600"/>
                                <CardTitle className="text-amber-800 text-lg">Renewal Alerts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                {renewalAlerts.map(sub => (
                                    <li key={sub.id} className="flex justify-between items-center text-sm">
                                        <span>Your subscription for <strong>{sub.toolName}</strong> is expiring {formatDistanceToNow(new Date(sub.expiryDate!), { addSuffix: true })}.</span>
                                        <RenewRequestDialog subscription={sub} dialogTrigger={<Button variant="outline" size="sm">Renew Now</Button>} />
                                    </li>
                                ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={renewalAlerts.length > 0 ? 1 : 0}>
                   <Card className="rounded-xl bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2 font-semibold text-slate-700 text-lg">
                                    <PlusCircle className="text-primary"/>
                                    New Subscription Request
                                </CardTitle>
                                <CardDescription className="mt-2 text-slate-600">
                                    Easily request a new software subscription for your department.
                                </CardDescription>
                            </div>
                             <Button 
                                onClick={() => setIsNewRequestOpen(true)} 
                                className="bg-gradient-to-r from-primary to-accent text-white transition-transform duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 whitespace-nowrap"
                            >
                                Request Now
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
                <Card className="rounded-xl shadow-md">
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
                                {activeSubscriptions.length > 0 ? activeSubscriptions.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.toolName}</TableCell>
                                        <TableCell>${sub.cost.toFixed(2)}</TableCell>
                                        <TableCell>{sub.expiryDate ? formatDistanceToNow(new Date(sub.expiryDate), { addSuffix: true }) : 'N/A'}</TableCell>
                                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                                        <TableCell className="text-right">
                                        <RenewRequestDialog subscription={sub} dialogTrigger={<Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Renew</Button>} />
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No active subscriptions found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
            
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}>
                <Card className="rounded-xl shadow-md">
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
                                )) : <TableRow><TableCell colSpan={4} className="text-center h-24">No pending requests found.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </motion.div>
            
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
                 <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">Subscription History</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HistoryCard title="Approved History" icon={<CheckCircle className="text-green-600"/>} data={approvedHistory} bgColor="bg-green-50/50" />
                    <HistoryCard title="Declined History" icon={<XCircle className="text-red-600"/>} data={declinedHistory} bgColor="bg-red-50/50" isDecline={true} />
                </div>
            </motion.div>
        </div>
    );
}
