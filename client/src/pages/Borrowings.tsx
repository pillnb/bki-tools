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
import { Plus, Eye, Download, Printer, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Borrowings() {
  const { user } = useAuth();
  const borrowingsQuery = trpc.borrowings.list.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const borrowings = borrowingsQuery.data || [];
  const filteredBorrowings = borrowings.filter(
    (b) =>
      b.borrowingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_approval: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      borrowed: "bg-green-100 text-green-800",
      returned: "bg-gray-100 text-gray-800",
      overdue: "bg-red-100 text-red-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_approval: "Menunggu Persetujuan",
      approved: "Disetujui",
      borrowed: "Sedang Dipinjam",
      returned: "Dikembalikan",
      overdue: "Terlambat",
      rejected: "Ditolak",
    };
    return labels[status] || status;
  };

  const isOverdue = (expectedReturnDate: Date) => {
    return new Date(expectedReturnDate) < new Date() && !expectedReturnDate;
  };

  const canCreateBorrowing = ["user", "admin", "lab_supervisor", "coordinator"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Peminjaman Alat</h1>
          <p className="text-muted-foreground mt-2">
            Kelola peminjaman alat dengan alur persetujuan bertingkat
          </p>
        </div>
        {canCreateBorrowing && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Buat Peminjaman Baru
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Cari berdasarkan ID peminjaman atau tujuan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Borrowings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Peminjaman ({filteredBorrowings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {borrowingsQuery.isLoading ? (
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
                    <TableHead>ID Peminjaman</TableHead>
                    <TableHead>Tanggal Pinjam</TableHead>
                    <TableHead>Tgl Kembali Rencana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tujuan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBorrowings.length > 0 ? (
                    filteredBorrowings.map((borrowing) => (
                      <TableRow key={borrowing.id}>
                        <TableCell className="font-medium">{borrowing.borrowingId}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(borrowing.borrowDate).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(borrowing.expectedReturnDate).toLocaleDateString("id-ID")}
                          {isOverdue(borrowing.expectedReturnDate) && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Overdue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(borrowing.status || "pending_approval")}>
                            {getStatusLabel(borrowing.status || "pending_approval")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {borrowing.purpose || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={isDetailOpen && selectedBorrowing?.id === borrowing.id} onOpenChange={setIsDetailOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBorrowing(borrowing)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detail Peminjaman: {borrowing.borrowingId}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">ID Peminjaman</label>
                                      <p className="text-sm text-muted-foreground">{borrowing.borrowingId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge className={getStatusColor(borrowing.status || "pending_approval")}>
                                        {getStatusLabel(borrowing.status || "pending_approval")}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Tanggal Pinjam</label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(borrowing.borrowDate).toLocaleDateString("id-ID")}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Tgl Kembali Rencana</label>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(borrowing.expectedReturnDate).toLocaleDateString("id-ID")}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium">Tujuan Peminjaman</label>
                                      <p className="text-sm text-muted-foreground">{borrowing.purpose || "-"}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium">Catatan</label>
                                      <p className="text-sm text-muted-foreground">{borrowing.notes || "-"}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  {borrowing.status === "approved" && (
                                    <Button variant="outline" size="sm">
                                      <Printer className="w-4 h-4 mr-2" />
                                      Print Form
                                    </Button>
                                  )}
                                  {borrowing.status === "pending_approval" && (
                                    <>
                                      <Button variant="outline" size="sm" className="text-red-600">
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Tolak
                                      </Button>
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Setujui
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada peminjaman yang ditemukan
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
