import { type InvoiceDto, PAYMENT_METHOD_LABELS, type PaymentDto } from '@quoteflow/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';
import { useDeletePayment } from './use-invoices';

/** Recorded payments, newest first by date, each removable after confirmation. */
export function InvoicePaymentsCard({ invoice }: { invoice: InvoiceDto }) {
  const [pendingDelete, setPendingDelete] = useState<PaymentDto | null>(null);
  const mutation = useDeletePayment(invoice.id);
  const payments = [...invoice.payments].sort(
    (a, b) => b.paidAt.localeCompare(a.paidAt) || b.createdAt.localeCompare(a.createdAt),
  );
  const money = (amount: number) => formatMoney(amount, invoice.currency);

  function closeDialog() {
    setPendingDelete(null);
    mutation.reset();
  }

  return (
    <Card>
      <CardHeader
        title="Payments"
        description={
          payments.length === 0
            ? 'No payments recorded yet.'
            : `${money(invoice.amountPaid)} received in ${payments.length} ${payments.length === 1 ? 'payment' : 'payments'}.`
        }
      />
      {payments.length > 0 && (
        <div>
          <ul className="divide-y divide-zinc-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-950 tabular-nums">
                    {money(payment.amount)}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    {formatCalendarDate(payment.paidAt)} · {PAYMENT_METHOD_LABELS[payment.method]}
                  </p>
                  {payment.reference && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      Ref. {payment.reference}
                    </p>
                  )}
                  {payment.note && (
                    <p className="mt-0.5 text-xs text-pretty text-zinc-500">{payment.note}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete(payment)}
                  className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  <span className="sr-only">
                    Delete payment of {money(payment.amount)} on{' '}
                    {formatCalendarDate(payment.paidAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this payment?"
        description={
          pendingDelete && (
            <>
              The {money(pendingDelete.amount)} payment from{' '}
              {formatCalendarDate(pendingDelete.paidAt)} will be removed and the balance due will go
              up by the same amount.
            </>
          )
        }
        confirmLabel="Delete payment"
        pending={mutation.isPending}
        error={mutation.error ? getErrorMessage(mutation.error) : null}
        onCancel={closeDialog}
        onConfirm={() => {
          if (!pendingDelete) return;
          mutation.mutate(pendingDelete.id, { onSuccess: closeDialog });
        }}
      />
    </Card>
  );
}
