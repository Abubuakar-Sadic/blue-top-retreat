import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, BedDouble, CalendarCheck, CreditCard, MessageSquare, LogOut, Crown, Sparkles, Ticket, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/rooms", label: "Rooms", icon: BedDouble },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/events", label: "Events", icon: Sparkles },
  { to: "/admin/event-reservations", label: "Event Attendance", icon: Ticket },
  { to: "/admin/venue-reservations", label: "Venue Bookings", icon: PartyPopper },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
];

const AdminSidebar = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/auth", { replace: true });
  };
  const closeMobile = () => { if (isMobile) setOpenMobile(false); };
  return (
    <Sidebar collapsible="icon" className="border-r border-[hsl(var(--gold))]/15">
      <SidebarHeader className="border-b border-border/50 py-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-[hsl(var(--navy-dark))]" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs tracking-[0.2em] uppercase text-gold font-medium">Blue Top</p>
            <p className="font-display text-sm font-semibold">Villa Admin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild tooltip={it.label}>
                    <NavLink to={it.to} end={it.end} onClick={closeMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-2 ${isActive ? "!bg-[hsl(var(--gold))]/15 !text-[hsl(var(--gold-dark))] font-medium" : ""}`}>
                      <it.icon className="w-4 h-4" />
                      <span>{it.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50">
        <div className="px-2 py-1 text-xs text-muted-foreground truncate group-data-[collapsible=icon]:hidden">
          {user?.email}
        </div>
        <SidebarMenuButton onClick={handleLogout} tooltip="Sign out" className="text-destructive hover:!bg-destructive/10">
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
};

const AdminLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-muted/30">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger />
          <div className="flex-1" />
          <span className="text-xs tracking-[0.2em] uppercase text-gold font-medium hidden sm:inline">Management Dashboard</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default AdminLayout;