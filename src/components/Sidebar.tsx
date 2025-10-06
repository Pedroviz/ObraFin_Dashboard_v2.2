import { NavLink } from "react-router-dom";
import { Building2, LayoutDashboard, Briefcase, TrendingDown, TrendingUp, LogOut, Eye, BookOpen, Users } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading && role === 'cliente') {
      navigate('/cliente');
    }
  }, [role, loading, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/obras", icon: Briefcase, label: "Obras" },
    { to: "/clientes", icon: Users, label: "Clientes" },
    { to: "/diario", icon: BookOpen, label: "Diário de Obra" },
    { to: "/gastos", icon: TrendingDown, label: "Gastos" },
    { to: "/receitas", icon: TrendingUp, label: "Receitas" },
  ];

  if (loading) {
    return (
      <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col shadow-soft">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-soft">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">ObraFin</h1>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft font-medium"
                  : "text-foreground hover:bg-secondary hover:shadow-soft-inset"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        <NavLink
          to="/cliente"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive
                ? "bg-accent text-accent-foreground shadow-soft font-medium"
                : "text-foreground hover:bg-secondary hover:shadow-soft-inset"
            }`
          }
        >
          <Eye className="h-5 w-5" />
          <span>Visualizar como Cliente</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
