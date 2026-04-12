import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import logo from "@/assets/logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background sm:rounded-l-[2rem] sm:border-l sm:border-y sm:my-2 sm:mr-2 shadow-2xl relative overflow-hidden transition-all duration-300">
          <header className="sticky top-0 z-30 h-16 flex items-center border-b border-border/40 bg-background/40 backdrop-blur-xl px-6">
            <SidebarTrigger className="mr-4 -ml-2 rounded-full hover:bg-primary/10 transition-colors" />
            <img src={logo} alt="Beetee Autos logo" className="h-8 w-8 rounded-full object-cover mr-3 shadow-sm border border-border/50" />
            <span className="text-lg font-heading font-semibold tracking-tight text-foreground truncate">
              Beetee Autos
            </span>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto animate-fade-up">
            <div className="mx-auto max-w-7xl h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
