"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Filter } from "lucide-react";

const mockAlerts = [
    {
        id: "1",
        title: "Failed SSH Login Attempt",
        source: "AWS GuardDuty",
        severity: "high",
        status: "new",
        createdAt: "2026-02-12T11:45:00Z",
    },
    {
        id: "2",
        title: "Malicious File Detected",
        source: "CrowdStrike",
        severity: "critical",
        status: "correlated",
        createdAt: "2026-02-12T11:30:00Z",
    },
    {
        id: "3",
        title: "Unusual Outbound Traffic",
        source: "AWS GuardDuty",
        severity: "medium",
        status: "processed",
        createdAt: "2026-02-12T10:15:00Z",
    },
    {
        id: "4",
        title: "Policy Violation Detected",
        source: "Custom Integration",
        severity: "low",
        status: "new",
        createdAt: "2026-02-12T09:30:00Z",
    },
];

export default function AlertsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Alerts</h1>
                    <p className="text-slate-400 mt-1">Raw security alerts from integrations</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">All Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Title</TableHead>
                                <TableHead className="text-slate-400">Source</TableHead>
                                <TableHead className="text-slate-400">Severity</TableHead>
                                <TableHead className="text-slate-400">Status</TableHead>
                                <TableHead className="text-slate-400">Created</TableHead>
                                <TableHead className="text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockAlerts.map((alert) => (
                                <TableRow key={alert.id} className="border-slate-800">
                                    <TableCell className="font-medium text-white">
                                        <div className="flex items-center space-x-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            <span>{alert.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400">{alert.source}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                alert.severity === "critical"
                                                    ? "destructive"
                                                    : alert.severity === "high"
                                                        ? "default"
                                                        : "secondary"
                                            }
                                        >
                                            {alert.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {alert.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        {new Date(alert.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
