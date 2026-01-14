import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Activity, Shield, Wifi } from "lucide-react";

export default function ITDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">IT Management</h1>
                <p className="text-gray-400">System status and infrastructure monitoring</p>
            </div>
            <Button variant="secondary">System Check</Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Server Status</CardTitle>
                    <Server className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">Operational</div>
                    <p className="text-xs text-gray-400">Uptime: 99.99%</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Active Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">124</div>
                    <p className="text-xs text-gray-400">Current live users</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Security Threats</CardTitle>
                    <Shield className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">None</div>
                    <p className="text-xs text-gray-400">Last scan: 5 mins ago</p>
                </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Network Load</CardTitle>
                    <Wifi className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">45%</div>
                    <p className="text-xs text-gray-400">Bandwidth usage</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="bg-gray-800 border-gray-700 h-[400px]">
                <CardHeader>
                    <CardTitle className="text-white">System Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm font-mono text-gray-400">
                        <div className="flex justify-between border-b border-gray-700 pb-1">
                            <span>[INFO] Server started</span>
                            <span>10:00:01</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 pb-1">
                            <span>[INFO] Database connection established</span>
                            <span>10:00:02</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 pb-1">
                            <span>[WARN] High memory usage detected</span>
                            <span>11:23:45</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 pb-1">
                            <span>[INFO] Auto-scaling triggered</span>
                            <span>11:24:00</span>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
