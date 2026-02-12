"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

const mockIntegrations = [
    {
        id: "1",
        name: "AWS GuardDuty",
        type: "threat-detection",
        isEnabled: true,
        lastSync: "2026-02-12T11:45:00Z",
        alertCount: 1245,
    },
    {
        id: "2",
        name: "CrowdStrike Falcon",
        type: "endpoint-security",
        isEnabled: true,
        lastSync: "2026-02-12T11:30:00Z",
        alertCount: 856,
    },
    {
        id: "3",
        name: "VirusTotal",
        type: "threat-intelligence",
        isEnabled: false,
        lastSync: null,
        alertCount: 0,
    },
    {
        id: "4",
        name: "Slack Notifications",
        type: "communication",
        isEnabled: true,
        lastSync: "2026-02-12T10:00:00Z",
        alertCount: 0,
    },
];

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Integrations</h1>
                    <p className="text-slate-400 mt-1">Connect third-party security tools</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Integration
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockIntegrations.map((integration) => (
                    <Card key={integration.id} className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white text-lg">
                                    {integration.name}
                                </CardTitle>
                                {integration.isEnabled ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-slate-600" />
                                )}
                            </div>
                            <CardDescription className="text-slate-400 capitalize">
                                {integration.type.replace("-", " ")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Status:</span>
                                    <Badge
                                        variant={integration.isEnabled ? "default" : "secondary"}
                                    >
                                        {integration.isEnabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Alerts:</span>
                                    <span className="text-white font-medium">
                                        {integration.alertCount}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Last Sync:</span>
                                    <span className="text-white text-xs">
                                        {integration.lastSync
                                            ? new Date(integration.lastSync).toLocaleString()
                                            : "Never"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                    Configure
                                </Button>
                                <Button
                                    variant={integration.isEnabled ? "destructive" : "default"}
                                    size="sm"
                                    className="flex-1"
                                >
                                    {integration.isEnabled ? "Disable" : "Enable"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
