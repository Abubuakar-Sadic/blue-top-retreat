import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import ProtectedAdmin from "./components/admin/ProtectedAdmin.tsx";
import RequireCap from "./components/admin/RequireRole.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Overview from "./pages/admin/Overview.tsx";
import Rooms from "./pages/admin/Rooms.tsx";
import Gallery from "./pages/admin/Gallery.tsx";
import Bookings from "./pages/admin/Bookings.tsx";
import Payments from "./pages/admin/Payments.tsx";
import Messages from "./pages/admin/Messages.tsx";
import Events from "./pages/admin/Events.tsx";
import EventReservations from "./pages/admin/EventReservations.tsx";
import VenueReservations from "./pages/admin/VenueReservations.tsx";
import Staff from "./pages/admin/Staff.tsx";
import AuditLog from "./pages/admin/AuditLog.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Overview />} />
                <Route element={<RequireCap cap="manage_bookings" />}>
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="event-reservations" element={<EventReservations />} />
                  <Route path="venue-reservations" element={<VenueReservations />} />
                </Route>
                <Route element={<RequireCap cap="manage_rooms" />}>
                  <Route path="rooms" element={<Rooms />} />
                  <Route path="gallery" element={<Gallery />} />
                </Route>
                <Route element={<RequireCap cap="manage_events" />}>
                  <Route path="events" element={<Events />} />
                </Route>
                <Route element={<RequireCap cap="manage_payments" />}>
                  <Route path="payments" element={<Payments />} />
                </Route>
                <Route element={<RequireCap cap="manage_staff" />}>
                  <Route path="staff" element={<Staff />} />
                  <Route path="audit-log" element={<AuditLog />} />
                </Route>
              </Route>
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
