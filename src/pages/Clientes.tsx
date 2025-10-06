import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Mail, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { clienteSchema } from "@/lib/validation";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  created_at: string;
}

interface Obra {
  id: string;
  nome: string;
}

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteObras, setClienteObras] = useState<Record<string, Obra[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar apenas clientes vinculados às obras do admin (previne email harvesting)
      const { data: obrasData } = await supabase
        .from('obras')
        .select('client_id')
        .eq('user_id', user.id)
        .not('client_id', 'is', null);

      if (!obrasData || obrasData.length === 0) {
        setClientes([]);
        setLoading(false);
        return;
      }

      const clientIds = [...new Set(obrasData.map(o => o.client_id))];

      const { data: clientesData, error: clientesError } = await supabase
        .from('profiles')
        .select('id, nome, email, created_at')
        .in('id', clientIds)
        .order('created_at', { ascending: false });

      if (clientesError) throw clientesError;

      setClientes(clientesData || []);

      // Buscar obras vinculadas para cada cliente
      if (clientesData && clientesData.length > 0) {
        const obrasMap: Record<string, Obra[]> = {};
        
        for (const cliente of clientesData) {
          const { data: obras } = await supabase
            .from('obras')
            .select('id, nome')
            .eq('client_id', cliente.id);
          
          if (obras) {
            obrasMap[cliente.id] = obras;
          }
        }
        
        setClienteObras(obrasMap);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro ao carregar clientes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const nome = formData.get('nome') as string;
    const email = formData.get('email') as string;
    const senha = formData.get('senha') as string;

    // Validate input
    try {
      clienteSchema.parse({ nome, email, senha: senha || undefined });
    } catch (error: any) {
      const firstError = error.errors?.[0];
      toast({
        title: "Dados inválidos",
        description: firstError?.message || "Verifique os dados informados",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCliente) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('profiles')
          .update({ nome, email })
          .eq('id', editingCliente.id);

        if (error) throw error;
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        // Criar novo cliente
        if (!senha) {
          toast({
            title: "Senha é obrigatória para novos clientes",
            variant: "destructive"
          });
          return;
        }

        // Criar usuário no Supabase Auth (role 'cliente' atribuída automaticamente pelo trigger)
        const { error: authError } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              nome: nome
            }
          }
        });

        if (authError) throw authError;

        toast({ title: "Cliente cadastrado com sucesso!" });
      }

      setDialogOpen(false);
      setEditingCliente(null);
      loadClientes();
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: "Erro ao salvar cliente",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      // Verificar se há obras vinculadas
      const { data: obras } = await supabase
        .from('obras')
        .select('id')
        .eq('client_id', id);

      if (obras && obras.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este cliente possui obras vinculadas. Desvincule-as primeiro.",
          variant: "destructive"
        });
        return;
      }

      // Deletar o perfil (isso também vai deletar o usuário através do cascade)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Cliente excluído com sucesso!" });
      loadClientes();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes e vincule obras</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditingCliente(null)}
                className="shadow-soft hover:shadow-soft-hover transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    defaultValue={editingCliente?.nome}
                    placeholder="João da Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingCliente?.email}
                    placeholder="joao@example.com"
                    required
                    disabled={!!editingCliente}
                  />
                  {editingCliente && (
                    <p className="text-xs text-muted-foreground">
                      O e-mail não pode ser alterado
                    </p>
                  )}
                </div>

                {!editingCliente && (
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      name="senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      O cliente usará esta senha para fazer login
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCliente ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente, index) => (
            <motion.div
              key={cliente.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="shadow-soft hover:shadow-soft-hover transition-all">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between">
                    <span className="truncate">{cliente.nome}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{cliente.email}</span>
                  </div>

                  {clienteObras[cliente.id] && clienteObras[cliente.id].length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Building2 className="h-4 w-4" />
                        <span>Obras Vinculadas ({clienteObras[cliente.id].length})</span>
                      </div>
                      <div className="space-y-1">
                        {clienteObras[cliente.id].slice(0, 2).map((obra) => (
                          <div 
                            key={obra.id}
                            className="text-xs bg-muted/50 rounded px-2 py-1 truncate"
                          >
                            {obra.nome}
                          </div>
                        ))}
                        {clienteObras[cliente.id].length > 2 && (
                          <div className="text-xs text-muted-foreground px-2">
                            +{clienteObras[cliente.id].length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Cadastrado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCliente(cliente);
                        setDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(cliente.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {clientes.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado ainda</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar primeiro cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default Clientes;
