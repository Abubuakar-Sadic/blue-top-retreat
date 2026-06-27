import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, BedDouble, CalendarCheck, CreditCard, MessageSquare, LogOut, Crown, Sparkles, Ticket, PartyPopper, Users, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, type Capability, type StaffRole } from "@/lib/permissions";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

// `cap: null` means visible to every staff member.
const items: { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; cap: Capability | null }[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true, cap: null },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarCheck, cap: "manage_bookings" },
  { to: "/admin/event-reservations", label: "Event Attendance", icon: Ticket, cap: "manage_bookings" },
  { to: "/admin/venue-reservations", label: "Venue Bookings", icon: PartyPopper, cap: "manage_bookings" },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare, cap: "manage_bookings" },
  { to: "/admin/rooms", label: "Rooms", icon: BedDouble, cap: "manage_rooms" },
  { to: "/admin/events", label: "Events", icon: Sparkles, cap: "manage_events" },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, cap: "manage_payments" },
  { to: "/admin/staff", label: "Staff & Roles", icon: Users, cap: "manage_staff" },
  { to: "/admin/audit-log", label: "Audit Log", icon: History, cap: "manage_staff" },
];

const AdminSidebar = () => {
  const { signOut, user, role, can } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/auth", { replace: true });
  };
  const closeMobile = () => { if (isMobile) setOpenMobile(false); };
  const visibleItems = items.filter((it) => (it.cap ? can(it.cap) : true));
  const roleLabel = role ? ROLE_LABELS[role as StaffRole] : null;
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
              {visibleItems.map((it) => (
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
        <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          {roleLabel && <div className="text-[11px] uppercase tracking-wider text-gold font-medium capitalize mt-0.5">{roleLabel}</div>}
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