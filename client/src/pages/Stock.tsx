import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Stock() {
  const { user } = useAuth();
  const stockQuery = trpc.stock.list.useQuery();
  const lowStockQuery = trpc.stock.getLowStock.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const stock = stockQuery.data || [];
  const lowStock = lowStockQuery.data || [];
  
  const filteredStock = stock.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-100 text-green-800",
      low_stock: "bg-yellow-100 text-yellow-800",
      out_of_stock: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: "Tersedia",
      low_stock: "Stok Rendah",
      out_of_stock: "Stok Habis",
    };
    return labels[status] || status;
  };

  const isLowStock = (quantity: number, minThreshold: number) => {
    return quantity <= minThreshold;
  };

  const canEdit = ["admin", "lab_supervisor"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok Barang</h1>
          <p className="text-muted-foreground mt-2">
            Kelola stok barang habis pakai dengan sistem alert otomatis
          </p>
        </div>
        {canEdit && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Barang Baru
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Cari berdasarkan nama atau ID barang..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Peringatan: {lowStock.length} Item Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">
              Item-item berikut memiliki stok di bawah batas minimum dan perlu segera dibeli kembali.
            </p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded border border-red-200">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.itemId}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-red-600">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Min: {item.minThreshold}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Barang Stok ({filteredStock.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {stockQuery.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Barang</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Min/Max</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga Satuan</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.length > 0 ? (
                    filteredStock.map((item) => (
                      <TableRow key={item.id} className={isLowStock(item.quantity, item.minThreshold) ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{item.itemId}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.unit || "-"}
                        </TableCell>
                        <TableCell>
                          <span className={isLowStock(item.quantity, item.minThreshold) ? "font-bold text-red-600" : ""}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.minThreshold} / {item.maxThreshold}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status || "available")}>
                            {getStatusLabel(item.status || "available")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.unitPrice ? `Rp ${parseInt(item.unitPrice).toLocaleString("id-ID")}` : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.supplier || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={isDetailOpen && selectedItem?.id === item.id} onOpenChange={setIsDetailOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedItem(item)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detail Barang: {item.name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">ID Barang</label>
                                      <p className="text-sm text-muted-foreground">{item.itemId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Unit</label>
                                      <p className="text-sm text-muted-foreground">{item.unit || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Stok Saat Ini</label>
                                      <p className="text-sm font-bold">{item.quantity}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge className={getStatusColor(item.status || "available")}>
                                        {getStatusLabel(item.status || "available")}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Batas Minimum</label>
                                      <p className="text-sm text-muted-foreground">{item.minThreshold}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Batas Maksimum</label>
                                      <p className="text-sm text-muted-foreground">{item.maxThreshold}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Harga Satuan</label>
                                      <p className="text-sm text-muted-foreground">
                                        {item.unitPrice ? `Rp ${parseInt(item.unitPrice).toLocaleString("id-ID")}` : "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Supplier</label>
                                      <p className="text-sm text-muted-foreground">{item.supplier || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Lokasi</label>
                                      <p className="text-sm text-muted-foreground">{item.location || "-"}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium">Keterangan</label>
                                      <p className="text-sm text-muted-foreground">{item.description || "-"}</p>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {canEdit && (
                              <>
                                <Button variant="ghost" size="sm" title="Edit">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Hapus">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Tidak ada barang yang ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
