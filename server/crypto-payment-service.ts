import { CryptoPayment } from '@shared/schema';
import { storage } from './storage';

export type CryptoCurrency = 'BTC' | 'USDT' | 'LTC';

interface BlockchainTransaction {
  txid: string;
  amount: number;
  confirmations: number;
  timestamp: Date;
}

/**
 * Service to handle cryptocurrency payment processing and verification
 */
export class CryptoPaymentService {
  private apiKeys = {
    BTC: process.env.BITCOIN_API_KEY || 'demo_api_key',
    USDT: process.env.TETHER_API_KEY || 'demo_api_key',
    LTC: process.env.LITECOIN_API_KEY || 'demo_api_key',
  };

  private baseWalletAddresses = {
    BTC: 'bc1qmk3rumwu0h30ryz5ezg6d0nalflq6lfpw0y6me',
    USDT: '3CSixKXwNbq3Wccve687QHff7p1x3ihthF',
    LTC: 'LgmRXe3R2drqrv1PKV7TB7Af4LfK7G71tw',
  };

  private exchangeRates = {
    BTC: 70000, // 1 BTC = $70,000 USD
    USDT: 1,    // 1 USDT = $1 USD (stablecoin)
    LTC: 85,    // 1 LTC = $85 USD
  };

  /**
   * Get payment history for a user
   * @param userId User ID
   * @returns Array of payment records
   */
  async getUserPayments(userId: number): Promise<CryptoPayment[]> {
    return storage.getCryptoPaymentsByUserId(userId);
  }

  /**
   * Create a new payment request
   * @param userId User ID
   * @param planName Plan name
   * @param amount Payment amount
   * @param currency Cryptocurrency to use
   * @returns Payment details
   */
  async createPaymentRequest(
    userId: number,
    planName: string,
    amount: number,
    currency: CryptoCurrency
  ) {
    // Calculate exact crypto amount
    const cryptoAmount = amount / this.exchangeRates[currency];

    // Generate a unique reference ID
    const referenceId = this.generateReferenceId();

    // Create a record in the database
    const payment = await storage.createCryptoPayment({
      userId,
      planName,
      amount,
      currency,
      walletAddress: this.baseWalletAddresses[currency],
      referenceId,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiration
      transactionId: null
    });

    return {
      paymentId: payment.id,
      amount: payment.amount,
      cryptoAmount, // Return the calculated amount but don't store it
      currency: payment.currency,
      walletAddress: payment.walletAddress,
      referenceId: payment.referenceId,
    };
  }

  /**
   * Verify if a payment has been received
   * @param paymentId Payment ID to check
   * @returns Boolean indicating if payment was verified
   */
  async verifyPayment(paymentId: number): Promise<boolean> {
    // Get payment details
    const payment = await storage.getCryptoPayment(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if payment is already completed
    if (payment.status === 'completed') {
      return true;
    }

    // Check if payment has expired
    if (payment.expiresAt && payment.expiresAt < new Date()) {
      await storage.updateCryptoPayment(paymentId, { status: 'expired' });
      return false;
    }

    try {
      // Query blockchain for transaction
      const transactions = await this.queryBlockchain(
        payment.currency as CryptoCurrency,
        payment.walletAddress
      );

      // Calculate expected amount in crypto
      const expectedAmount = payment.amount / this.exchangeRates[payment.currency as CryptoCurrency];

      // Check for matching transaction (amount within 1% tolerance)
      const matchingTx = transactions.find(tx => {
        const amountDiff = Math.abs(tx.amount - expectedAmount);
        return amountDiff / expectedAmount < 0.01; // 1% tolerance
      });

      if (matchingTx && matchingTx.confirmations >= 1) {
        // Payment verified - update status and activate subscription
        await storage.updateCryptoPayment(paymentId, {
          status: 'completed',
          completedAt: new Date(),
          transactionId: matchingTx.txid,
        });

        // Activate premium subscription
        await this.activatePremiumSubscription(payment.userId, payment.planName);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying blockchain payment:', error);
      return false;
    }
  }

  /**
   * Queries the blockchain for transactions
   * This is a simplified mock version. In production, you would:
   * - Use specific blockchain APIs for each currency
   * - Implement proper API rate limiting, error handling, etc.
   */
  private async queryBlockchain(
    currency: CryptoCurrency,
    address: string
  ): Promise<BlockchainTransaction[]> {
    // This is a mock implementation
    // In a real implementation, you would call blockchain APIs to verify transactions
    
    // For testing purposes, return a mock transaction with a low probability
    if (Math.random() < 0.05) {
      return [
        {
          txid: 'mock_txid_' + Math.floor(Math.random() * 1000000),
          amount: 0.001, // A small amount for testing
          confirmations: 3,
          timestamp: new Date(),
        },
      ];
    }
    
    // Usually return empty array to simulate no transactions found
    return [];
  }

  /**
   * Activate premium subscription for user
   */
  private async activatePremiumSubscription(userId: number, planName: string): Promise<void> {
    // Get current user
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const expiryDate = this.calculateExpiryDate(planName);

    // Update user with premium status
    await storage.updateUserSubscription(userId, {
      isPremium: true,
      premiumTier: planName,
      premiumExpiresAt: expiryDate,
    });
  }

  /**
   * Calculate when the subscription expires based on plan name
   */
  private calculateExpiryDate(planName: string): Date {
    const now = new Date();
    
    switch (planName.toLowerCase()) {
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'annual':
      case 'yearly':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'quarterly':
        return new Date(now.setMonth(now.getMonth() + 3));
      default:
        // Default to 30 days
        return new Date(now.setDate(now.getDate() + 30));
    }
  }

  /**
   * Generate a unique reference ID
   */
  private generateReferenceId(): string {
    return 'PAY-' + Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  /**
   * Start automatic payment verification service
   * This would run on a schedule to check pending payments
   */
  startAutomaticVerification(intervalMinutes = 15): void {
    console.log(`Starting automatic crypto payment verification every ${intervalMinutes} minutes`);
    
    setInterval(async () => {
      try {
        // Get all pending payments
        const pendingPayments = await storage.getPendingCryptoPayments();
        
        if (pendingPayments.length === 0) {
          return;
        }
        
        console.log(`Checking ${pendingPayments.length} pending crypto payments...`);
        
        // Verify each payment
        for (const payment of pendingPayments) {
          try {
            const verified = await this.verifyPayment(payment.id);
            if (verified) {
              console.log(`Payment ${payment.id} verified successfully!`);
            }
          } catch (error) {
            console.error(`Error verifying payment ${payment.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in automatic payment verification:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export const cryptoPaymentService = new CryptoPaymentService();