import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import Gastos from "./pages/Gastos";
import Receitas from "./pages/Receitas";
import ClienteDashboard from "./pages/ClienteDashboard";
import ClienteObraDetalhes from "./pages/ClienteObraDetalhes";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen w-full">
    <Sidebar />
    <main className="flex-1 overflow-auto bg-background">
      {children}
    </main>
  </div>
);

const ClienteLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen w-full">
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">E</span>
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">Engetech Soluções</h1>
          <p className="text-xs text-muted-foreground">Painel do Cliente</p>
        </div>
      </div>
    </header>
    <main className="bg-background">
      {children}
    </main>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Rotas do Admin */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/obras"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Obras />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gastos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Gastos />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receitas"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Receitas />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Rotas do Cliente */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute>
                <ClienteLayout>
                  <ClienteDashboard />
                </ClienteLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/obra/:id"
            element={
              <ProtectedRoute>
                <ClienteLayout>
                  <ClienteObraDetalhes />
                </ClienteLayout>
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
