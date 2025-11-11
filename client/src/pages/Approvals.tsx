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
import { Eye, CheckCircle, XCircle, PenTool } from "lucide-react";
import { toast } from "sonner";

export default function Approvals() {
  const { user } = useAuth();
  const borrowingsQuery = trpc.borrowings.getPending.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signatureNote, setSignatureNote] = useState("");

  const borrowings = borrowingsQuery.data || [];
  const filteredBorrowings = borrowings.filter(
    (b) =>
      b.borrowingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approveMutation = trpc.approvals.approve.useMutation({
    onSuccess: () => {
      toast.success("Peminjaman disetujui");
      borrowingsQuery.refetch();
      setIsSignDialogOpen(false);
      setSignatureNote("");
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menyetujui peminjaman");
    },
  });

  const rejectMutation = trpc.approvals.reject.useMutation({
    onSuccess: () => {
      toast.success("Peminjaman ditolak");
      borrowingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menolak peminjaman");
    },
  });

  const handleApprove = (borrowing: any) => {
    setSelectedBorrowing(borrowing);
    setIsSignDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedBorrowing) return;

    approveMutation.mutate({
      borrowingId: selectedBorrowing.id,
      approverRole: user?.role as any,
      signatureData: "signature_" + Date.now(), // Placeholder untuk signature data
      notes: signatureNote,
    });
  };

  const handleReject = (borrowing: any) => {
    if (confirm("Apakah Anda yakin ingin menolak peminjaman ini?")) {
      rejectMutation.mutate({
        borrowingId: borrowing.id,
        approverRole: user?.role as any,
        notes: "Ditolak oleh " + user?.name,
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      lab_supervisor: "Pengawas Lab",
      coordinator: "Koordinator",
      sm_operasi: "SM Operasi",
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Peminjaman</h1>
        <p className="text-muted-foreground mt-2">
          Proses persetujuan peminjaman alat dengan e-signature ({getRoleLabel(user?.role || "")})
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Cari berdasarkan ID peminjaman atau tujuan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Peminjaman Menunggu Persetujuan ({filteredBorrowings.length})</CardTitle>
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
                    <TableHead>Tujuan</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {borrowing.purpose || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-50">
                            Menunggu Persetujuan
                          </Badge>
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
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleReject(borrowing)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(borrowing)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Setujui
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada peminjaman yang menunggu persetujuan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign Dialog */}
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Tanda Tangan Digital
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">ID Peminjaman</label>
              <p className="text-sm text-muted-foreground">{selectedBorrowing?.borrowingId}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Peran Persetujuan</label>
              <p className="text-sm text-muted-foreground">{getRoleLabel(user?.role || "")}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <Input
                placeholder="Tambahkan catatan untuk persetujuan ini..."
                value={signatureNote}
                onChange={(e) => setSignatureNote(e.target.value)}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-700">
                Dengan menandatangani, Anda menyetujui peminjaman alat ini sesuai dengan prosedur yang berlaku.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsSignDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Memproses..." : "Setujui & Tanda Tangan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
