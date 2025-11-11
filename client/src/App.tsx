import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import React from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Tools from "./pages/Tools";
import Stock from "./pages/Stock";
import Borrowings from "./pages/Borrowings";
import Approvals from "./pages/Approvals";
import Analytics from "./pages/Analytics";
import Navigation from "./components/Navigation";

function RootRedirect() {
  const [, navigate] = useLocation();
  React.useEffect(() => {
    navigate("/dashboard");
  }, [navigate]);
  return null;
}

function Router() {
  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={RootRedirect} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tools" component={Tools} />
          <Route path="/stock" component={Stock} />
          <Route path="/borrowings" component={Borrowings} />
          <Route path="/approvals" component={Approvals} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/users">
            {() => <div>User Management - Coming Soon</div>}
          </Route>

          {/* Error routes */}
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
