import { useState, useEffect } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { categoriaSchema } from "@/lib/validation";
import { z } from "zod";

interface Categoria {
  id: string;
  nome: string;
  tipo: "gasto" | "receita";
  created_at: string;
}

const Categorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "gasto" as "gasto" | "receita",
  });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("user_id", user.id)
        .order("tipo", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      setCategorias((data || []) as Categoria[]);
    } catch (error: any) {
      toast.error("Erro ao carregar categorias: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      categoriaSchema.parse(formData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("categorias").insert([
        {
          nome: formData.nome,
          tipo: formData.tipo,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Categoria criada com sucesso!");
      setDialogOpen(false);
      setFormData({ nome: "", tipo: "gasto" });
      loadCategorias();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message.includes("duplicate key")) {
        toast.error("Esta categoria já existe");
      } else {
        toast.error("Erro ao criar categoria: " + error.message);
      }
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir a categoria "${nome}"?`)) return;

    try {
      const { error } = await supabase.from("categorias").delete().eq("id", id);

      if (error) throw error;

      toast.success("Categoria excluída com sucesso!");
      loadCategorias();
    } catch (error: any) {
      toast.error("Erro ao excluir categoria: " + error.message);
    }
  };

  const categoriasGastos = categorias.filter((c) => c.tipo === "gasto");
  const categoriasReceitas = categorias.filter((c) => c.tipo === "receita");

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Categorias</h1>
              <p className="text-muted-foreground">
                Gerencie as categorias de gastos e receitas
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-destructive" />
                  Categorias de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoriasGastos.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma categoria de gasto cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoriasGastos.map((categoria) => (
                      <div
                        key={categoria.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <span className="font-medium text-foreground">
                          {categoria.nome}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(categoria.id, categoria.nome)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Categorias de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoriasReceitas.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma categoria de receita cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoriasReceitas.map((categoria) => (
                      <div
                        key={categoria.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <span className="font-medium text-foreground">
                          {categoria.nome}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(categoria.id, categoria.nome)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Adicione uma nova categoria para organizar seus gastos ou receitas
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: "gasto" | "receita") =>
                        setFormData({ ...formData, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gasto">Gasto</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nome">Nome da Categoria</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Material, Mão de Obra, etc."
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Categoria</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Categorias;
