import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

export const CreateGiftCardSchema = z.object({
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
  senderName: z.string().min(1),
  serviceId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export type CreateGiftCardInput = z.infer<typeof CreateGiftCardSchema>;

export class CreateGiftCardDto extends createZodDto(CreateGiftCardSchema) {}
