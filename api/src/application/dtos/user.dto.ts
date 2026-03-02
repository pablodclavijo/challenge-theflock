import { z } from "zod";

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name cannot be empty").optional(),
  shippingAddress: z.string().optional()
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export interface ProfileResponseDto {
  id: string;
  email: string;
  fullName: string;
  shippingAddress: string | null;
}
