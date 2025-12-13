import { StudentSidebar } from '@/components/student/sidebar';
import { StudentMobileSidebar } from '@/components/student/mobile-sidebar';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="w-64 flex-none hidden md:block">
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <StudentMobileSidebar />
        <main className="flex-1 p-4 md:p-4 overflow-auto">{children}</main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
