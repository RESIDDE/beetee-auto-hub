import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import VehiclesList from "./pages/VehiclesList";
import VehicleForm from "./pages/VehicleForm";
import VehicleDetail from "./pages/VehicleDetail";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Invoices from "./pages/Invoices";
import Inquiries from "./pages/Inquiries";
import Inspections from "./pages/Inspections";
import RepairsMaintenance from "./pages/RepairsMaintenance";
import SignRepair from "./pages/SignRepair";
import SignCustomer from "./pages/SignCustomer";
import SignInspection from "./pages/SignInspection";
import NotFound from "./pages/NotFound";

import CustomerPortal from "./pages/CustomerPortal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (data is considered fresh and loads instantly)
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
      refetchOnWindowFocus: false, // Don't refetch just because user swapped tabs
      retry: 1, // Only retry once on failure to prevent long hanging loads
    },
  },
});

function AppRoutes() {
  return (
    <Routes>

      <Route path="/portal" element={<CustomerPortal />} />
      <Route path="/sign/repair/:id" element={<SignRepair />} />
      <Route path="/sign/customer/:id" element={<SignCustomer />} />
      <Route path="/sign/inspection/:id" element={<SignInspection />} />
      <Route path="/*" element={
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/vehicles" element={<VehiclesList />} />
            <Route path="/vehicles/new" element={<VehicleForm />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/vehicles/:id/edit" element={<VehicleForm />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/inquiries" element={<Inquiries />} />
            <Route path="/inspections" element={<Inspections />} />
            <Route path="/repairs" element={<RepairsMaintenance />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      } />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
