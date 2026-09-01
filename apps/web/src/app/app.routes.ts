import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPageComponent) },
  { path: 'entrar', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPageComponent) },
  { path: 'registro', loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPageComponent) },
  { path: 'pedido/:code', loadComponent: () => import('./pages/public-order.page').then((m) => m.PublicOrderPageComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/home.page').then((m) => m.HomePageComponent) },
      { path: 'molienda', loadComponent: () => import('./pages/mill.page').then((m) => m.MillPageComponent) },
      { path: 'vasijas/:slug', loadComponent: () => import('./pages/size.page').then((m) => m.SizePageComponent) },
      { path: 'carrito', canActivate: [authGuard], loadComponent: () => import('./pages/cart.page').then((m) => m.CartPageComponent) },
      { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./pages/checkout.page').then((m) => m.CheckoutPageComponent) },
      { path: 'confirmacion/:code', canActivate: [authGuard], loadComponent: () => import('./pages/confirm.page').then((m) => m.ConfirmPageComponent) },
      { path: 'mis-pedidos', canActivate: [authGuard], loadComponent: () => import('./pages/orders.page').then((m) => m.OrdersPageComponent) },
      { path: 'mis-pedidos/:id', canActivate: [authGuard], loadComponent: () => import('./pages/order-detail.page').then((m) => m.OrderDetailPageComponent) },
      { path: 'cuenta', canActivate: [authGuard], loadComponent: () => import('./pages/account.page').then((m) => m.AccountPageComponent) },
      { path: 'staff', canActivate: [authGuard, roleGuard(['staff', 'admin'])], loadComponent: () => import('./pages/staff.page').then((m) => m.StaffPageComponent) },
      { path: 'staff/cola', canActivate: [authGuard, roleGuard(['staff', 'admin'])], loadComponent: () => import('./pages/staff-queue.page').then((m) => m.StaffQueuePageComponent) },
      { path: 'staff/scan', canActivate: [authGuard, roleGuard(['staff', 'admin'])], loadComponent: () => import('./pages/staff-scan.page').then((m) => m.StaffScanPageComponent) },
      { path: 'admin', canActivate: [authGuard, roleGuard(['admin'])], loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPageComponent) },
      { path: 'admin/remojo', canActivate: [authGuard, roleGuard(['admin'])], loadComponent: () => import('./pages/admin-mill.page').then((m) => m.AdminMillPageComponent) },
      { path: 'admin/stats', canActivate: [authGuard, roleGuard(['admin'])], loadComponent: () => import('./pages/admin-stats.page').then((m) => m.AdminStatsPageComponent) },
      { path: '**', loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPageComponent) },
    ],
  },
];
