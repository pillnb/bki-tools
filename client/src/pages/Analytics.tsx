import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Package, Wrench } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const { user } = useAuth();
  const toolsQuery = trpc.tools.list.useQuery();
  const mostUsedToolsQuery = trpc.analytics.getMostUsedTools.useQuery({ limit: 10 });
  const toolStatsQuery = trpc.analytics.getToolBorrowingStats.useQuery();
  const stockStatsQuery = trpc.analytics.getStockUsageStats.useQuery();

  const tools = toolsQuery.data || [];
  const mostUsedTools = mostUsedToolsQuery.data || [];
  const toolStats = toolStatsQuery.data || {};
  const stockStats = stockStatsQuery.data || {};

  // Prepare chart data for most used tools
  const mostUsedToolsData = mostUsedTools.map((usage) => {
    const tool = tools.find((t) => t.id === usage.toolId);
    return {
      name: tool?.name || `Tool ${usage.toolId}`,
      usage: usage.usageCount,
      toolId: usage.toolId,
    };
  });

  // Prepare chart data for tool borrowing stats
  const toolBorrowingData = Object.entries(toolStats).map(([toolId, count]) => {
    const tool = tools.find((t) => t.id === parseInt(toolId));
    return {
      name: tool?.name || `Tool ${toolId}`,
      borrowings: count,
    };
  });

  // Calculate summary stats
  const totalTools = tools.length;
  const availableTools = tools.filter((t) => t.status === "available").length;
  const inUseTools = tools.filter((t) => t.status === "in_use").length;
  const needsCalibrationTools = tools.filter((t) => t.status === "needs_calibration").length;

  const isLoading =
    toolsQuery.isLoading ||
    mostUsedToolsQuery.isLoading ||
    toolStatsQuery.isLoading ||
    stockStatsQuery.isLoading;

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    isLoading: loading,
  }: {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    isLoading?: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-muted-foreground mt-2">
          Analisis penggunaan alat dan stok barang
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Alat"
          value={totalTools}
          icon={Wrench}
          color="text-blue-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Alat Tersedia"
          value={availableTools}
          icon={Wrench}
          color="text-green-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Sedang Digunakan"
          value={inUseTools}
          icon={TrendingUp}
          color="text-orange-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Perlu Kalibrasi"
          value={needsCalibrationTools}
          icon={Wrench}
          color="text-red-500"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Used Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Alat Paling Sering Digunakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostUsedToolsQuery.isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : mostUsedToolsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mostUsedToolsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        {/* Tool Borrowing Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Statistik Peminjaman Alat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {toolStatsQuery.isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : toolBorrowingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolBorrowingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="borrowings" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Status Alat</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Tersedia", value: availableTools },
                      { name: "Sedang Digunakan", value: inUseTools },
                      { name: "Perlu Kalibrasi", value: needsCalibrationTools },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span className="text-sm">Tersedia: {availableTools} alat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-sm">Sedang Digunakan: {inUseTools} alat</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-sm">Perlu Kalibrasi: {needsCalibrationTools} alat</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
