import { IPaymentService, PaymentResult } from "../../application/ports/payment.port";

/**
 * Deterministic mock payment service.
 * Approves 4 out of every 5 consecutive calls; the 5th call is rejected.
 * This predictable pattern makes it easy to test both success and failure paths.
 */
export class MockPaymentService implements IPaymentService {
  private callCount = 0;

  async processPayment(orderId: number, _amount: number): Promise<PaymentResult> {
    this.callCount += 1;
    const isRejection = this.callCount % 5 === 0;

    if (isRejection) {
      return {
        success: false,
        transactionId: `txn_rejected_${orderId}_${Date.now()}`,
        message: "Payment declined by issuer"
      };
    }

    return {
      success: true,
      transactionId: `txn_approved_${orderId}_${Date.now()}`,
      message: "Payment approved"
    };
  }

  /** Reset the counter (useful in tests). */
  reset(): void {
    this.callCount = 0;
  }
}
