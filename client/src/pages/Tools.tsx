import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";;
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Eye, Edit, Trash2, QrCode, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ToolFormDialog } from "@/components/ToolFormDialog";
import * as XLSX from "xlsx";
import { QRCodeSVG } from "qrcode.react";

export default function Tools() {
  const { user } = useAuth();
  const toolsQuery = trpc.tools.list.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);

  const tools = toolsQuery.data || [];
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.toolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.serialNo && tool.serialNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-100 text-green-800",
      in_use: "bg-blue-100 text-blue-800",
      needs_calibration: "bg-yellow-100 text-yellow-800",
      damaged: "bg-red-100 text-red-800",
      maintenance: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: "Tersedia",
      in_use: "Sedang Digunakan",
      needs_calibration: "Perlu Kalibrasi",
      damaged: "Rusak",
      maintenance: "Pemeliharaan",
    };
    return labels[status] || status;
  };

  const isCalibrationExpired = (nextCalibrationDate: Date | null) => {
    if (!nextCalibrationDate) return false;
    return new Date(nextCalibrationDate) < new Date();
  };

  const canEdit = ["admin", "lab_supervisor"].includes(user?.role || "");

  const downloadBarcode = (tool: any) => {
    try {
      const qrCodeElement = document.getElementById(`qrcode-${tool.id}`);
      if (qrCodeElement) {
        const canvas = qrCodeElement.querySelector("canvas");
        if (canvas) {
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `Barcode_${tool.toolId}.png`;
          link.click();
          toast.success("Barcode berhasil didownload");
        }
      }
    } catch (error) {
      console.error("Download barcode error:", error);
      toast.error("Gagal mendownload barcode");
    }
  };

  const exportToExcel = () => {
    if (filteredTools.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = filteredTools.map((tool) => ({
        "ID Alat": tool.toolId,
        "Nama Alat": tool.name,
        "Serial No.": tool.serialNo || "-",
        "Merk": tool.brand || "-",
        "Model": tool.model || "-",
        "Status": getStatusLabel(tool.status || "available"),
        "Lokasi": tool.location || "-",
        "Spesifikasi": tool.specification || "-",
        "Kalibrasi Terakhir": tool.lastCalibrationDate
          ? new Date(tool.lastCalibrationDate).toLocaleDateString("id-ID")
          : "-",
        "Kalibrasi Berikutnya": tool.nextCalibrationDate
          ? new Date(tool.nextCalibrationDate).toLocaleDateString("id-ID")
          : "-",
        "URL Sertifikat": tool.calibrationCertificateUrl || "-",
        "URL Prosedur": tool.usageProcedureUrl || "-",
        "Catatan": tool.notes || "-",
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Alat Inspeksi");

      // Auto-size columns
      const colWidths = [
        { wch: 12 }, // ID Alat
        { wch: 20 }, // Nama Alat
        { wch: 15 }, // Serial No.
        { wch: 12 }, // Merk
        { wch: 12 }, // Model
        { wch: 15 }, // Status
        { wch: 15 }, // Lokasi
        { wch: 25 }, // Spesifikasi
        { wch: 18 }, // Kalibrasi Terakhir
        { wch: 18 }, // Kalibrasi Berikutnya
        { wch: 20 }, // URL Sertifikat
        { wch: 20 }, // URL Prosedur
        { wch: 20 }, // Catatan
      ];
      ws["!cols"] = colWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toLocaleDateString("id-ID").replace(/\//g, "-");
      const filename = `Alat_Inspeksi_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      toast.success(`Data berhasil diexport ke ${filename}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengexport data");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Alat Inspeksi</h1>
          <p className="text-muted-foreground mt-2">
            Kelola data alat inspeksi, kalibrasi, dan status penggunaan
          </p>
        </div>
        {canEdit && (
          <ToolFormDialog mode="create" onSuccess={toolsQuery.refetch} />
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Cari berdasarkan nama, ID, atau serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={exportToExcel}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Alat ({filteredTools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {toolsQuery.isLoading ? (
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
                    <TableHead>ID Alat</TableHead>
                    <TableHead>Nama Alat</TableHead>
                    <TableHead>Serial No.</TableHead>
                    <TableHead>Merk/Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kalibrasi</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool) => (
                      <TableRow key={tool.id}>
                        <TableCell className="font-medium">{tool.toolId}</TableCell>
                        <TableCell>{tool.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tool.serialNo || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tool.brand && tool.model ? `${tool.brand} ${tool.model}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tool.status || "available")}>
                            {getStatusLabel(tool.status || "available")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">
                              {tool.nextCalibrationDate
                                ? new Date(tool.nextCalibrationDate).toLocaleDateString("id-ID")
                                : "-"}
                            </span>
                            {isCalibrationExpired(tool.nextCalibrationDate) && (
                              <Badge variant="destructive" className="w-fit text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tool.location || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={isDetailOpen && selectedTool?.id === tool.id} onOpenChange={setIsDetailOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedTool(tool)}
                                  title="Lihat Detail"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detail Alat: {tool.name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">ID Alat</label>
                                      <p className="text-sm text-muted-foreground">{tool.toolId}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Serial No.</label>
                                      <p className="text-sm text-muted-foreground">{tool.serialNo || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Merk</label>
                                      <p className="text-sm text-muted-foreground">{tool.brand || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Model</label>
                                      <p className="text-sm text-muted-foreground">{tool.model || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <Badge className={getStatusColor(tool.status || "available")}>
                                        {getStatusLabel(tool.status || "available")}
                                      </Badge>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Lokasi</label>
                                      <p className="text-sm text-muted-foreground">{tool.location ? tool.location : "-"}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-sm font-medium">Spesifikasi</label>
                                      <p className="text-sm text-muted-foreground">{tool.specification || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Kalibrasi Terakhir</label>
                                      <p className="text-sm text-muted-foreground">
                                        {tool.lastCalibrationDate
                                          ? new Date(tool.lastCalibrationDate).toLocaleDateString("id-ID")
                                          : "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Kalibrasi Berikutnya</label>
                                      <p className="text-sm text-muted-foreground">
                                        {tool.nextCalibrationDate
                                          ? new Date(tool.nextCalibrationDate).toLocaleDateString("id-ID")
                                          : "-"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  {tool.calibrationCertificateUrl && tool.calibrationCertificateUrl !== null && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => window.open(tool.calibrationCertificateUrl as string, '_blank')}
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Sertifikat Kalibrasi
                                    </Button>
                                  )}
                                  {tool.usageProcedureUrl && tool.usageProcedureUrl !== null && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => window.open(tool.usageProcedureUrl as string, '_blank')}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Prosedur Penggunaan
                                    </Button>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            {canEdit && (
                              <>
                                <ToolFormDialog
                                  mode="edit"
                                  tool={{
                                    id: tool.id,
                                    toolId: tool.toolId,
                                    name: tool.name,
                                    serialNo: tool.serialNo ?? "",
                                    brand: tool.brand ?? "",
                                    model: tool.model ?? "",
                                    specification: tool.specification ?? "",
                                    lastCalibrationDate: tool.lastCalibrationDate
                                      ? new Date(tool.lastCalibrationDate).toISOString().slice(0, 10)
                                      : "",
                                    nextCalibrationDate: tool.nextCalibrationDate
                                      ? new Date(tool.nextCalibrationDate).toISOString().slice(0, 10)
                                      : "",
                                    calibrationCertificateUrl: tool.calibrationCertificateUrl ?? "",
                                    usageProcedureUrl: tool.usageProcedureUrl ?? "",
                                    status: (tool.status as any) ?? "available",
                                    location: tool.location ?? "",
                                    notes: tool.notes ?? "",
                                    barcodeData: tool.barcodeData ?? "",
                                  }}
                                  onSuccess={toolsQuery.refetch}
                                />
                                <Button variant="ghost" size="sm" title="Hapus">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Dialog open={isBarcodeOpen && selectedTool?.id === tool.id} onOpenChange={setIsBarcodeOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Barcode"
                                  onClick={() => setSelectedTool(tool)}
                                >
                                  <QrCode className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-sm">
                                <DialogHeader>
                                  <DialogTitle>QR Code Barcode</DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center gap-4 py-4">
                                  <div id={`qrcode-${tool.id}`}>
                                    <QRCodeSVG
                                      value={`Tool|ID:${tool.toolId}|Name:${tool.name}|SN:${tool.serialNo || "N/A"}`}
                                      size={256}
                                      level="H"
                                      includeMargin={true}
                                    />
                                  </div>
                                  <div className="text-center">
                                    <p className="font-medium">{tool.toolId}</p>
                                    <p className="text-sm text-muted-foreground">{tool.name}</p>
                                  </div>
                                  <Button onClick={() => downloadBarcode(tool)} className="w-full">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Barcode
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada alat yang ditemukan
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
