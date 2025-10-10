import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import { CounselNameProvider } from "@/contexts/CounselNameContext";
import { AuthProvider } from "@/contexts/FirebaseAuthContext";
import { PromptLimitProvider } from "@/contexts/PromptLimitContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminVerify from "./pages/AdminVerify";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AdminProvider>
            <PromptLimitProvider>
              <CounselNameProvider>
                <ChatProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/verify" element={<AdminVerify />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </ChatProvider>
              </CounselNameProvider>
            </PromptLimitProvider>
          </AdminProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
