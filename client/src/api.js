const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';
function getToken() { return localStorage.getItem('south_token'); }

async function request(path, { method='GET', body, auth=true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) { const t = getToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export const api = {
  // auth
  register: (p) => request('/auth/register', { method:'POST', body:p, auth:false }),
  login:    (p) => request('/auth/login',    { method:'POST', body:p, auth:false }),
  me:       ()  => request('/auth/me'),
  // stores
  listStores:       ()  => request('/stores'),
  searchAll:        (q) => request(`/stores/search?q=${encodeURIComponent(q)}`),
  getStore:         (id) => request(`/stores/${id}`),
  getStoreProducts: (id, all) => request(`/stores/${id}/products${all?'?all=1':''}`),
  // seller
  getMyStore:     ()  => request('/stores/seller/mine'),
  applyStore:     (p) => request('/stores/seller/apply', { method:'POST', body:p }),
  updateMyStore:  (p) => request('/stores/seller/store', { method:'PUT', body:p }),
  addProduct:     (p) => request('/stores/seller/products', { method:'POST', body:p }),
  updateProduct:  (id,p) => request(`/stores/seller/products/${id}`, { method:'PUT', body:p }),
  deleteProduct:  (id) => request(`/stores/seller/products/${id}`, { method:'DELETE' }),
  // admin
  getPending:     ()  => request('/stores/admin/pending'),
  approveStore:   (id) => request(`/stores/admin/stores/${id}/approve`, { method:'POST' }),
  rejectStore:    (id,r) => request(`/stores/admin/stores/${id}/reject`, { method:'POST', body:{reason:r} }),
  approveProduct: (id) => request(`/stores/admin/products/${id}/approve`, { method:'POST' }),
  rejectProduct:  (id,r) => request(`/stores/admin/products/${id}/reject`, { method:'POST', body:{reason:r} }),
  // orders
  placeOrder:       (p) => request('/orders', { method:'POST', body:p }),
  myOrders:         ()  => request('/orders/mine'),
  availableOrders:  ()  => request('/orders/available'),
  activeDelivery:   ()  => request('/orders/driver/active'),
  driverHistory:    ()  => request('/orders/driver/history'),
  acceptOrder:      (id) => request(`/orders/${id}/accept`, { method:'POST' }),
  updateOrderStatus:(id,s) => request(`/orders/${id}/status`, { method:'PUT', body:{status:s} }),
  allOrders:        ()  => request('/orders'),
  sellerOrders:     ()  => request('/orders/seller'),
  getOrder:         (id) => request(`/orders/${id}`),
  // payment
  getPaymentSettings:  ()  => request('/payment/settings', { auth:false }),
  savePaymentSettings: (p) => request('/payment/settings', { method:'PUT', body:p }),
  submitReceipt:   (id,img) => request(`/payment/receipt/${id}`, { method:'POST', body:{receiptImage:img} }),
  getPendingPayments:  ()  => request('/payment/pending'),
  getReceipt:      (id) => request(`/payment/receipt/${id}`),
  verifyPayment:   (id) => request(`/payment/verify/${id}`, { method:'POST' }),
  rejectPayment:   (id,r) => request(`/payment/reject/${id}`, { method:'POST', body:{reason:r} }),
  // chat
  getConversations: ()  => request('/chat/conversations'),
  startConversation:(otherId,type,orderId) => request('/chat/conversations', { method:'POST', body:{otherUserId:otherId,type,orderId} }),
  getMessages:     (id) => request(`/chat/conversations/${id}/messages`),
  sendMessage:     (id,body) => request(`/chat/conversations/${id}/messages`, { method:'POST', body:{body} }),
  getUnreadCount:  ()  => request('/chat/unread'),
  getAdminContact: ()  => request('/chat/admin-contact'),
};
export { getToken };
