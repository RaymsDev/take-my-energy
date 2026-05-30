import { CreateGiftCardSchema } from './gift-card.dto';

const validBase = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  senderName: 'Bob',
  serviceId: '1',
};

describe('CreateGiftCardSchema', () => {
  describe('happy path', () => {
    it('parses a valid payload without optional message', () => {
      expect(() => CreateGiftCardSchema.parse(validBase)).not.toThrow();
    });

    it('parses a valid payload with a message', () => {
      expect(() =>
        CreateGiftCardSchema.parse({ ...validBase, message: 'Enjoy!' }),
      ).not.toThrow();
    });
  });

  describe('error paths', () => {
    it('throws when recipientEmail is not a valid email', () => {
      const result = CreateGiftCardSchema.safeParse({
        ...validBase,
        recipientEmail: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path.join('.'));
        expect(fields).toContain('recipientEmail');
      }
    });

    it('throws when message exceeds 500 characters', () => {
      const result = CreateGiftCardSchema.safeParse({
        ...validBase,
        message: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path.join('.'));
        expect(fields).toContain('message');
      }
    });

    it('throws when recipientName is empty', () => {
      const result = CreateGiftCardSchema.safeParse({
        ...validBase,
        recipientName: '',
      });
      expect(result.success).toBe(false);
    });

    it('throws when serviceId is empty', () => {
      const result = CreateGiftCardSchema.safeParse({
        ...validBase,
        serviceId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('accepts a message exactly at the 500 character limit', () => {
      expect(() =>
        CreateGiftCardSchema.parse({ ...validBase, message: 'x'.repeat(500) }),
      ).not.toThrow();
    });
  });
});
