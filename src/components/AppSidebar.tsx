import { LayoutDashboard, Car, Users, MessageSquare, ClipboardCheck, Wrench, FileText, Settings, LogOut } from "lucide-react";
import { NairaIcon } from "@/components/NairaIcon";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Vehicles", url: "/vehicles", icon: Car },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Sales", url: "/sales", icon: (props) => <NairaIcon {...props} /> },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Inquiries", url: "/inquiries", icon: MessageSquare },
  { title: "Inspections", url: "/inspections", icon: ClipboardCheck },
  { title: "Repairs", url: "/repairs", icon: Wrench },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navItems = items;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Beetee Autos logo" className="h-8 w-8 rounded-full object-cover" />
          {!collapsed && (
            <h1 className="text-lg font-bold text-sidebar-primary">
              Beetee Autos
            </h1>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <div className="py-1">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground w-full"
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                    >
                      {(() => { const Icon = item.icon; return <Icon className="h-5 w-5" />; })()}
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
