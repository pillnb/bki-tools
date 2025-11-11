import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

export default function ToolForm() {
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      status: "available",
    },
  });

  function onSubmit(values: ToolFormValues) {
    toast.promise(
      // Ganti ini dengan fungsi untuk menyimpan ke database
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Menyimpan data alat...",
        success: "Data alat berhasil disimpan",
        error: "Gagal menyimpan data alat",
      }
    );
  }

  const statusOptions = [
    { value: "available", label: "Tersedia" },
    { value: "in_use", label: "Sedang Digunakan" },
    { value: "needs_calibration", label: "Perlu Kalibrasi" },
    { value: "damaged", label: "Rusak" },
    { value: "maintenance", label: "Pemeliharaan" },
  ];

  return (
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
                  <Input placeholder="EL-MT-001" {...field} />
                </FormControl>
                <FormDescription>
                  Format: XX-XX-000 (contoh: EL-MT-001)
                </FormDescription>
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
                  <Input placeholder="Nama alat" {...field} />
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
                  <Input placeholder="Serial number" {...field} />
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
                  <Input placeholder="Merk alat" {...field} />
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
                  <Input placeholder="Model alat" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status alat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
                  <Input placeholder="Lokasi alat" {...field} />
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
                  <Input type="date" {...field} />
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
                  <Input type="date" {...field} />
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
                <Textarea
                  placeholder="Spesifikasi teknis alat"
                  className="min-h-[100px]"
                  {...field}
                />
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
                  <Input type="url" placeholder="https://" {...field} />
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
                  <Input type="url" placeholder="https://" {...field} />
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
                <Textarea
                  placeholder="Catatan tambahan"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Form>
  );
}