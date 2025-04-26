// Stripe API client service
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' });

export async function createPaymentIntent(params: Stripe.PaymentIntentCreateParams) {
  return stripe.paymentIntents.create(params);
}

export async function retrievePaymentIntent(id: string) {
  return stripe.paymentIntents.retrieve(id);
}

// Add more Stripe endpoints as needed
