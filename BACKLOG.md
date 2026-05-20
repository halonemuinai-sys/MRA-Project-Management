# MRA Project Management — Feature Backlog

> Daftar fitur yang belum diimplementasikan, diurutkan berdasarkan impact.  
> Status: `[ ]` Belum · `[x]` Selesai · `[~]` Sedang dikerjakan

---

## 🔴 High Priority — Core Functionality

| # | Fitur | Deskripsi | Status |
|---|-------|-----------|--------|
| 1 | **Filter & Sort Tasks di Kanban** | Filter by priority, assignee, due date. Sort by deadline/created. | `[x]` |
| 2 | **Filter & Sort Projects** | Filter by status (Aktif/Selesai/Arsip), sort by deadline/nama/tanggal. | `[x]` |
| 3 | **Subtask / Checklist** | Task bisa dipecah jadi item-item kecil dengan checkbox progress. | `[x]` |
| 4 | **Task Labels / Tags** | Label custom per task (contoh: "bug", "feature", "design") dengan warna. | `[x]` |
| 5 | **Edit Komentar** | Komentar hanya bisa dihapus, tidak bisa diedit setelah dikirim. | `[x]` |
| 6 | **Forgot Password** | Halaman `/forgot-password` dan alur reset password via email. | `[x]` |
| 7 | **Kalender View** | Tampilan task berdasarkan tanggal/deadline dalam format kalender bulanan. | `[x]` |

---

## 🟡 Medium Priority — UX & Collaboration

| # | Fitur | Deskripsi | Status |
|---|-------|-----------|--------|
| 8 | **List View Task** | Tampilan tabel/list alternatif selain Kanban, dengan kolom sortable. | `[x]` |
| 9 | **Markdown di Deskripsi** | Render bold/italic/heading/code di deskripsi task dan project. | `[x]` |
| 10 | **@Mention di Komentar** | Tag anggota dengan `@nama` dalam komentar, trigger notifikasi. | `[x]` |
| 11 | **Attachment / Upload File** | Lampirkan file atau gambar ke task (S3/Cloudinary/Vercel Blob). | `[x]` |
| 12 | **Activity Log per Task** | Riwayat perubahan ("X mengubah status dari TODO → DONE pada 10 Jan 14:30"). | `[x]` |
| 13 | **Bulk Action Task** | Pilih beberapa task sekaligus untuk pindah status, assign, atau delete. | `[x]` |
| 14 | **Pinned / Starred Project** | Tandai proyek favorit, tampil di bagian atas daftar. | `[x]` |
| 15 | **Breadcrumb Navigation** | Navigasi hierarki: Dashboard → Projects → [Nama Proyek]. | `[x]` |

---

## 🟠 Enhancement — Quality of Life

| # | Fitur | Deskripsi | Status |
|---|-------|-----------|--------|
| 16 | **Pagination / Infinite Scroll** | Pembatas halaman jika task/project sudah sangat banyak. | `[ ]` |
| 17 | **Export Data (CSV/PDF)** | Export daftar task atau laporan proyek ke file. | `[ ]` |
| 18 | **Avatar Upload** | Upload foto profil (saat ini hanya inisial huruf). | `[ ]` |
| 19 | **Email Notification** | Kirim email saat task diassign, deadline dekat, atau komentar baru. | `[ ]` |
| 20 | **Real-time Collaboration** | Perubahan dari user lain langsung muncul tanpa refresh (WebSocket/SSE). | `[ ]` |
| 21 | **Keyboard Shortcuts** | Shortcut: `N` buat task baru, `Esc` tutup modal, `?` tampilkan daftar shortcut. | `[ ]` |
| 22 | **Error Pages (404/500)** | Halaman error custom sesuai branding MRA, bukan default Next.js. | `[x]` |
| 23 | **Sort Task dalam Kolom** | Task di dalam kolom Kanban bisa diurutkan by priority atau due date. | `[x]` |

---

## 🔵 Low Priority — Advanced Features

| # | Fitur | Deskripsi | Status |
|---|-------|-----------|--------|
| 24 | **Task Dependencies** | Relasi antar task: "blocked by" / "depends on". | `[ ]` |
| 25 | **Time Tracking** | Catat waktu pengerjaan per task dengan start/stop timer. | `[ ]` |
| 26 | **Gantt Chart** | Visualisasi timeline proyek dan task dalam format Gantt. | `[ ]` |
| 27 | **Project Template** | Buat proyek baru dari template yang sudah ada. | `[ ]` |
| 28 | **2FA (Two-Factor Auth)** | Keamanan login tambahan via OTP/authenticator app. | `[ ]` |
| 29 | **Email Verification** | Verifikasi email saat registrasi sebelum bisa masuk. | `[ ]` |
| 30 | **Admin Panel** | Halaman khusus admin: manage semua user, lihat semua proyek, audit log sistem. | `[ ]` |

---

## ✅ Sudah Selesai — Sprint 1

| Fitur | Keterangan |
|-------|------------|
| Auth (Login / Register / Proxy) | NextAuth credentials, route protection |
| Dashboard real-time | Stats, recent projects, priority breakdown, progress bar |
| Projects CRUD | List, create, edit, delete + status badge |
| Kanban Board + Drag & Drop | 4 kolom, native HTML5 DnD, visual feedback |
| Tasks CRUD | Create, edit, delete, status change, comments |
| Task Detail Modal | Komentar dengan notifikasi ke assignee |
| Project Members | Add by email, remove, role badge (Owner/Admin/Member/Viewer) |
| Deadline Reminder | Banner otomatis: proyek terlambat, ≤7 hari, task overdue |
| Search Global | Topbar debounced search, dropdown hasil project + task |
| Notifikasi Bell | In-app notification, unread badge, auto-refresh 30 detik |
| Toast Notification | Success / error / info / warning di pojok kanan bawah |
| Team Page | Grid semua user + stats proyek/tugas |
| Analytics Page | Pie + bar chart, 10 task terbaru |
| Settings Page | Edit profil, ganti password, toggle tema |
| Mobile Sidebar | Hamburger + drawer overlay + backdrop |
| Dark Mode | Light / Dark / System via next-themes |
| Modular Components | Komponen dipisah per file, `page.tsx` hanya orchestrator |

---

## 📌 Catatan Teknis

- **Database:** PostgreSQL + Prisma 7 (adapter pg)
- **Auth:** NextAuth v4 (credentials)
- **Framework:** Next.js 16 App Router
- **Deploy target:** Vercel
- **Komponen UI:** Tailwind CSS 4 + Framer Motion + Recharts + Lucide

---

*Last updated: 2026-05-19*
