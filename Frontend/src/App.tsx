import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import AssistantPage from "./pages/AssistantPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import AdminLoginPage from "./pages/AdminLoginPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import MyRequestsPage from "./pages/MyRequestsPage.tsx";
import { DisasterModeProvider } from "@/context/DisasterModeContext";
import { HelperModeProvider } from "@/context/HelperModeContext";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

// Simple Admin Protection
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAdmin = localStorage.getItem('admin_session') === 'true';
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DisasterModeProvider>
      <HelperModeProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </HelperModeProvider>
    </DisasterModeProvider>
  </QueryClientProvider>
);

export default App;
