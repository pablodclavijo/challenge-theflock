export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

export interface IPaymentService {
  processPayment(orderId: number, amount: number): Promise<PaymentResult>;
}
