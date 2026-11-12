import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = /\/accounts\/(login|register|logout|token\/refresh)\//.test(originalRequest?.url || '');
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', response.data.access);
          if (response.data.refresh) localStorage.setItem('refresh_token', response.data.refresh);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('urbanthread:auth-expired'));
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/accounts/register/', data),
  login: (data) => api.post('/accounts/login/', data),
  logout: (refreshToken) => api.post('/accounts/logout/', { refresh: refreshToken }),
  refresh: (refreshToken) => api.post('/accounts/token/refresh/', { refresh: refreshToken }),
  getUsers: () => api.get('/accounts/allusers/'),
  getUser: () => api.get('/accounts/allusers/me/'),
  updateUser: (data) => api.patch('/accounts/allusers/me/', data),
  updateUserById: (id, data) => api.patch(`/accounts/allusers/${id}/`, data),
  getProfiles: () => api.get('/accounts/profile/'),
  createProfile: (data) => api.post('/accounts/profile/', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  updateProfile: (id, data) => api.patch(`/accounts/profile/${id}/`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  deleteProfile: (id) => api.delete(`/accounts/profile/${id}/`),
  getAddresses: () => api.get('/accounts/address/'),
  createAddress: (data) => api.post('/accounts/address/', data),
  updateAddress: (id, data) => api.patch(`/accounts/address/${id}/`, data),
  deleteAddress: (id) => api.delete(`/accounts/address/${id}/`),
};

export const productsAPI = {
  getCategories: (params) => api.get('/products/categories/', { params }),
  getCategory: (id) => api.get(`/products/categories/${id}/`),
  createCategory: (data) => api.post('/products/categories/', data),
  updateCategory: (id, data) => api.patch(`/products/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/products/categories/${id}/`),
  getBrands: (params) => api.get('/products/brands/', { params }),
  getBrand: (id) => api.get(`/products/brands/${id}/`),
  createBrand: (data) => api.post('/products/brands/', data),
  updateBrand: (id, data) => api.patch(`/products/brands/${id}/`, data),
  deleteBrand: (id) => api.delete(`/products/brands/${id}/`),
  getProducts: (params) => api.get('/products/products/', { params }),
  getProduct: (id) => api.get(`/products/products/${id}/`),
  createProduct: (data) => api.post('/products/products/', data),
  updateProduct: (id, data) => api.patch(`/products/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/products/${id}/`),
  getProductImages: (params) => api.get('/products/product-images/', { params }),
  createProductImage: (data) => api.post('/products/product-images/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProductImage: (id, data) => api.patch(`/products/product-images/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProductImage: (id) => api.delete(`/products/product-images/${id}/`),
  getSizes: () => api.get('/products/sizes/'),
  getColors: () => api.get('/products/colors/'),
  getBanners: () => api.get('/products/banners/'),
  createBanner: (data) => api.post('/products/banners/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBanner: (id, data) => api.patch(`/products/banners/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBanner: (id) => api.delete(`/products/banners/${id}/`),
  getStoreSettings: () => api.get('/products/store-settings/'),
  saveStoreSettings: (id, data) => id ? api.patch(`/products/store-settings/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }) : api.post('/products/store-settings/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getWishlist: () => api.get('/products/wishlist/'),
  addToWishlist: (product_id) => api.post('/products/wishlist/', { product_id }),
  removeFromWishlist: (id) => api.delete(`/products/wishlist/${id}/`),
};

export const cartAPI = {
  getCart: () => api.get('/cart/my_cart/'),
  addItem: (data) => api.post('/cart/add_item/', data).then((response) => { window.dispatchEvent(new Event('urbanthread:cart-updated')); return response; }),
  updateItem: (data) => api.patch('/cart/update_item/', data).then((response) => { window.dispatchEvent(new Event('urbanthread:cart-updated')); return response; }),
  removeItem: (itemId) => api.delete('/cart/remove_item/', { data: { item_id: itemId } }).then((response) => { window.dispatchEvent(new Event('urbanthread:cart-updated')); return response; }),
  clearCart: () => api.delete('/cart/clear_cart/').then((response) => { window.dispatchEvent(new Event('urbanthread:cart-updated')); return response; }),
};

export const ordersAPI = {
  createOrder: (data) => api.post('/orders/create_order/', data).then((response) => { window.dispatchEvent(new Event('urbanthread:cart-updated')); return response; }),
  getOrders: () => api.get('/orders/order_history/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel_order/`),
  exportSalesReport: (data) => api.post('/orders/export_sales_report/', data),
  getAdminDashboard: (params) => api.get('/orders/admin_dashboard/', { params }),
  getAdminOrders: (params) => api.get('/orders/admin_orders/', { params }),
  updateAdminOrderStatus: (id, order_status) => api.patch(`/orders/${id}/admin_update_status/`, { order_status }),
};

export const couponsAPI = {
  getCoupons: () => api.get('/coupons/'),
  getCoupon: (id) => api.get(`/coupons/${id}/`),
  createCoupon: (data) => api.post('/coupons/', data),
  updateCoupon: (id, data) => api.patch(`/coupons/${id}/`, data),
  deleteCoupon: (id) => api.delete(`/coupons/${id}/`),
  validateCoupon: (code) => api.post('/coupons/validate_coupon/', { code }),
};

export const paymentsAPI = {
  getAllPayments: () => api.get('/payments/'),
  getPayments: () => api.get('/payments/my_payments/'),
  getPayment: (id) => api.get(`/payments/${id}/`),
  initiatePayment: (data) => api.post('/payments/initiate/', data),
  refundPayment: (data) => api.post('/payments/refund/', data),
  getPaymentLogs: (id) => api.get(`/payments/${id}/logs/`),
};

export const inventoryAPI = {
  getInventory: (params) => api.get('/inventory/inventorys/', { params }),
  getInventoryItem: (id) => api.get(`/inventory/inventorys/${id}/`),
  createInventory: (data) => api.post('/inventory/inventorys/', data),
  updateInventory: (id, data) => api.patch(`/inventory/inventorys/${id}/`, data),
  deleteInventory: (id) => api.delete(`/inventory/inventorys/${id}/`),
  checkAvailability: (params) => api.get('/inventory/inventorys/check_availability/', { params }),
  getProductInventory: (params) => api.get('/inventory/inventorys/product_inventory/', { params }),
};

export const reviewsAPI = {
  getReviews: (params) => api.get('/reviews/', { params }),
  getReview: (id) => api.get(`/reviews/${id}/`),
  createReview: (data) => api.post('/reviews/', data),
  updateReview: (id, data) => api.patch(`/reviews/${id}/`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}/`),
};

export const getAllPages = async (request) => {
  const rows = [];
  let offset = 0;
  let hasNext = true;
  while (hasNext) {
    const { data } = await request({ limit: 100, offset });
    if (Array.isArray(data)) return data;
    const pageRows = data?.results || [];
    rows.push(...pageRows);
    hasNext = Boolean(data?.next && pageRows.length);
    offset += pageRows.length;
  }
  return rows;
};

export default api;
