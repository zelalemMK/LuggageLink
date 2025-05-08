import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";

// Pages
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TravelersPage from "@/pages/travelers-page";
import PackagesPage from "@/pages/packages-page";
import PostRequestPage from "@/pages/post-request-page";
import VerificationPage from "@/pages/verification-page";
import MessagingPage from "@/pages/messaging-page";
import ProfilePage from "@/pages/profile-page";
import PaymentPage from "@/pages/payment-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <Route path="/travelers" component={TravelersPage} />
      <ProtectedRoute path="/packages" component={PackagesPage} />
      <ProtectedRoute path="/post" component={PostRequestPage} />
      <ProtectedRoute path="/verify" component={VerificationPage} />
      <ProtectedRoute path="/messages" component={MessagingPage} />
      <ProtectedRoute path="/messages/:userId" component={MessagingPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/:userId" component={ProfilePage} />
      <ProtectedRoute path="/payment/:deliveryId" component={PaymentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
