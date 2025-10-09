import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/contexts/ChatContext";
import { CounselNameProvider } from "@/contexts/CounselNameContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PromptLimitProvider } from "@/contexts/PromptLimitContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <PromptLimitProvider>
            <CounselNameProvider>
              <ChatProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </ChatProvider>
            </CounselNameProvider>
          </PromptLimitProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
