import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const toolFormSchema = z.object({
  toolId: z.string()
    .min(1, "ID Alat harus diisi")
    .regex(/^[A-Z]{2}-[A-Z]{2}-\d{3}$/, "Format ID harus seperti: EL-MT-001"),
  name: z.string().min(1, "Nama alat harus diisi"),
  serialNo: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  specification: z.string().optional(),
  lastCalibrationDate: z.string().optional(),
  nextCalibrationDate: z.string().optional(),
  calibrationCertificateUrl: z.string().url().optional().or(z.literal("")),
  usageProcedureUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["available", "in_use", "needs_calibration", "damaged", "maintenance"]),
  location: z.string().optional(),
  notes: z.string().optional(),
  barcodeData: z.string().optional(),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

interface ToolFormDialogProps {
  tool?: Partial<ToolFormValues> & { id?: number };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function ToolFormDialog({
  tool,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  mode = "create",
}: ToolFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(mode === "edit");
  const [editPassword, setEditPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;
  const setOpen = controlledOnOpenChange || setIsOpen;

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      toolId: tool?.toolId || "",
      name: tool?.name || "",
      serialNo: tool?.serialNo || "",
      brand: tool?.brand || "",
      model: tool?.model || "",
      specification: tool?.specification || "",
      lastCalibrationDate: tool?.lastCalibrationDate || "",
      nextCalibrationDate: tool?.nextCalibrationDate || "",
      calibrationCertificateUrl: tool?.calibrationCertificateUrl || "",
      usageProcedureUrl: tool?.usageProcedureUrl || "",
      status: tool?.status || "available",
      location: tool?.location || "",
      notes: tool?.notes || "",
      barcodeData: tool?.barcodeData || "",
    },
  });

  const createMutation = trpc.tools.create.useMutation({
    onSuccess: () => {
      toast.success("Alat berhasil ditambahkan");
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal menambahkan alat");
    },
  });

  const updateMutation = trpc.tools.update.useMutation({
    onSuccess: () => {
      toast.success("Alat berhasil diperbarui");
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Gagal memperbarui alat");
    },
  });

  const onSubmit = (values: ToolFormValues) => {
    // Pastikan barcodeData dan notes selalu dikirim (string kosong jika tidak diisi)
    const payload = {
      ...values,
      barcodeData: values.barcodeData ?? "",
      notes: values.notes ?? "",
    };
    if (isEditMode && tool?.id) {
      const updateData = {
        id: tool.id,
        ...payload,
      };
      updateMutation.mutate(updateData, {
        onError: (error) => {
          toast.error(error.message || "Gagal memperbarui alat");
        },
      });
    } else {
      createMutation.mutate(payload, {
        onError: (error) => {
          toast.error(error.message || "Gagal menambahkan alat");
        },
      });
    }
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
            Tambah Alat Baru
          </Button>
        ) : (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
            onClick={() => {
              setOpen(true);
              if (mode === "edit") {
                setShowPasswordPrompt(true);
              }
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit Alat: ${tool?.name}` : "Tambah Alat Inspeksi Baru"}
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="toolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Alat</FormLabel>
                      <FormControl>
                        <Input placeholder="Format: XX-XX-000" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Alat</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama alat" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Serial number" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Merk</FormLabel>
                      <FormControl>
                        <Input placeholder="Merk alat" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Model alat" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode && mode === "edit"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status alat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Tersedia</SelectItem>
                          <SelectItem value="in_use">Sedang Digunakan</SelectItem>
                          <SelectItem value="needs_calibration">Perlu Kalibrasi</SelectItem>
                          <SelectItem value="damaged">Rusak</SelectItem>
                          <SelectItem value="maintenance">Pemeliharaan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokasi</FormLabel>
                      <FormControl>
                        <Input placeholder="Lokasi alat" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastCalibrationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Kalibrasi Terakhir</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextCalibrationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Kalibrasi Berikutnya</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spesifikasi</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Spesifikasi teknis alat" className="min-h-[100px]" {...field} disabled={!isEditMode && mode === "edit"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="calibrationCertificateUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Sertifikat Kalibrasi</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usageProcedureUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Prosedur Penggunaan</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://" {...field} disabled={!isEditMode && mode === "edit"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Catatan tambahan" className="min-h-[100px]" {...field} disabled={!isEditMode && mode === "edit"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcodeData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Barcode (opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Data untuk barcode (misal JSON)" {...field} disabled={!isEditMode && mode === "edit"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={!isEditMode && mode === "edit"}>
                  {mode === "create" ? "Tambah" : "Simpan"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}