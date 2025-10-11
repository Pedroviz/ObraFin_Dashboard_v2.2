import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import Clientes from "./pages/Clientes";
import Categorias from "./pages/Categorias";
import Gastos from "./pages/Gastos";
import Receitas from "./pages/Receitas";
import DiarioObra from "./pages/DiarioObra";
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

const ClienteLayout = ({ children }: { children: React.ReactNode }) => {
  const location = window.location;
  const isDetailsPage = location.pathname.includes('/cliente/obra/');
  
  return (
    <div className="min-h-screen w-full">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">E</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Engetech Soluções</h1>
              <p className="text-xs text-muted-foreground">Painel do Cliente</p>
            </div>
          </div>
          {isDetailsPage && (
            <a href="/cliente" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao Dashboard
            </a>
          )}
        </div>
      </header>
      <main className="bg-background">
        {children}
      </main>
    </div>
  );
};

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
            path="/clientes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Clientes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diario"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DiarioObra />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categorias"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Categorias />
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
