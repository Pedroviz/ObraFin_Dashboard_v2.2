import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Camera, Upload, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiaryEntry {
  id: string;
  date: string;
  description: string;
  status: "em_execucao" | "concluido" | "aguardando_material";
  image_url?: string;
  obra_id: string;
  obra_nome: string;
}

const statusConfig = {
  em_execucao: { label: "Em Execução", icon: Clock, color: "bg-warning/10 text-warning border-warning" },
  concluido: { label: "Concluído", icon: CheckCircle2, color: "bg-success/10 text-success border-success" },
  aguardando_material: { label: "Aguardando Material", icon: AlertCircle, color: "bg-muted/10 text-muted-foreground border-muted" }
};

const DiarioObra = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    obra_id: "",
    description: "",
    status: "em_execucao" as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load obras
      const { data: obrasData } = await supabase
        .from('obras')
        .select('*')
        .eq('user_id', user.id);
      
      setObras(obrasData || []);
      
      // Mock diary entries (você pode criar uma tabela diario_obra no Supabase depois)
      setEntries([]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock save - você pode implementar o upload real depois
    const obraSelecionada = obras.find(o => o.id === formData.obra_id);
    
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: formData.description,
      status: formData.status,
      image_url: imagePreview || undefined,
      obra_id: formData.obra_id,
      obra_nome: obraSelecionada?.nome || ""
    };

    setEntries([newEntry, ...entries]);
    toast.success("Atualização adicionada ao diário!");
    
    // Reset form
    setFormData({ obra_id: "", description: "", status: "em_execucao" });
    setSelectedImage(null);
    setImagePreview("");
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
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
            <h1 className="text-3xl font-bold text-foreground">Diário de Obra</h1>
            <p className="text-muted-foreground">Registre o progresso diário das suas obras</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-primary shadow-soft hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            {showForm ? "Cancelar" : "Nova Atualização"}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-6 shadow-soft">
              <CardHeader>
                <CardTitle>Adicionar Atualização</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Obra</Label>
                    <Select
                      value={formData.obra_id}
                      onValueChange={(value) => setFormData({ ...formData, obra_id: value })}
                      required
                    >
                      <SelectTrigger className="shadow-soft-inset">
                        <SelectValue placeholder="Selecione a obra" />
                      </SelectTrigger>
                      <SelectContent>
                        {obras.map((obra) => (
                          <SelectItem key={obra.id} value={obra.id}>
                            {obra.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o que foi realizado hoje..."
                      required
                      className="shadow-soft-inset min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="shadow-soft-inset">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_execucao">Em Execução</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="aguardando_material">Aguardando Material</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Foto (opcional)</Label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all shadow-soft-inset hover:shadow-md ${
                        isDragActive ? "border-primary bg-accent" : "border-border"
                      }`}
                    >
                      <input {...getInputProps()} />
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Arraste uma foto ou clique para selecionar
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-primary shadow-soft hover:shadow-md transition-all">
                    Salvar Atualização
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Entries List */}
        <div className="space-y-4">
          {entries.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma atualização registrada ainda.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece adicionando o progresso da sua obra!
                </p>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry, index) => {
              const StatusIcon = statusConfig[entry.status].icon;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="shadow-soft hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {entry.image_url && (
                          <img
                            src={entry.image_url}
                            alt="Foto da obra"
                            className="w-32 h-32 object-cover rounded-xl shadow-soft"
                          />
                        )}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">
                                {entry.obra_nome}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(entry.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Badge className={statusConfig[entry.status].color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusConfig[entry.status].label}
                            </Badge>
                          </div>
                          <p className="text-foreground">{entry.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DiarioObra;
