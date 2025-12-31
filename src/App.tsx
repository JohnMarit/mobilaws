import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import { CounselNameProvider } from "@/contexts/CounselNameContext";
import { CountryProvider } from "@/contexts/CountryContext";
import { AuthProvider } from "@/contexts/FirebaseAuthContext";
import { PromptLimitProvider } from "@/contexts/PromptLimitContext";
import { LearningProvider } from "@/contexts/LearningContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { TutorAdminProvider } from "@/contexts/TutorAdminContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminVerify from "./pages/AdminVerify";
import AdminDashboard from "./pages/AdminDashboard";
import TutorAdminPortal from "./pages/TutorAdminPortal";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AdminProvider>
            <TutorAdminProvider>
            <LearningProvider>
              <PromptLimitProvider>
                <CounselNameProvider>
                  <CountryProvider>
                    <ChatProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route path="/admin/verify" element={<AdminVerify />} />
                          <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/tutor-admin" element={<TutorAdminPortal />} />
                          <Route path="/payment/success" element={<PaymentSuccess />} />
                          <Route path="/payment/cancel" element={<PaymentCancel />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </ChatProvider>
                  </CountryProvider>
                </CounselNameProvider>
              </PromptLimitProvider>
            </LearningProvider>
            </TutorAdminProvider>
          </AdminProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
