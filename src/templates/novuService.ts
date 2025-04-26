// Novu API client service
import { Novu } from '@novu/node';

const novu = new Novu(process.env.NOVU_API_KEY!);

export async function sendNotification(params: any) {
  // Replace 'any' with actual params type as needed
  return novu.trigger('event-name', params);
}

export async function getNotifications() {
  return novu.messages.list();
}

// Add more Novu endpoints as needed
