import Link from "next/link";
import { FolderKanban, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-200 font-sans p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-flex">
          <FolderKanban className="w-20 h-20 text-neutral-700" />
          <span className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-sm">
            ?
          </span>
        </div>

        <div>
          <h1 className="text-6xl font-black text-white tracking-tight">404</h1>
          <p className="text-xl font-semibold text-neutral-300 mt-2">Halaman tidak ditemukan</p>
          <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
            Halaman yang Anda cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
          <Link
            href="/dashboard/projects"
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Lihat semua proyek
          </Link>
        </div>
      </div>
    </div>
  );
}
