"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrievePaymentIntent = exports.createPaymentIntent = void 0;
// Stripe API client service
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
async function createPaymentIntent(params) {
    return stripe.paymentIntents.create(params);
}
exports.createPaymentIntent = createPaymentIntent;
async function retrievePaymentIntent(id) {
    return stripe.paymentIntents.retrieve(id);
}
exports.retrievePaymentIntent = retrievePaymentIntent;
// Add more Stripe endpoints as needed
//# sourceMappingURL=stripeService.js.map