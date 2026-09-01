import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API, Addon, Cart, MillDay, Order, Review, Size, StatPoint } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  millToday() {
    return this.http.get<MillDay | null>(`${API}/mill/today`);
  }
  millOne(id: string) {
    return this.http.get<MillDay>(`${API}/mill/${id}`);
  }
  millReviews(id: string) {
    return this.http.get<Review[]>(`${API}/mill/${id}/reviews`);
  }
  addReview(id: string, body: { rating: number; body?: string }) {
    return this.http.post<Review>(`${API}/mill/${id}/reviews`, body);
  }
  sizes() {
    return this.http.get<{ items: Size[]; fromPriceCents: number }>(`${API}/sizes`);
  }
  size(slug: string) {
    return this.http.get<Size>(`${API}/sizes/${slug}`);
  }
  addons() {
    return this.http.get<Addon[]>(`${API}/addons`);
  }
  cart() {
    return this.http.get<Cart>(`${API}/cart`);
  }
  addCart(kind: string, refId: string, qty = 1) {
    return this.http.post<Cart>(`${API}/cart/items`, { kind, refId, qty });
  }
  patchCart(id: string, qty: number) {
    return this.http.patch<Cart>(`${API}/cart/items/${id}`, { qty });
  }
  removeCart(id: string) {
    return this.http.delete<Cart>(`${API}/cart/items/${id}`);
  }
  checkout(millDayId: string) {
    return this.http.post<Order>(`${API}/orders/checkout`, { millDayId, paymentNonce: 'mostrador' });
  }
  myOrders() {
    return this.http.get<Order[]>(`${API}/orders`);
  }
  myOrder(id: string) {
    return this.http.get<Order>(`${API}/orders/${id}`);
  }
  ticket(code: string) {
    return this.http.get<Order>(`${API}/orders/ticket/${code}`);
  }
  cancel(id: string) {
    return this.http.post<Order>(`${API}/orders/${id}/cancel`, {});
  }
  inbox() {
    return this.http.get<Array<{ id: string; kind: string; body: string; createdAt: string }>>(
      `${API}/account/inbox`,
    );
  }
  staffQueue() {
    return this.http.get<{ millDate: string; millDayId?: string; orders: Array<Partial<Order> & { id: string; code: string; status: string; totalCents: number; totalMl: number }> }>(
      `${API}/staff/queue`,
    );
  }
  staffStatus(id: string, status: string) {
    return this.http.patch<Order>(`${API}/staff/orders/${id}/status`, { status });
  }
  staffScan(codeOrUrl: string) {
    return this.http.post<Order>(`${API}/staff/scan`, { codeOrUrl });
  }
  adminStats() {
    return this.http.get<StatPoint[]>(`${API}/admin/stats`);
  }
  patchMill(id: string, body: Record<string, unknown>) {
    return this.http.patch<MillDay>(`${API}/admin/mill/${id}`, body);
  }
  patchAddonStock(id: string, stock: number) {
    return this.http.patch<Addon>(`${API}/admin/addons/${id}/stock`, { stock });
  }
}
