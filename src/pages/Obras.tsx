import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, UserPlus } from "lucide-react";

interface Obra {
  id: string;
  nome: string;
  valor_orcado: number;
  valor_pago: number;
  data_inicio: string;
  descricao: string;
  status: string;
  client_id: string | null;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
}

const Obras = () => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [selectedObra, setSelectedObra] = useState<string | null>(null);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObras(data || []);

      // Buscar todos os clientes
      const { data: clientesData } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .neq('id', user.id);

      setClientes(clientesData || []);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const obraData = {
      nome: formData.get('nome') as string,
      valor_orcado: parseFloat(formData.get('valor_orcado') as string),
      valor_pago: parseFloat(formData.get('valor_pago') as string),
      data_inicio: formData.get('data_inicio') as string,
      descricao: formData.get('descricao') as string,
      status: formData.get('status') as string,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingObra) {
        const { error } = await supabase
          .from('obras')
          .update(obraData)
          .eq('id', editingObra.id);

        if (error) throw error;
        toast({ title: "Obra atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('obras')
          .insert({ ...obraData, user_id: user.id });

        if (error) throw error;
        toast({ title: "Obra criada com sucesso!" });
      }

      setDialogOpen(false);
      setEditingObra(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleVincularCliente = async (clientId: string) => {
    if (!selectedObra) return;

    try {
      const { error } = await supabase
        .from('obras')
        .update({ client_id: clientId })
        .eq('id', selectedObra);

      if (error) throw error;
      toast({ title: "Cliente vinculado com sucesso!" });
      setClientDialogOpen(false);
      setSelectedObra(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao vincular cliente",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta obra?')) return;

    try {
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Obra excluída com sucesso!" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  const getClienteNome = (clientId: string | null) => {
    if (!clientId) return null;
    const cliente = clientes.find(c => c.id === clientId);
    return cliente?.nome;
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Obras</h1>
          <p className="text-muted-foreground">Gerencie todas as suas obras</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingObra(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Obra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingObra ? 'Editar Obra' : 'Nova Obra'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Obra *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    defaultValue={editingObra?.nome}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select name="status" defaultValue={editingObra?.status || 'ativa'} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="pausada">Pausada</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_orcado">Valor Orçado *</Label>
                  <Input
                    id="valor_orcado"
                    name="valor_orcado"
                    type="number"
                    step="0.01"
                    defaultValue={editingObra?.valor_orcado}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_pago">Valor Pago *</Label>
                  <Input
                    id="valor_pago"
                    name="valor_pago"
                    type="number"
                    step="0.01"
                    defaultValue={editingObra?.valor_pago}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  name="data_inicio"
                  type="date"
                  defaultValue={editingObra?.data_inicio}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  rows={3}
                  defaultValue={editingObra?.descricao}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingObra ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {obras.map((obra) => (
          <Card key={obra.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{obra.nome}</CardTitle>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(obra.status)}`}>
                  {obra.status}
                </span>
              </div>
              {getClienteNome(obra.client_id) && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Cliente: {getClienteNome(obra.client_id)}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Valor Orçado</p>
                <p className="text-lg font-medium">{formatCurrency(obra.valor_orcado)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="text-lg font-medium">{formatCurrency(obra.valor_pago)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Início</p>
                <p>{new Date(obra.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              {obra.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{obra.descricao}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingObra(obra);
                    setDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedObra(obra.id);
                    setClientDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Cliente
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(obra.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {obras.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma obra cadastrada ainda</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira obra
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Cliente à Obra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {clientes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum cliente disponível
              </p>
            ) : (
              <div className="space-y-2">
                {clientes.map((cliente) => (
                  <Button
                    key={cliente.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleVincularCliente(cliente.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{cliente.nome}</div>
                      <div className="text-sm text-muted-foreground">{cliente.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Obras;
