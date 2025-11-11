# BKI Komersil Balikpapan Tools Managing - TODO

## Database & Backend
- [x] Desain dan implementasi skema database lengkap
- [x] Implementasi query helpers untuk semua fitur
- [x] Implementasi tRPC procedures untuk manajemen alat
- [x] Implementasi tRPC procedures untuk manajemen stok barang
- [x] Implementasi tRPC procedures untuk peminjaman alat
- [x] Implementasi tRPC procedures untuk approval workflow (e-signature)
- [x] Implementasi tRPC procedures untuk analytics/reporting

## Dashboard & Navigation
- [x] Desain layout dashboard dengan DashboardLayout
- [x] Implementasi sidebar navigation dengan menu utama
- [x] Implementasi user authentication dan role-based access control
- [x] Implementasi dashboard home dengan overview widgets

## Fitur: List Alat
- [x] Implementasi tabel status alat dengan filter dan sort
- [x] Implementasi tabel spesifikasi alat dan kalibrasi
- [x] Implementasi tabel rekaman peminjaman alat
- [ ] Implementasi barcode generation (Tag No., Nama Alat, Expired Certificate)
- [ ] Implementasi barcode untuk link prosedur penggunaan dan sertifikat kalibrasi
- [ ] Implementasi fitur print barcode

## Fitur: List Stock Barang
- [x] Implementasi tabel status stock barang
- [x] Implementasi tabel rekaman pemakaian barang
- [x] Implementasi sistem alarm/alert untuk stock minimal
- [ ] Implementasi notifikasi untuk pembelian barang

## Fitur: Form Input Alat
- [x] Implementasi form untuk input data alat baru
- [x] Implementasi form untuk edit data alat
- [x] Implementasi password protection untuk edit (hanya personel tertentu)
- [x] Implementasi validasi form dan error handling

## Fitur: Form Input Barang
- [x] Implementasi form untuk input data barang baru
- [x] Implementasi form untuk edit data barang
- [x] Implementasi password protection untuk edit (hanya personel tertentu)
- [x] Implementasi validasi form dan error handling

## Fitur: Form Peminjaman Alat
- [x] Implementasi form peminjaman alat
- [x] Implementasi validasi maksimal 5 alat per trip
- [x] Implementasi e-signature untuk peminjam
- [ ] Implementasi e-signature untuk pengawas lab/alat
- [ ] Implementasi e-signature untuk koordinator (paraf)
- [ ] Implementasi e-signature untuk SM Operasi
- [ ] Implementasi alur persetujuan bertingkat
- [ ] Implementasi fitur print form setelah ditandatangani semua pihak
- [ ] Implementasi validasi form hanya bisa digunakan setelah semua tanda tangan ada

## Fitur: Form Pemakaian Barang
- [ ] Implementasi form untuk merekam pemakaian barang
- [ ] Implementasi update stock otomatis saat pemakaian
- [ ] Implementasi validasi stock tersedia

## Analytics & Reporting
- [ ] Implementasi dashboard analytics alat paling sering digunakan
- [ ] Implementasi dashboard analytics barang paling sering diminta
- [ ] Implementasi chart/grafik untuk visualisasi data
- [ ] Implementasi laporan penggunaan alat
- [ ] Implementasi laporan pemakaian barang

## UI/UX & Design
- [ ] Implementasi design system dan color palette
- [ ] Implementasi responsive design untuk mobile/tablet
- [ ] Implementasi loading states dan error handling
- [ ] Implementasi empty states untuk semua tabel/list
- [ ] Implementasi toast notifications untuk user feedback

## Testing & Deployment
- [ ] Testing semua fitur backend
- [ ] Testing semua fitur frontend
- [ ] Testing alur peminjaman end-to-end
- [ ] Testing barcode generation dan printing
- [ ] Testing role-based access control
- [ ] Optimization dan performance tuning
- [ ] Security review dan penetration testing
- [ ] Final checkpoint dan deployment
