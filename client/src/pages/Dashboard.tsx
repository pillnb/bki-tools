import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wrench, Package, ClipboardList, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const toolsQuery = trpc.tools.list.useQuery();
  const stockQuery = trpc.stock.list.useQuery();
  const borrowingsQuery = trpc.borrowings.list.useQuery();
  const lowStockQuery = trpc.stock.getLowStock.useQuery();
  const analyticsQuery = trpc.analytics.getMostUsedTools.useQuery({ limit: 5 });

  const tools = toolsQuery.data || [];
  const stock = stockQuery.data || [];
  const borrowings = borrowingsQuery.data || [];
  const lowStock = lowStockQuery.data || [];
  const mostUsedTools = analyticsQuery.data || [];

  const availableTools = tools.filter((t) => t.status === "available").length;
  const inUseTools = tools.filter((t) => t.status === "in_use").length;
  const lowStockCount = lowStock.length;
  const pendingBorrowings = borrowings.filter((b) => b.status === "pending_approval").length;

  const isLoading =
    toolsQuery.isLoading ||
    stockQuery.isLoading ||
    borrowingsQuery.isLoading ||
    lowStockQuery.isLoading;

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
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          BKI Tools Management System
        </h1>
        <p className="text-muted-foreground mt-2">
          Kelola alat inspeksi dan stok barang dengan mudah
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Alat"
          value={tools.length}
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
          title="Alat Sedang Digunakan"
          value={inUseTools}
          icon={ClipboardList}
          color="text-orange-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Stock Rendah"
          value={lowStockCount}
          icon={AlertCircle}
          color="text-red-500"
          isLoading={isLoading}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Barang Stok"
          value={stock.length}
          icon={Package}
          color="text-purple-500"
          isLoading={isLoading}
        />
        <StatCard
          title="Peminjaman Menunggu Approval"
          value={pendingBorrowings}
          icon={AlertCircle}
          color="text-yellow-500"
          isLoading={isLoading}
        />
      </div>

      {/* Most Used Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alat Paling Sering Digunakan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : mostUsedTools.length > 0 ? (
            <div className="space-y-3">
              {mostUsedTools.map((usage, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">Alat ID: {usage.toolId}</p>
                      <p className="text-sm text-muted-foreground">
                        Terakhir digunakan: {usage.lastUsedDate ? new Date(usage.lastUsedDate).toLocaleDateString("id-ID") : "-"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{usage.usageCount}</p>
                    <p className="text-xs text-muted-foreground">kali digunakan</p>
                  </div>
                </div>
              ))}
            </div>
           ) : (
            <p className="text-center text-muted-foreground py-8">Belum ada data penggunaan alat</p>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Peringatan: Stok Barang Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">
              {lowStockCount} item memiliki stok di bawah batas minimum. Segera lakukan pembelian.
            </p>
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.itemId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-muted-foreground">Min: {item.minThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
