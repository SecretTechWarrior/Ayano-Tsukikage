import { 
  useGetBotStatus, 
  useGetBotStats, 
  getGetBotStatusQueryKey, 
  getGetBotStatsQueryKey 
} from "@workspace/api-client-react";
import { 
  Activity, 
  Clock, 
  MessageSquare, 
  Users, 
  Radio, 
  ShieldCheck,
  Zap,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Dashboard() {
  const { data: status, isLoading: statusLoading } = useGetBotStatus();
  const { data: stats, isLoading: statsLoading } = useGetBotStats();

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const chartColors = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(290, 80%, 60%)",
    "hsl(250, 80%, 65%)",
    "hsl(220, 80%, 50%)"
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent inline-block">
          War Room
        </h1>
        <p className="text-muted-foreground mt-2 font-mono text-sm uppercase tracking-widest">
          System Overview & Diagnostics
        </p>
      </header>

      {/* Top Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card border-primary/20 bg-card/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground">
              Core Status
            </CardTitle>
            {statusLoading ? <Skeleton className="w-6 h-6 rounded-full" /> : (
              status?.online ? 
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-glow" style={{'--primary': '142 71% 45%'} as React.CSSProperties}></div>
                </div> : 
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
            )}
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold tracking-tight">
                  {status?.online ? "ONLINE" : "OFFLINE"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Entity: @{status?.botName || "unknown"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground">
              System Uptime
            </CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold font-mono text-primary/90 shadow-[0_0_20px_-5px_hsl(var(--primary)_/_0.3)]">
                {status?.uptime ? formatUptime(status.uptime) : "0h 0m 0s"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground">
              Total Intel
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-accent" />
                  {stats?.messagesPerDay}/day
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium font-mono uppercase tracking-wider text-muted-foreground">
              Network Scope
            </CardTitle>
            <Radio className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats?.totalChats.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">sectors</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-card border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Feature Utilization
            </CardTitle>
            <CardDescription>Most frequently accessed capabilities</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : stats?.topFeatures && stats.topFeatures.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topFeatures} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {stats.topFeatures.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono">
                [NO DATA ACCUMULATED]
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-primary/10 relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Master's Directive
            </CardTitle>
            <CardDescription>Current operational mandate</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="space-y-4 relative z-10">
                <div className="p-4 rounded-lg bg-black/40 border border-primary/20 shadow-[inset_0_0_20px_-10px_hsl(var(--primary))]">
                  <p className="font-serif text-lg italic text-primary/90">
                    "We lurk in the shadows and hunt the shadows."
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-3 bg-secondary/30 rounded border border-border">
                    <p className="text-xs text-muted-foreground font-mono mb-1">DESIGNATED MASTER</p>
                    <p className="font-bold tracking-wide">{status?.masterName || "Piyush"}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded border border-border">
                    <p className="text-xs text-muted-foreground font-mono mb-1">AUTHORIZED AGENTS</p>
                    <p className="font-bold tracking-wide">{status?.authorizedCount || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
