import type { ComponentType } from 'react';
import { createBrowserRouter, redirect, type RouteObject } from 'react-router';
import { PageLoader } from '@/components/PageLoader';
import { redirectSignedIn, requireSession } from '@/features/auth/route-guards';
import { paths } from './paths';
import { RootRoute } from './RootRoute';
import { RouteErrorBoundary } from './RouteErrorBoundary';

interface RouteModule {
  default: ComponentType;
}

/**
 * Loads a route's component on demand, so every layout and page ships as its
 * own chunk. This uses the `lazy()` function form on purpose: with the object
 * form, a failed component import (e.g. a chunk removed by a deploy) is
 * silently dropped by React Router instead of reaching the error boundary.
 */
function lazyComponent(load: () => Promise<RouteModule>): RouteObject['lazy'] {
  return async () => ({ Component: (await load()).default });
}

/** Catches errors from the pages below while keeping the surrounding layout on screen. */
function withErrorBoundary(children: RouteObject[]): RouteObject {
  return { ErrorBoundary: RouteErrorBoundary, children };
}

export const routes: RouteObject[] = [
  {
    Component: RootRoute,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: PageLoader,
    children: [
      {
        lazy: lazyComponent(() => import('@/components/layout/MarketingLayout')),
        children: [
          withErrorBoundary([
            { index: true, lazy: lazyComponent(() => import('@/pages/marketing/HomePage')) },
            {
              path: paths.features,
              lazy: lazyComponent(() => import('@/pages/marketing/FeaturesPage')),
            },
            {
              path: paths.solutions,
              lazy: lazyComponent(() => import('@/pages/marketing/SolutionsPage')),
            },
            {
              path: paths.howItWorks,
              lazy: lazyComponent(() => import('@/pages/marketing/HowItWorksPage')),
            },
            {
              path: paths.pricing,
              lazy: lazyComponent(() => import('@/pages/marketing/PricingPage')),
            },
            { path: paths.about, lazy: lazyComponent(() => import('@/pages/marketing/AboutPage')) },
            { path: paths.demo, lazy: lazyComponent(() => import('@/pages/marketing/DemoPage')) },
          ]),
        ],
      },
      {
        lazy: lazyComponent(() => import('@/components/layout/AuthLayout')),
        children: [
          withErrorBoundary([
            {
              path: paths.login,
              middleware: [redirectSignedIn],
              lazy: lazyComponent(() => import('@/pages/auth/LoginPage')),
            },
            {
              path: paths.register,
              middleware: [redirectSignedIn],
              lazy: lazyComponent(() => import('@/pages/auth/RegisterPage')),
            },
            {
              path: paths.forgotPassword,
              lazy: lazyComponent(() => import('@/pages/auth/ForgotPasswordPage')),
            },
          ]),
        ],
      },
      {
        middleware: [requireSession],
        lazy: lazyComponent(() => import('@/components/layout/AppLayout')),
        children: [
          withErrorBoundary([
            {
              path: paths.dashboard,
              lazy: lazyComponent(() => import('@/pages/dashboard/DashboardPage')),
            },
            {
              path: paths.customers,
              lazy: lazyComponent(() => import('@/pages/customers/CustomersPage')),
            },
            {
              path: '/customers/:customerId',
              lazy: lazyComponent(() => import('@/pages/customers/CustomerDetailPage')),
            },
            {
              path: paths.services,
              lazy: lazyComponent(() => import('@/pages/services/ServicesPage')),
            },
            { path: paths.quotes, lazy: lazyComponent(() => import('@/pages/quotes/QuotesPage')) },
            {
              path: paths.newQuote,
              lazy: lazyComponent(() => import('@/pages/quotes/NewQuotePage')),
            },
            {
              path: '/quotes/:quoteId',
              lazy: lazyComponent(() => import('@/pages/quotes/QuoteDetailPage')),
            },
            {
              path: '/quotes/:quoteId/edit',
              lazy: lazyComponent(() => import('@/pages/quotes/EditQuotePage')),
            },
            {
              path: paths.invoices,
              lazy: lazyComponent(() => import('@/pages/invoices/InvoicesPage')),
            },
            {
              path: paths.newInvoice,
              lazy: lazyComponent(() => import('@/pages/invoices/NewInvoicePage')),
            },
            {
              path: '/invoices/:invoiceId',
              lazy: lazyComponent(() => import('@/pages/invoices/InvoiceDetailPage')),
            },
            {
              path: '/invoices/:invoiceId/edit',
              lazy: lazyComponent(() => import('@/pages/invoices/EditInvoicePage')),
            },
            {
              path: paths.settings,
              lazy: lazyComponent(() => import('@/pages/settings/SettingsLayout')),
              children: [
                { index: true, loader: () => redirect(paths.businessSettings) },
                {
                  path: paths.businessSettings,
                  lazy: lazyComponent(() => import('@/pages/settings/BusinessSettingsPage')),
                },
                {
                  path: paths.accountSettings,
                  lazy: lazyComponent(() => import('@/pages/settings/AccountSettingsPage')),
                },
              ],
            },
          ]),
        ],
      },
      {
        lazy: lazyComponent(() => import('@/components/layout/PublicDocumentLayout')),
        children: [
          withErrorBoundary([
            {
              path: '/quote/:token',
              lazy: lazyComponent(() => import('@/pages/public/PublicQuotePage')),
            },
            {
              path: '/invoice/:token',
              lazy: lazyComponent(() => import('@/pages/public/PublicInvoicePage')),
            },
          ]),
        ],
      },
      { path: '*', lazy: lazyComponent(() => import('@/pages/NotFoundPage')) },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
