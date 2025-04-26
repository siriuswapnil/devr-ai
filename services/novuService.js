"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = exports.sendNotification = void 0;
// Novu API client service
const node_1 = require("@novu/node");
const novu = new node_1.Novu(process.env.NOVU_API_KEY);
async function sendNotification(params) {
    // Replace 'any' with actual params type as needed
    return novu.trigger('event-name', params);
}
exports.sendNotification = sendNotification;
async function getNotifications() {
    return novu.notifications.list();
}
exports.getNotifications = getNotifications;
// Add more Novu endpoints as needed
//# sourceMappingURL=novuService.js.map