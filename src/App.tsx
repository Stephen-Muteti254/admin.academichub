import * as Lazy from "@/lazy";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import AdminClients from "./pages/AdminClients";
import AdminWriters from "./pages/AdminWriters";
import AdminPayments from "./pages/AdminPayments";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSupport from "./pages/AdminSupport";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminApplications from "./pages/AdminApplications";
import AdminApplicationDetail from "./pages/AdminApplicationDetail";

import { RequireAuth } from '@/components/RequireAuth';
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SupportChatProvider } from "@/contexts/SupportChatContext";

import { ProfileModalProvider } from "@/contexts/ProfileModalContext";
import RoleGuard from "@/components/guards/RoleGuard";


import { Suspense } from "react";
import PageLoader from "@/components/PageLoader";
import { HelmetProvider } from "react-helmet-async";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <ProfileProvider>
            <NotificationProvider>
              <ChatProvider>
              <SupportChatProvider>
                <ProfileModalProvider>
                  <Suspense fallback={<PageLoader />}>
                  <Routes>

                    {/* ================= ADMIN ================= */}
                    <Route element={<RequireAuth requiredRole={["admin", "super_admin"]} />}>
                        <Route path="/" element={<Lazy.AdminLayout />}>
                          <Route index element={<Navigate to="clients" replace />} />
                          {/*<Route path="clients" element={<AdminClients />} />*/}
                          <Route path="writers" element={<AdminWriters />} />
                          {/*<Route path="applications" element={<AdminApplications />} />*/}
                          {/*<Route
                            path="applications/:id"
                            element={<AdminApplicationDetail />}
                          />*/}

                          {/* Payments */}
                          <Route path="payments">
                            <Route index element={<Navigate to="all" replace />} />
                            <Route path=":tab" element={<AdminPayments />} />
                          </Route>


                          <Route element={<RoleGuard allowedRoles={["super_admin"]} />}>
                            <Route path="clients" element={<AdminClients />} />
                            <Route path="applications" element={<AdminApplications />} />
                            <Route path="applications/:id" element={<AdminApplicationDetail />} />
                            <Route path="notifications" element={<AdminNotifications />} />
                          </Route>

                          {/*<Route path="notifications" element={<AdminNotifications />} />*/}
                          <Route path="support" element={<AdminSupport />} />
                          <Route path="analytics" element={<AdminAnalytics />} />

                          <Route path="*" element={<Navigate to="clients" replace />} />
                        </Route>
                    </Route>

                  </Routes>
                </Suspense>
                </ProfileModalProvider>
              </SupportChatProvider>
              </ChatProvider>
            </NotificationProvider>
            </ProfileProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
