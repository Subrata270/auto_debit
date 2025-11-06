"use client";

import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Users, Wallet, RefreshCw, CheckCircle } from "lucide-react";
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend, Line, Pie } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  cost: {
    label: "Cost ($)",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--accent))",
  },
};

export default function AdminDashboardPage() {
    const { currentUser, subscriptions, users } = useAppStore();

    if (!currentUser || currentUser.role !== 'admin') return null;

    const totalActive = subscriptions.filter(s => s.status === 'Active').length;
    const totalPending = subscriptions.filter(s => s.status === 'Pending').length;
    const totalRenewals = subscriptions.filter(s => s.remarks?.includes('Renewal')).length;
    const monthlySpending = subscriptions
        .filter(s => s.status === 'Active' && s.paymentDate)
        .reduce((acc, sub) => acc + sub.cost, 0);

    const departmentUsage = subscriptions.reduce((acc, sub) => {
        if (!acc[sub.department]) {
            acc[sub.department] = { name: sub.department, count: 0 };
        }
        acc[sub.department].count++;
        return acc;
    }, {} as Record<string, { name: string, count: number }>);
    const departmentUsageData = Object.values(departmentUsage);

    const monthlySpendingData = subscriptions
      .filter(s => s.paymentDate)
      .reduce((acc, sub) => {
        const month = new Date(sub.paymentDate!).toLocaleString('default', { month: 'short' });
        if(!acc[month]){
          acc[month] = { name: month, cost: 0 };
        }
        acc[month].cost += sub.cost;
        return acc;
      }, {} as Record<string, { name: string, cost: number }>);
    const spendingData = Object.values(monthlySpendingData).slice(-6); // Last 6 months

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Admin Overview</h1>
                <p className="text-muted-foreground">A complete overview of the subscription ecosystem.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active Subscriptions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalActive}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${monthlySpending.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Renewals</CardTitle>
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRenewals}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LineChart /> Monthly Spending</CardTitle>
                        <CardDescription>Spending over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <LineChart data={spendingData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="cost" stroke="var(--color-cost)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart /> Department-wise Tool Usage</CardTitle>
                        <CardDescription>Number of subscriptions per department.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer>
                                <BarChart data={departmentUsageData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
