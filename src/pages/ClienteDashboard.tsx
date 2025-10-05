import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, TrendingDown, TrendingUp, FileText, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ObraData {
  id: string;
  nome: string;
  valor_orcado: number;
  valor_pago: number;
  data_inicio: string;
  status: string;
  descricao: string;
  saldo: number;
  percentual_gasto: number;
  gastos: Array<{
    categoria: string;
    total: number;
  }>;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const ClienteDashboard = () => {
  const [obras, setObras] = useState<ObraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar nome do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.nome);
      }

      // Buscar obras vinculadas ao cliente
      const { data: obrasData } = await supabase
        .from('obras')
        .select('*')
        .eq('client_id', user.id);

      if (!obrasData) return;

      // Buscar gastos e receitas para cada obra
      const obrasComDados = await Promise.all(
        obrasData.map(async (obra) => {
          const { data: gastos } = await supabase
            .from('gastos')
            .select('*')
            .eq('obra_id', obra.id);

          const { data: receitas } = await supabase
            .from('receitas')
            .select('*')
            .eq('obra_id', obra.id);

          const totalGastos = gastos?.reduce((sum, g) => sum + Number(g.valor), 0) || 0;
          const totalReceitas = receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;
          const saldo = Number(obra.valor_pago) + totalReceitas - totalGastos;
          const percentual_gasto = (totalGastos / Number(obra.valor_orcado)) * 100;

          // Agrupar gastos por categoria
          const gastosAgrupados = gastos?.reduce((acc, gasto) => {
            const existing = acc.find(item => item.categoria === gasto.categoria);
            if (existing) {
              existing.total += Number(gasto.valor);
            } else {
              acc.push({ categoria: gasto.categoria, total: Number(gasto.valor) });
            }
            return acc;
          }, [] as Array<{ categoria: string; total: number }>) || [];

          return {
            ...obra,
            saldo,
            percentual_gasto: Math.round(percentual_gasto),
            gastos: gastosAgrupados
          };
        })
      );

      setObras(obrasComDados);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ativa: 'bg-success/10 text-success',
      pausada: 'bg-warning/10 text-warning',
      concluida: 'bg-primary/10 text-primary',
      cancelada: 'bg-destructive/10 text-destructive'
    };
    return colors[status as keyof typeof colors] || '';
  };

  const getProgressColor = (percentual: number) => {
    if (percentual < 70) return 'hsl(var(--success))';
    if (percentual < 90) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const exportarRelatorio = (obra: ObraData) => {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(0, 115, 177);
    doc.text('Engetech Soluções', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório Financeiro da Obra', 105, 30, { align: 'center' });
    
    // Informações da obra
    doc.setFontSize(12);
    doc.text(`Obra: ${obra.nome}`, 20, 45);
    doc.text(`Status: ${obra.status}`, 20, 52);
    doc.text(`Data de Início: ${new Date(obra.data_inicio).toLocaleDateString('pt-BR')}`, 20, 59);
    
    // Resumo financeiro
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 20, 75);
    doc.setFontSize(11);
    doc.text(`Valor Orçado: ${formatCurrency(obra.valor_orcado)}`, 20, 85);
    doc.text(`Valor Pago: ${formatCurrency(obra.valor_pago)}`, 20, 92);
    doc.text(`Saldo Atual: ${formatCurrency(obra.saldo)}`, 20, 99);
    doc.text(`Percentual Gasto: ${obra.percentual_gasto}%`, 20, 106);
    
    // Tabela de gastos
    if (obra.gastos.length > 0) {
      autoTable(doc, {
        startY: 120,
        head: [['Categoria', 'Valor']],
        body: obra.gastos.map(g => [
          g.categoria.replace(/_/g, ' ').toUpperCase(),
          formatCurrency(g.total)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [0, 115, 177] }
      });
    }
    
    doc.save(`relatorio-${obra.nome.toLowerCase().replace(/\s/g, '-')}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nenhuma obra vinculada</h2>
            <p className="text-muted-foreground text-center">
              Você ainda não tem obras vinculadas à sua conta. Entre em contato com a Engetech para mais informações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          Olá, {userName}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Aqui está o andamento da{obras.length > 1 ? 's suas obras' : ' sua obra'}
        </p>
      </div>

      {/* Cards das obras */}
      {obras.map((obra) => (
        <div key={obra.id} className="space-y-6">
          {/* Cabeçalho da obra */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl">{obra.nome}</CardTitle>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(obra.status)}`}>
                      {obra.status}
                    </span>
                  </div>
                  {obra.descricao && (
                    <p className="text-muted-foreground">{obra.descricao}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Início: {new Date(obra.data_inicio).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <Button onClick={() => exportarRelatorio(obra)} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar Relatório
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Cards de métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Orçado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(obra.valor_orcado)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Pago</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{formatCurrency(obra.valor_pago)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                <TrendingDown className="h-4 w-4" style={{ color: getProgressColor(obra.percentual_gasto) }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: getProgressColor(obra.percentual_gasto) }}>
                  {formatCurrency(obra.saldo)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Utilizado</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{obra.percentual_gasto}%</div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(obra.percentual_gasto, 100)}%`,
                        backgroundColor: getProgressColor(obra.percentual_gasto)
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de gastos por categoria */}
          {obra.gastos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={obra.gastos}
                      dataKey="total"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.categoria.replace(/_/g, ' ')}
                    >
                      {obra.gastos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => navigate(`/cliente/obra/${obra.id}`)}
            className="w-full"
            size="lg"
          >
            Ver Detalhes da Obra
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ClienteDashboard;
