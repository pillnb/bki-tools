import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Signature } from "lucide-react";

interface ApprovalFormProps {
  borrowingId: number;
  approverRole: "lab_supervisor" | "coordinator" | "sm_operasi";
  onSuccess?: () => void;
}

export function ApprovalForm({
  borrowingId,
  approverRole,
  onSuccess,
}: ApprovalFormProps) {
  const { user } = useAuth();
  const [signatureMode, setSignatureMode] = useState(false);
  const [notes, setNotes] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const borrowingQuery = trpc.borrowings.getById.useQuery({ id: borrowingId });
  const approvalsQuery = trpc.approvals.getByBorrowingId.useQuery({ borrowingId });
  const approveMutation = trpc.approvals.approve.useMutation({
    onSuccess: () => {
      toast.success("Persetujuan berhasil disimpan");
      setNotes("");
      clearSignature();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menyimpan persetujuan");
    },
  });

  const rejectMutation = trpc.approvals.reject.useMutation({
    onSuccess: () => {
      toast.success("Peminjaman ditolak");
      setNotes("");
      clearSignature();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menolak peminjaman");
    },
  });

  const borrowing = borrowingQuery.data;
  const approvals = approvalsQuery.data || [];

  const currentApproval = approvals.find((a) => a.approverRole === approverRole);
  const isAlreadyApproved = currentApproval?.status === "approved";
  const isAlreadyRejected = currentApproval?.status === "rejected";

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + 1);
    ctx.stroke();
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL() : "";

    if (!signatureData || signatureData === "data:,") {
      toast.error("Tanda tangan harus dibuat");
      return;
    }

    approveMutation.mutate({
      borrowingId,
      approverRole,
      notes: notes || undefined,
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!notes.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    rejectMutation.mutate({
      borrowingId,
      approverRole,
      notes,
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      lab_supervisor: "Pengawas Lab/Alat",
      coordinator: "Koordinator",
      sm_operasi: "SM Operasi",
    };
    return labels[role] || role;
  };

  const getApprovalStatus = (approval: any) => {
    if (approval?.status === "approved") {
      return <Badge className="bg-green-500">Disetujui</Badge>;
    } else if (approval?.status === "rejected") {
      return <Badge className="bg-red-500">Ditolak</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Menunggu</Badge>;
    }
  };

  if (borrowingQuery.isLoading || approvalsQuery.isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!borrowing) {
    return <div className="text-center py-4 text-red-500">Peminjaman tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Peminjaman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">ID Peminjaman</Label>
              <p className="font-medium">{borrowing.borrowingId}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Peminjam ID</Label>
              <p className="font-medium">{borrowing.borrowerId}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal Peminjaman</Label>
              <p className="font-medium">
                {new Date(borrowing.borrowDate).toLocaleDateString("id-ID")}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal Pengembalian</Label>
              <p className="font-medium">
                {new Date(borrowing.expectedReturnDate).toLocaleDateString("id-ID")}
              </p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Tujuan</Label>
              <p className="font-medium">{borrowing.purpose || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Persetujuan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["lab_supervisor", "coordinator", "sm_operasi"].map((role) => {
              const approval = approvals.find((a) => a.approverRole === role);
              return (
                <div key={role} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {approval?.status === "approved" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : approval?.status === "rejected" ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium">{getRoleLabel(role)}</span>
                  </div>
                  {getApprovalStatus(approval)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!isAlreadyApproved && !isAlreadyRejected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signature className="w-5 h-5" />
              Form Persetujuan - {getRoleLabel(approverRole)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <Label className="mb-2 block">Tanda Tangan *</Label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={120}
                  onMouseDown={handleSignatureStart}
                  onMouseMove={handleSignatureMove}
                  className="border-2 border-dashed border-gray-300 rounded bg-white cursor-crosshair w-full"
                  style={{ touchAction: "none" }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="mt-2"
                >
                  Hapus Tanda Tangan
                </Button>
              </div>

              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan atau keterangan persetujuan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "Menolak..." : "Tolak Peminjaman"}
                </Button>
                <Button
                  type="submit"
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "Menyetujui..." : "Setujui Peminjaman"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(isAlreadyApproved || isAlreadyRejected) && (
        <Card className={isAlreadyApproved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {isAlreadyApproved ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-900">Sudah Disetujui</p>
                    <p className="text-sm text-green-700">
                      Disetujui pada {new Date(currentApproval?.signedAt || "").toLocaleString("id-ID")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-900">Ditolak</p>
                    <p className="text-sm text-red-700">
                      Alasan: {currentApproval?.notes || "Tidak ada alasan"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
