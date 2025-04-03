import { Router } from 'express';
import Stripe from 'stripe';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY - Stripe payment functionality will not work');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const router = Router();

// Ensure user is authenticated
const ensureAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// One-time payment intent for Pay-Per-View content
router.post('/create-payment-intent', ensureAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const { amount, contentType, contentId } = req.body;
    
    if (!amount || amount < 100) { // Minimum 1.00 in cents
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    if (!contentType || !contentId) {
      return res.status(400).json({ message: 'Content information is required' });
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'eur',
      metadata: {
        userId: req.user.id.toString(),
        contentType,
        contentId: contentId.toString()
      }
    });

    // Return the client secret to the client
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Error creating payment intent: ' + error.message });
  }
});

// Create a subscription payment (for premium access)
router.post('/create-subscription', ensureAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const { paymentMethodId, premiumPlan } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    
    if (!premiumPlan || !['daily', 'monthly', 'annual'].includes(premiumPlan)) {
      return res.status(400).json({ message: 'Valid premium plan is required' });
    }

    const user = req.user;
    let customerId = user.stripeCustomerId;

    // If user doesn't have a Stripe customer ID, create one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || `user-${user.id}@streamhive.example`,
        name: user.username,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      customerId = customer.id;
      // Update user with Stripe customer ID
      await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
    } else {
      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Determine price ID based on plan
    // These would be configured in your Stripe dashboard
    let priceId;
    switch (premiumPlan) {
      case 'daily':
        priceId = process.env.STRIPE_PRICE_DAILY;
        break;
      case 'monthly':
        priceId = process.env.STRIPE_PRICE_MONTHLY;
        break;
      case 'annual':
        priceId = process.env.STRIPE_PRICE_ANNUAL;
        break;
      default:
        return res.status(400).json({ message: 'Invalid premium plan' });
    }

    if (!priceId) {
      return res.status(500).json({ message: `Price ID for ${premiumPlan} plan is not configured` });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id.toString(),
        premiumPlan
      }
    });

    // Update user with subscription ID
    await storage.updateUserStripeInfo(user.id, {
      stripeSubscriptionId: subscription.id,
    });

    // Return the client secret for the initial payment
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription: ' + error.message });
  }
});

// Webhook endpoint to handle Stripe events
router.post('/webhook', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: 'Stripe signature or webhook secret missing' });
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }

    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ message: 'Error handling webhook: ' + error.message });
  }
});

// Confirm payment status endpoint
router.get('/payment-status/:paymentIntentId', ensureAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if the payment intent belongs to the user
    if (paymentIntent.metadata.userId !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      contentType: paymentIntent.metadata.contentType,
      contentId: paymentIntent.metadata.contentId
    });
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Error checking payment status: ' + error.message });
  }
});

// Cancel subscription endpoint
router.post('/cancel-subscription', ensureAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel at period end to avoid prorated charges
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Error canceling subscription: ' + error.message });
  }
});

// Private webhook handler functions
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle successful one-time payment for PPV content
  const { userId, contentType, contentId } = paymentIntent.metadata;
  
  if (userId && contentType && contentId) {
    // Create PPV purchase record
    try {
      // Calculate expiry date (e.g., 48 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);
      
      await storage.createPPVPurchase({
        userId: parseInt(userId),
        contentType,
        contentId: parseInt(contentId),
        amount: paymentIntent.amount / 100, // Convert cents to euros
        paymentMethod: 'stripe',
        paymentId: paymentIntent.id,
        status: 'completed',
        isActive: true,
        expiresAt
      });
      
      console.log(`PPV purchase created for user ${userId}, content: ${contentType}/${contentId}`);
    } catch (error) {
      console.error('Error creating PPV purchase record:', error);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Log failed payment attempts
  console.log(`Payment failed for PaymentIntent: ${paymentIntent.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe?.subscriptions.retrieve(invoice.subscription as string);
    if (!subscription) return;
    
    const { userId, premiumPlan } = subscription.metadata;
    if (!userId || !premiumPlan) return;
    
    // Calculate premium expiry based on plan
    const now = new Date();
    let expiresAt: Date;
    
    switch (premiumPlan) {
      case 'daily':
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        break;
      case 'monthly':
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
      case 'annual':
        expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      default:
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1); // Default to 1 month
    }
    
    // Update user's premium status
    await storage.updateUserSubscription(parseInt(userId), {
      isPremium: true,
      premiumTier: premiumPlan,
      premiumExpiresAt: expiresAt
    });
    
    console.log(`Premium subscription activated for user ${userId}, plan: ${premiumPlan}, expires: ${expiresAt}`);
  } catch (error) {
    console.error('Error processing invoice payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed subscription payment
  try {
    if (!invoice.subscription) return;
    
    const subscription = await stripe?.subscriptions.retrieve(invoice.subscription as string);
    if (!subscription) return;
    
    const { userId } = subscription.metadata;
    if (!userId) return;
    
    // Check if this is a recurring payment failure (not the initial one)
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      // Deactivate premium status
      await storage.updateUserSubscription(parseInt(userId), {
        isPremium: false
      });
      
      console.log(`Premium subscription deactivated for user ${userId} due to payment failure`);
    }
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Subscription creation is handled by invoice.payment_succeeded event
  console.log(`Subscription created: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { userId } = subscription.metadata;
    if (!userId) return;
    
    if (subscription.cancel_at_period_end) {
      console.log(`Subscription ${subscription.id} for user ${userId} will cancel at period end`);
    } else if (subscription.status === 'active' && subscription.current_period_end) {
      // Update expiry date based on the current period end
      const expiresAt = new Date(subscription.current_period_end * 1000);
      
      await storage.updateUserSubscription(parseInt(userId), {
        isPremium: true,
        premiumExpiresAt: expiresAt
      });
      
      console.log(`Updated premium expiry for user ${userId} to ${expiresAt}`);
    } else if (subscription.status !== 'active') {
      // Handle non-active status (paused, incomplete, etc.)
      await storage.updateUserSubscription(parseInt(userId), {
        isPremium: false
      });
      
      console.log(`Deactivated premium for user ${userId} due to subscription status: ${subscription.status}`);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const { userId } = subscription.metadata;
    if (!userId) return;
    
    // Deactivate premium status
    await storage.updateUserSubscription(parseInt(userId), {
      isPremium: false
    });
    
    console.log(`Premium subscription deleted for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

export default router;