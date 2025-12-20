// Type declarations for paystack module
declare module 'paystack' {
  interface PaystackTransactionData {
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    callback_url?: string;
    plan?: string;
    metadata?: Record<string, any>;
  }

  interface PaystackTransactionResponse {
    status: boolean;
    message: string;
    data?: {
      authorization_url?: string;
      access_code?: string;
      reference?: string;
      [key: string]: any;
    };
  }

  interface PaystackTransaction {
    initialize(data: PaystackTransactionData): Promise<PaystackTransactionResponse>;
    verify(reference: string): Promise<PaystackTransactionResponse>;
  }

  interface PaystackClient {
    transaction: PaystackTransaction;
  }

  class Paystack {
    constructor(secretKey: string);
    transaction: PaystackTransaction;
  }

  export = Paystack;
}

