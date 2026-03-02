import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

export const RegisterRequestSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  shippingAddress: z.string().optional()
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
export type RegisterRequestDto = z.infer<typeof RegisterRequestSchema>;

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    shippingAddress: string | null;
  };
}
