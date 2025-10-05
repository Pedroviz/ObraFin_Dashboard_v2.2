import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Obra {
  id: string;
  nome: string;
  valor_orcado: number;
  valor_pago: number;
  data_inicio: string;
  status: string;
  descricao: string;
}

interface Gasto {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
}

interface Receita {
  id: string;
  data: string;
  descricao: string;
  valor: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getCategoriaLabel = (categoria: string) => {
  const labels: Record<string, string> = {
    materiais: 'Materiais',
    frete: 'Frete',
    alimentacao: 'Alimentação',
    mao_de_obra: 'Mão de Obra',
    equipamentos: 'Equipamentos',
    outros: 'Outros'
  };
  return labels[categoria] || categoria;
};

const ClienteObraDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState<Obra | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadObraData();
  }, [id]);

  const loadObraData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar obra
      const { data: obraData } = await supabase
        .from('obras')
        .select('*')
        .eq('id', id)
        .eq('client_id', user.id)
        .single();

      if (!obraData) {
        navigate('/cliente');
        return;
      }

      setObra(obraData);

      // Buscar gastos
      const { data: gastosData } = await supabase
        .from('gastos')
        .select('*')
        .eq('obra_id', id)
        .order('data', { ascending: false });

      setGastos(gastosData || []);

      // Buscar receitas
      const { data: receitasData } = await supabase
        .from('receitas')
        .select('*')
        .eq('obra_id', id)
        .order('data', { ascending: false });

      setReceitas(receitasData || []);
    } catch (error) {
      console.error('Erro ao carregar obra:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.valor), 0);
  const totalReceitas = receitas.reduce((sum, r) => sum + Number(r.valor), 0);
  const saldoAtual = obra ? Number(obra.valor_pago) + totalReceitas - totalGastos : 0;

  // Preparar dados para o gráfico de evolução
  const prepararDadosGrafico = () => {
    const dados: { [key: string]: { data: string; gastos: number; receitas: number } } = {};

    gastos.forEach(g => {
      const data = new Date(g.data).toLocaleDateString('pt-BR');
      if (!dados[data]) {
        dados[data] = { data, gastos: 0, receitas: 0 };
      }
      dados[data].gastos += Number(g.valor);
    });

    receitas.forEach(r => {
      const data = new Date(r.data).toLocaleDateString('pt-BR');
      if (!dados[data]) {
        dados[data] = { data, gastos: 0, receitas: 0 };
      }
      dados[data].receitas += Number(r.valor);
    });

    return Object.values(dados).sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/');
      const [diaB, mesB, anoB] = b.data.split('/');
      return new Date(`${anoA}-${mesA}-${diaA}`).getTime() - new Date(`${anoB}-${mesB}-${diaB}`).getTime();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!obra) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ativa: 'bg-success/10 text-success',
      pausada: 'bg-warning/10 text-warning',
      concluida: 'bg-primary/10 text-primary',
      cancelada: 'bg-destructive/10 text-destructive'
    };
    return colors[status as keyof typeof colors] || '';
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/cliente')} variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{obra.nome}</h1>
            <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(obra.status)}`}>
              {obra.status}
            </span>
          </div>
          {obra.descricao && (
            <p className="text-muted-foreground">{obra.descricao}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            Início: {new Date(obra.data_inicio).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Orçado</p>
              <p className="text-2xl font-bold">{formatCurrency(obra.valor_orcado)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Pago</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(obra.valor_pago)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalGastos)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(saldoAtual)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      {(gastos.length > 0 || receitas.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepararDadosGrafico()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="gastos" stroke="hsl(var(--destructive))" name="Gastos" />
                <Line type="monotone" dataKey="receitas" stroke="hsl(var(--success))" name="Receitas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabelas de Gastos e Receitas */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="gastos">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gastos">Gastos ({gastos.length})</TabsTrigger>
              <TabsTrigger value="receitas">Receitas ({receitas.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="gastos" className="mt-4">
              {gastos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum gasto registrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastos.map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell>
                          {new Date(gasto.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{getCategoriaLabel(gasto.categoria)}</TableCell>
                        <TableCell>{gasto.descricao}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(gasto.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="receitas" className="mt-4">
              {receitas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma receita registrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((receita) => (
                      <TableRow key={receita.id}>
                        <TableCell>
                          {new Date(receita.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{receita.descricao}</TableCell>
                        <TableCell className="text-right font-medium text-success">
                          {formatCurrency(receita.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClienteObraDetalhes;
