export interface GiftCard {
  _id: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message?: string;
  serviceName: string;
  servicePrice: number;
  code: string;
  status: 'active' | 'redeemed';
  redeemedAt?: Date;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}
