import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(100),
  companyName: z.string().max(100).optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
