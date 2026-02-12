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
import { Play, Plus, Edit } from "lucide-react";
import Link from "next/link";

const mockPlaybooks = [
    {
        id: "1",
        name: "Critical Alert Response",
        description: "Automatic response to critical severity alerts",
        isActive: true,
        triggerCount: 45,
        lastRun: "2026-02-12T11:30:00Z",
    },
    {
        id: "2",
        name: "VirusTotal IP Lookup",
        description: "Check suspicious IPs against VirusTotal",
        isActive: true,
        triggerCount: 120,
        lastRun: "2026-02-12T10:15:00Z",
    },
    {
        id: "3",
        name: "Slack Notification Pipeline",
        description: "Send high severity alerts to Slack",
        isActive: false,
        triggerCount: 0,
        lastRun: null,
    },
];

export default function PlaybooksPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Playbooks</h1>
                    <p className="text-slate-400 mt-1">Automated response workflows</p>
                </div>
                <Link href="/dashboard/playbooks/editor">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Playbook
                    </Button>
                </Link>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Your Playbooks</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead className="text-slate-400">Name</TableHead>
                                <TableHead className="text-slate-400">Description</TableHead>
                                <TableHead className="text-slate-400">Status</TableHead>
                                <TableHead className="text-slate-400">Triggers</TableHead>
                                <TableHead className="text-slate-400">Last Run</TableHead>
                                <TableHead className="text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockPlaybooks.map((playbook) => (
                                <TableRow key={playbook.id} className="border-slate-800">
                                    <TableCell className="font-medium text-white">
                                        {playbook.name}
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        {playbook.description}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={playbook.isActive ? "default" : "secondary"}>
                                            {playbook.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        {playbook.triggerCount}
                                    </TableCell>
                                    <TableCell className="text-slate-400">
                                        {playbook.lastRun
                                            ? new Date(playbook.lastRun).toLocaleString()
                                            : "Never"}
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="ghost" size="sm">
                                            <Play className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Edit className="h-4 w-4" />
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
