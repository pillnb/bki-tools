import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Signature } from "lucide-react";

interface BorrowingFormDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BorrowingFormDialog({
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: BorrowingFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<number[]>([]);
  const [signatureMode, setSignatureMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;
  const setOpen = controlledOnOpenChange || setIsOpen;

  const { user } = useAuth();
  const toolsQuery = trpc.tools.list.useQuery();
  const createBorrowingMutation = trpc.borrowings.create.useMutation({
    onSuccess: () => {
      toast.success("Peminjaman berhasil dibuat. Menunggu persetujuan...");
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membuat peminjaman");
    },
  });

  const [formData, setFormData] = useState({
    borrowingId: `BRW-${new Date().getTime()}`,
    borrowDate: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    purpose: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      borrowingId: `BRW-${new Date().getTime()}`,
      borrowDate: new Date().toISOString().split("T")[0],
      expectedReturnDate: "",
      purpose: "",
      notes: "",
    });
    setSelectedTools([]);
    setSignatureMode(false);
  };

  const handleToolToggle = (toolId: number) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter((id) => id !== toolId));
    } else {
      if (selectedTools.length < 5) {
        setSelectedTools([...selectedTools, toolId]);
      } else {
        toast.error("Maksimal 5 alat per peminjaman");
      }
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTools.length === 0) {
      toast.error("Pilih minimal 1 alat untuk dipinjam");
      return;
    }

    if (!formData.expectedReturnDate) {
      toast.error("Tanggal pengembalian harus diisi");
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas ? canvas.toDataURL() : "";

    if (!signatureData || signatureData === "data:,") {
      toast.error("Tanda tangan harus dibuat");
      return;
    }

    createBorrowingMutation.mutate({
      borrowingId: formData.borrowingId,
      toolIds: selectedTools,
      borrowDate: new Date(formData.borrowDate),
      expectedReturnDate: new Date(formData.expectedReturnDate),
      purpose: formData.purpose || undefined,
      notes: formData.notes || undefined,
    });
  };

  const tools = toolsQuery.data || [];
  const availableTools = tools.filter((t) => t.status === "available");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Pinjam Alat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Peminjaman Alat Inspeksi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Informasi Peminjam */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="font-semibold mb-3">Informasi Peminjam</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Peminjam</Label>
                <Input value={user?.name || ""} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
              <div>
                <Label>ID Peminjaman</Label>
                <Input value={formData.borrowingId} disabled />
              </div>
              <div>
                <Label>Tanggal Peminjaman</Label>
                <Input
                  type="date"
                  value={formData.borrowDate}
                  onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Pilih Alat */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Pilih Alat (Maksimal 5)</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableTools.length > 0 ? (
                availableTools.map((tool) => (
                  <div key={tool.id} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50">
                    <Checkbox
                      id={`tool-${tool.id}`}
                      checked={selectedTools.includes(tool.id)}
                      onCheckedChange={() => handleToolToggle(tool.id)}
                      disabled={!selectedTools.includes(tool.id) && selectedTools.length >= 5}
                    />
                    <Label htmlFor={`tool-${tool.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {tool.toolId} | Serial: {tool.serialNo || "-"}
                      </div>
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Tidak ada alat yang tersedia</p>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Dipilih: {selectedTools.length}/5 alat
            </div>
          </div>

          {/* Tanggal Pengembalian */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expectedReturnDate">Tanggal Pengembalian *</Label>
              <Input
                id="expectedReturnDate"
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="purpose">Tujuan Peminjaman</Label>
              <Input
                id="purpose"
                placeholder="Contoh: Inspeksi panel listrik"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <Label htmlFor="notes">Catatan Tambahan</Label>
            <Textarea
              id="notes"
              placeholder="Catatan atau keterangan lainnya..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* E-Signature */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Signature className="w-4 h-4" />
                Tanda Tangan Peminjam
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                Hapus
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              onMouseDown={handleSignatureStart}
              onMouseMove={handleSignatureMove}
              className="border-2 border-dashed border-gray-300 rounded bg-white cursor-crosshair w-full"
              style={{ touchAction: "none" }}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tanda tangan di atas. Setelah dikirim, form ini harus disetujui oleh Pengawas Lab, Koordinator, dan SM Operasi.
            </p>
          </div>

          {/* Persetujuan */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold mb-2">Alur Persetujuan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">1</div>
                <span>Peminjam menandatangani form</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">2</div>
                <span>Pengawas Lab/Alat melakukan paraf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">3</div>
                <span>Koordinator melakukan paraf</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">4</div>
                <span>SM Operasi memberikan persetujuan final</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createBorrowingMutation.isPending}
            >
              {createBorrowingMutation.isPending ? "Mengirim..." : "Kirim untuk Persetujuan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
