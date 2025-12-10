import { Sidebar } from '@/components/admin/sidebar';
import { MobileSidebar } from '@/components/admin/mobile-sidebar';
import { CommandMenu } from '@/components/admin/command-menu';
import { KeyboardShortcuts } from '@/components/admin/keyboard-shortcuts';
import { Toaster } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen admin-layout">
      <div className="w-64 flex-none hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 p-8">
        <MobileSidebar />
        {children}
      </div>
      <CommandMenu />
      <KeyboardShortcuts />
      <Toaster position="top-right" richColors />
    </div>
  );
}
