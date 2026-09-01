import { Switch, Route } from "wouter";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { trpc } from "./lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { Toaster } from "@/components/ui/sonner";
import NotFound from "@/pages/NotFound";
import ParentForm from "@/pages/ParentForm";
import ReceptionDashboard from "@/pages/ReceptionDashboard";

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={ReceptionDashboard} />
      <Route path="/parent-form" component={ParentForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
