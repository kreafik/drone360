import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(2, "Başlık en az 2 karakter olmalıdır.").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["real_estate", "boat", "other"] as const),
  location: z.string().max(200).optional(),
  ownerId: z.string().uuid("Geçerli bir kullanıcı seçiniz.").optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const inviteUserSchema = z.object({
  email: z.string().email("Geçerli bir e-posta giriniz."),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(100),
  companyName: z.string().max(100).optional(),
  sendInvite: z.boolean(),
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;
