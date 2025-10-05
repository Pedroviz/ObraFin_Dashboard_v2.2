import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
        <p className="text-muted-foreground">Visão geral das suas obras</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalObras}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orçado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalOrcado)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(data.totalGastos)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.saldoGeral >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(data.saldoGeral)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {data.gastosPorCategoria.length > 0 && (
          <Card>
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
        )}

        {data.obras.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saldo por Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.obras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="saldo" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de obras */}
      {data.obras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.obras.map((obra, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{obra.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      Orçado: {formatCurrency(obra.valor_orcado)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${obra.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(obra.saldo)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {obra.percentual_gasto}% gasto
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
