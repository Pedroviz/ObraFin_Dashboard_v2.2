import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GanttChart from "@/components/GanttChart";

interface DashboardData {
  totalObras: number;
  totalOrcado: number;
  totalGastos: number;
  saldoGeral: number;
  obras: Array<{
    nome: string;
    valor_orcado: number;
    saldo: number;
    percentual_gasto: number;
  }>;
  gastosPorCategoria: Array<{
    categoria: string;
    total: number;
  }>;
}

const COLORS = ['hsl(152 45% 19%)', 'hsl(152 48% 71%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(152 45% 40%)', 'hsl(152 48% 85%)'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData>({
    totalObras: 0,
    totalOrcado: 0,
    totalGastos: 0,
    saldoGeral: 0,
    obras: [],
    gastosPorCategoria: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar obras do usuário
      const { data: obras, error: obrasError } = await supabase
        .from('obras')
        .select('*')
        .eq('user_id', user.id);

      if (obrasError) throw obrasError;

      // Buscar gastos
      const { data: gastos, error: gastosError } = await supabase
        .from('gastos')
        .select('*, obra_id');

      if (gastosError) throw gastosError;

      // Buscar receitas
      const { data: receitas, error: receitasError } = await supabase
        .from('receitas')
        .select('*, obra_id');

      if (receitasError) throw receitasError;

      // Calcular métricas
      const totalObras = obras?.length || 0;
      const totalOrcado = obras?.reduce((sum, obra) => sum + Number(obra.valor_orcado), 0) || 0;
      
      const totalGastos = gastos?.reduce((sum, gasto) => sum + Number(gasto.valor), 0) || 0;
      const totalReceitas = receitas?.reduce((sum, receita) => sum + Number(receita.valor), 0) || 0;
      
      const totalValorPago = obras?.reduce((sum, obra) => sum + Number(obra.valor_pago), 0) || 0;
      const saldoGeral = totalValorPago + totalReceitas - totalGastos;

      // Calcular saldo por obra
      const obrasComSaldo = obras?.map(obra => {
        const gastosObra = gastos?.filter(g => g.obra_id === obra.id).reduce((sum, g) => sum + Number(g.valor), 0) || 0;
        const receitasObra = receitas?.filter(r => r.obra_id === obra.id).reduce((sum, r) => sum + Number(r.valor), 0) || 0;
        const saldo = Number(obra.valor_pago) + receitasObra - gastosObra;
        const percentual_gasto = (gastosObra / Number(obra.valor_orcado)) * 100;

        return {
          nome: obra.nome,
          valor_orcado: Number(obra.valor_orcado),
          saldo,
          percentual_gasto: Math.round(percentual_gasto)
        };
      }) || [];

      // Agrupar gastos por categoria
      const gastosAgrupados = gastos?.reduce((acc, gasto) => {
        const categoria = gasto.categoria;
        const existing = acc.find(item => item.categoria === categoria);
        if (existing) {
          existing.total += Number(gasto.valor);
        } else {
          acc.push({ categoria, total: Number(gasto.valor) });
        }
        return acc;
      }, [] as Array<{ categoria: string; total: number }>) || [];

      setData({
        totalObras,
        totalOrcado,
        totalGastos,
        saldoGeral,
        obras: obrasComSaldo,
        gastosPorCategoria: gastosAgrupados
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock Gantt data
  const ganttTasks = [
    {
      id: "1",
      name: "Fundação",
      start: "2025-01-01",
      end: "2025-02-15",
      progress: 100
    },
    {
      id: "2",
      name: "Alvenaria",
      start: "2025-02-16",
      end: "2025-04-30",
      progress: 75,
      dependencies: "1"
    },
    {
      id: "3",
      name: "Instalações",
      start: "2025-03-15",
      end: "2025-05-30",
      progress: 40,
      dependencies: "2"
    },
    {
      id: "4",
      name: "Acabamento",
      start: "2025-05-01",
      end: "2025-07-15",
      progress: 20,
      dependencies: "3"
    },
    {
      id: "5",
      name: "Entrega",
      start: "2025-07-16",
      end: "2025-07-31",
      progress: 0,
      dependencies: "4"
    }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-subtle min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
        <p className="text-muted-foreground">Visão geral das suas obras</p>
      </motion.div>

      {/* Cards de métricas com Soft UI */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Obras Ativas", value: data.totalObras, icon: Building2, color: "text-primary" },
          { title: "Total Orçado", value: formatCurrency(data.totalOrcado), icon: DollarSign, color: "text-accent" },
          { title: "Total de Gastos", value: formatCurrency(data.totalGastos), icon: TrendingDown, color: "text-destructive" },
          { title: "Saldo Geral", value: formatCurrency(data.saldoGeral), icon: TrendingUp, color: data.saldoGeral >= 0 ? 'text-success' : 'text-destructive' }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card className="shadow-soft hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráfico de Gantt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <GanttChart tasks={ganttTasks} />
      </motion.div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {data.gastosPorCategoria.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.gastosPorCategoria}
                      dataKey="total"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.categoria}
                    >
                      {data.gastosPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data.obras.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Saldo por Obra</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.obras}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="saldo" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Lista de obras */}
      {data.obras.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Resumo das Obras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.obras.map((obra, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                    className="flex items-center justify-between p-4 bg-secondary rounded-xl shadow-soft-inset hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{obra.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        Orçado: {formatCurrency(obra.valor_orcado)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${obra.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(obra.saldo)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {obra.percentual_gasto}% gasto
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
