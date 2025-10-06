import { z } from 'zod';

// Auth validation schemas
export const signUpSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100, "Senha muito longa")
});

export const signInSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

// Cliente validation schemas
export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100, "Senha muito longa").optional()
});

// Obra validation schemas
export const obraSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  descricao: z.string().trim().max(1000, "Descrição muito longa").optional().or(z.literal('')),
  valor_orcado: z.number().nonnegative("Valor não pode ser negativo").max(999999999, "Valor muito alto"),
  valor_pago: z.number().nonnegative("Valor não pode ser negativo").max(999999999, "Valor muito alto"),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  status: z.enum(['ativa', 'pausada', 'concluida', 'cancelada'])
});

// Financial data validation schemas
export const financeSchema = z.object({
  descricao: z.string().trim().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  valor: z.number().positive("Valor deve ser positivo").max(999999999, "Valor muito alto"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  categoria: z.string().trim().min(1, "Categoria é obrigatória").max(50, "Categoria muito longa").optional()
});
