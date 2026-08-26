import type { User } from './types';

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${API_BASE}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Support blob responses (for file downloads)
    const contentType = response.headers.get('Content-Type') || '';
    let data: any;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/csv') || contentType.includes('application/pdf') || contentType.includes('application/vnd')) {
      data = await response.blob();
    } else {
      data = await response.json();
    }

    if (!response.ok) {
      const error = new Error(data?.message || 'API request failed') as any;
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Helper to download a blob response
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ---- Auth ----
interface AuthResponse {
  success: boolean;
  data: { user: User; accessToken: string; refreshToken: string };
  message?: string;
}

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  verifyOtp: (data: { email: string; otp: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/verify-otp', data),
  forgotPassword: (data: { email: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password', data),
  resetPassword: (data: { email: string; otp: string; password: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', data),
  getMe: () => api.get<{ success: boolean; data: User }>('/auth/me'),
  oauthConfig: () =>
    api.get<{ success: boolean; data: { googleEnabled: boolean; githubEnabled: boolean } }>('/auth/oauth-config'),
  googleLogin: (code: string) => api.post<AuthResponse>('/auth/google', { code }),
  githubLogin: (code: string) => api.post<AuthResponse>('/auth/github', { code }),
};

// ---- Events ----
interface EventResponse {
  success: boolean;
  data: any;
  message?: string;
  pagination?: any;
}

export const eventsApi = {
  getAll: (params?: Record<string, string>) => api.get<EventResponse>('/events', params),
  getById: (id: string) => api.get<EventResponse>(`/events/${id}`),
  create: (data: any) => api.post<EventResponse>('/events', data),
  update: (id: string, data: any) => api.put<EventResponse>(`/events/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message?: string }>(`/events/${id}`),
  duplicate: (id: string) => api.post<EventResponse>(`/events/${id}/duplicate`),
  publish: (id: string) => api.patch<EventResponse>(`/events/${id}/publish`),
  cancel: (id: string) => api.patch<EventResponse>(`/events/${id}/cancel`),
  feature: (id: string) => api.patch<EventResponse>(`/events/${id}/feature`),
  getByOrganizer: (organizerId: string) => api.get<EventResponse>(`/events/organizer/${organizerId}`),
};

// ---- Tickets ----
export const ticketsApi = {
  getByEvent: (eventId: string) => api.get<{ success: boolean; data: any[] }>(`/tickets/event/${eventId}`),
  create: (data: any) => api.post<{ success: boolean; data: any }>('/tickets', data),
  update: (id: string, data: any) => api.put<{ success: boolean; data: any }>(`/tickets/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message?: string }>(`/tickets/${id}`),
};

// ---- Registrations ----
export const registrationsApi = {
  getMy: (params?: Record<string, string>) => api.get('/registrations/my', params),
  getByEvent: (eventId: string, params?: Record<string, string>) => api.get(`/registrations/event/${eventId}`, params),
  create: (data: any) => api.post('/registrations', data),
  cancel: (id: string, reason?: string) => api.patch(`/registrations/${id}/cancel`, { reason }),
  checkin: (id: string) => api.patch(`/registrations/${id}/checkin`),
  approve: (id: string) => api.patch(`/registrations/${id}/approve`),
  reject: (id: string, reason?: string) => api.patch(`/registrations/${id}/reject`, { reason }),
};

// ---- Payments ----
export const paymentsApi = {
  getMy: () => api.get('/payments/my'),
  getAll: (params?: Record<string, string>) => api.get('/payments', params),
  createIntent: (data: any) => api.post('/payments/create-payment-intent', data),
  createRazorpayOrder: (data: any) => api.post('/payments/create-razorpay-order', data),
  verify: (data: any) => api.post('/payments/verify', data),
  refund: (id: string, data?: any) => api.post(`/payments/${id}/refund`, data),
};

// ---- Users ----
export const usersApi = {
  getAll: (params?: Record<string, string>) => api.get('/users', params),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
};

// ---- Venues ----
export const venuesApi = {
  getAll: (params?: Record<string, string>) => api.get('/venues', params),
  getById: (id: string) => api.get(`/venues/${id}`),
  create: (data: any) => api.post('/venues', data),
  update: (id: string, data: any) => api.put(`/venues/${id}`, data),
  delete: (id: string) => api.delete(`/venues/${id}`),
};

// ---- Wallet ----
export const walletApi = {
  getMe: () => api.get('/wallet/me'),
  credit: (data: { userId: string; amount: number; description: string; reference?: string }) =>
    api.post('/wallet/credit', data),
  debit: (data: { amount: number; description: string; reference?: string }) =>
    api.post('/wallet/debit', data),
  getAll: () => api.get('/wallet'),
};

// ---- Coupons ----
export const couponsApi = {
  getAll: (params?: Record<string, string>) => api.get('/coupons', params),
  validate: (code: string, event?: string, amount?: number) =>
    api.get('/coupons/validate', { code, ...(event ? { event } : {}), ...(amount ? { amount: String(amount) } : {}) }),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

// ---- Sponsors ----
export const sponsorsApi = {
  getByEvent: (eventId: string) => api.get(`/sponsors/event/${eventId}`),
  getAll: () => api.get('/sponsors'),
  create: (data: any) => api.post('/sponsors', data),
  update: (id: string, data: any) => api.put(`/sponsors/${id}`, data),
  delete: (id: string) => api.delete(`/sponsors/${id}`),
};

// ---- Notifications ----
export const notificationsApi = {
  getAll: (params?: Record<string, string>) => api.get('/notifications', params),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

// ---- Chat ----
export const chatApi = {
  getMessages: (chatRoom: string, params?: Record<string, string>) => api.get(`/chat/${chatRoom}`, params),
  sendMessage: (data: any) => api.post('/chat', data),
  markAsRead: (id: string) => api.patch(`/chat/${id}/read`),
  getRooms: () => api.get('/chat/rooms'),
  createDirect: (participantId: string) => api.post('/chat/direct', { participantId }),
  getEventRoom: (eventId: string) => api.get(`/chat/event/${eventId}`),
};

// ---- Certificates ----
export const certificatesApi = {
  getMy: () => api.get('/certificates/my'),
  getByEvent: (eventId: string) => api.get(`/certificates/event/${eventId}`),
  generate: (data: { registrationId: string }) => api.post('/certificates/generate', data),
  verify: (certificateId: string) => api.get(`/certificates/verify/${certificateId}`),
  download: (certificateId: string) => api.get(`/certificates/${certificateId}/download`),
  exportByEvent: (eventId: string) => api.get(`/certificates/event/${eventId}/export`),
};

// ---- Analytics ----
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: () => api.get('/analytics/revenue'),
  getRegistrations: () => api.get('/analytics/registrations'),
  getEvents: () => api.get('/analytics/events'),
  getTopEvents: () => api.get('/analytics/top-events'),
};

// ---- Search ----
export const searchApi = {
  search: (q: string, type?: string) => api.get('/search', { q, ...(type ? { type } : {}) }),
};

// ---- Sessions ----
export const sessionsApi = {
  getByEvent: (eventId: string) => api.get(`/sessions/event/${eventId}`),
  getById: (id: string) => api.get(`/sessions/${id}`),
  create: (data: any) => api.post('/sessions', data),
  update: (id: string, data: any) => api.put(`/sessions/${id}`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

// ---- Waitlist ----
export const waitlistApi = {
  join: (eventId: string, ticketType?: string) => api.post('/waitlist/join', { event: eventId, ticketType }),
  getMy: () => api.get('/waitlist/my'),
  getByEvent: (eventId: string) => api.get(`/waitlist/event/${eventId}`),
  promote: (id: string) => api.post(`/waitlist/${id}/promote`),
  leave: (id: string) => api.delete(`/waitlist/${id}`),
};

// ---- Reviews ----
export const reviewsApi = {
  getByEvent: (eventId: string) => api.get<{ success: boolean; data: any[] }>(`/reviews/event/${eventId}`),
  create: (data: any) => api.post<{ success: boolean; data: any }>('/reviews', data),
  update: (id: string, data: any) => api.put<{ success: boolean; data: any }>(`/reviews/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message?: string }>(`/reviews/${id}`),
};

// ---- Reports ----
export const reportsApi = {
  getSummary: () => api.get('/reports/summary'),
  exportEvents: (format: 'csv' | 'xlsx' | 'pdf' = 'csv') => api.get(`/reports/events/export?format=${format}`),
  exportRegistrations: (format: 'csv' | 'xlsx' | 'pdf' = 'csv') => api.get(`/reports/registrations/export?format=${format}`),
  exportPayments: (format: 'csv' | 'xlsx' | 'pdf' = 'csv') => api.get(`/reports/payments/export?format=${format}`),
};

// ---- Upload ----
export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${api.getToken()}`,
      },
      body: formData,
    }).then((r) => r.json());
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return fetch(`${API_BASE}/upload/multiple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${api.getToken()}`,
      },
      body: formData,
    }).then((r) => r.json());
  },
};

// ---- AI ----
export const aiApi = {
  recommendations: (limit?: number) => api.get('/ai/recommendations', { limit: String(limit || 6) }),
  speakers: (category?: string) => api.get('/ai/speakers', category ? { category } : undefined),
  networking: (limit?: number) => api.get('/ai/networking', { limit: String(limit || 5) }),
  chat: (message: string) => api.post('/ai/chat', { message }),
  email: (data: any) => api.post('/ai/email', data),
  sentiment: (text: string) => api.post('/ai/sentiment', { text }),
  summary: (eventId: string) => api.get(`/ai/summary/${eventId}`),
  spam: (text: string) => api.post('/ai/spam', { text }),
};

// ---- Blockchain ----
export const blockchainApi = {
  mintTicket: (data: { userAddress: string; eventName: string; ticketId: string }) =>
    api.post('/blockchain/mint-ticket', data),
  verifyCertificate: (certificateId: string) =>
    api.post('/blockchain/verify-certificate', { certificateId }),
  distributeRewards: (data: { userAddresses: string[]; amount: number; eventId?: number }) =>
    api.post('/blockchain/distribute-rewards', data),
  recordAttendance: (data: { eventId: string; userAddress: string }) =>
    api.post('/blockchain/record-attendance', data),
  transactions: (userAddress: string) =>
    api.get(`/blockchain/transactions/${userAddress}`),
};

