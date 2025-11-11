import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";

interface StockFormDialogProps {
  item?: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function StockFormDialog({
  item,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  mode = "create",
}: StockFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(mode === "edit");
  const [editPassword, setEditPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;
  const setOpen = controlledOnOpenChange || setIsOpen;

  const [formData, setFormData] = useState({
    itemId: item?.itemId || "",
    name: item?.name || "",
    description: item?.description || "",
    unit: item?.unit || "",
    quantity: item?.quantity || 0,
    minThreshold: item?.minThreshold || 5,
    maxThreshold: item?.maxThreshold || 100,
    unitPrice: item?.unitPrice || "",
    supplier: item?.supplier || "",
    location: item?.location || "",
  });

  const createMutation = trpc.stock.create.useMutation({
    onSuccess: () => {
      toast.success("Barang berhasil ditambahkan");
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan barang");
    },
  });

  const updateMutation = trpc.stock.update.useMutation({
    onSuccess: () => {
      toast.success("Barang berhasil diperbarui");
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui barang");
    },
  });

  const resetForm = () => {
    setFormData({
      itemId: "",
      name: "",
      description: "",
      unit: "",
      quantity: 0,
      minThreshold: 5,
      maxThreshold: 100,
      unitPrice: "",
      supplier: "",
      location: "",
    });
    setEditPassword("");
    setShowPasswordPrompt(false);
    setIsEditMode(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemId || !formData.name) {
      toast.error("ID Barang dan Nama Barang harus diisi");
      return;
    }

    if (isEditMode && item) {
      const updateData = {
        id: item.id,
        name: formData.name || undefined,
        description: formData.description || undefined,
        unit: formData.unit || undefined,
        quantity: parseInt(formData.quantity.toString()) || undefined,
        minThreshold: parseInt(formData.minThreshold.toString()) || undefined,
        maxThreshold: parseInt(formData.maxThreshold.toString()) || undefined,
        unitPrice: formData.unitPrice || undefined,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
      };
      updateMutation.mutate(updateData);
    } else {
      const createData = {
        itemId: formData.itemId,
        name: formData.name,
        description: formData.description || undefined,
        unit: formData.unit || undefined,
        quantity: parseInt(formData.quantity.toString()) || 0,
        minThreshold: parseInt(formData.minThreshold.toString()) || 5,
        maxThreshold: parseInt(formData.maxThreshold.toString()) || 100,
        unitPrice: formData.unitPrice || undefined,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
      };
      createMutation.mutate(createData);
    }
  };

  const handleEditClick = () => {
    setShowPasswordPrompt(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = "admin123";
    if (editPassword === correctPassword) {
      setIsEditMode(true);
      setShowPasswordPrompt(false);
      setEditPassword("");
      toast.success("Mode edit diaktifkan");
    } else {
      toast.error("Password salah");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Barang Baru
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleEditClick}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Barang: ${item?.name}` : "Tambah Barang Stok Baru"}
          </DialogTitle>
        </DialogHeader>

        {showPasswordPrompt && mode === "edit" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="password">Masukkan Password untuk Edit</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password..."
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowPasswordPrompt(false)}>
                Batal
              </Button>
              <Button type="submit">Verifikasi</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemId">ID Barang *</Label>
                <Input
                  id="itemId"
                  placeholder="Contoh: BRG-001"
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  disabled={isEditMode}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Nama Barang *</Label>
                <Input
                  id="name"
                  placeholder="Contoh: Kabel Tembaga 2.5mm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="Contoh: meter, pcs, box"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Stok Saat Ini</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="minThreshold">Batas Minimum</Label>
                <Input
                  id="minThreshold"
                  type="number"
                  value={formData.minThreshold}
                  onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <Label htmlFor="maxThreshold">Batas Maksimum</Label>
                <Input
                  id="maxThreshold"
                  type="number"
                  value={formData.maxThreshold}
                  onChange={(e) => setFormData({ ...formData, maxThreshold: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Harga Satuan (Rp)</Label>
                <Input
                  id="unitPrice"
                  placeholder="Contoh: 50000"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="Nama supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="location">Lokasi Penyimpanan</Label>
                <Input
                  id="location"
                  placeholder="Lokasi penyimpanan barang"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Detail deskripsi barang..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : isEditMode ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
