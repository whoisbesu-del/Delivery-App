const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

function getToken() {
  return localStorage.getItem('relay_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Try again.');
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  // stores
  listStores: () => request('/stores'),
  getStore: (id) => request(`/stores/${id}`),
  getStoreItems: (id) => request(`/stores/${id}/items`),
  createStore: (payload) => request('/stores', { method: 'POST', body: payload }),
  updateStore: (id, payload) => request(`/stores/${id}`, { method: 'PUT', body: payload }),
  deleteStore: (id) => request(`/stores/${id}`, { method: 'DELETE' }),
  createItem: (storeId, payload) => request(`/stores/${storeId}/items`, { method: 'POST', body: payload }),
  updateItem: (itemId, payload) => request(`/stores/items/${itemId}`, { method: 'PUT', body: payload }),
  deleteItem: (itemId) => request(`/stores/items/${itemId}`, { method: 'DELETE' }),

  // orders
  placeOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  myOrders: () => request('/orders/mine'),
  availableOrders: () => request('/orders/available'),
  activeDelivery: () => request('/orders/driver/active'),
  driverHistory: () => request('/orders/driver/history'),
  acceptOrder: (id) => request(`/orders/${id}/accept`, { method: 'POST' }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: { status } }),
  allOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),

  // payment
  getPaymentSettings: () => request('/payment/settings', { auth: false }),
  savePaymentSettings: (payload) => request('/payment/settings', { method: 'PUT', body: payload }),
  submitReceipt: (orderId, receiptImage) => request(`/payment/receipt/${orderId}`, { method: 'POST', body: { receiptImage } }),
  getPendingPayments: () => request('/payment/pending'),
  getReceipt: (orderId) => request(`/payment/receipt/${orderId}`),
  verifyPayment: (orderId) => request(`/payment/verify/${orderId}`, { method: 'POST' }),
  rejectPayment: (orderId, reason) => request(`/payment/reject/${orderId}`, { method: 'POST', body: { reason } }),
};

export { getToken };
