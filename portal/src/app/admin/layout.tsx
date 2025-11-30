import { Sidebar } from '@/components/admin/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="w-64 flex-none hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 p-8 bg-slate-50">{children}</div>
    </div>
  );
}
