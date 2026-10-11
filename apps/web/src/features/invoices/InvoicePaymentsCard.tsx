import { type InvoiceDto, PAYMENT_METHOD_LABELS, type PaymentDto } from '@quoteflow/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PanelCard } from '@/components/ui/PanelCard';
import { getErrorMessage } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';
import { PAYMENT_METHOD_ICONS } from './payment-methods';
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
    <>
      <PanelCard
        title="Payments"
        description={
          payments.length === 0
            ? 'Nothing recorded yet. When the customer pays you, record it here.'
            : `${money(invoice.amountPaid)} received in ${payments.length} ${payments.length === 1 ? 'payment' : 'payments'}.`
        }
        className={payments.length > 0 ? 'pb-1' : undefined}
      >
        {payments.length > 0 && (
          <ul className="-mx-5 divide-y divide-dashed divide-line-strong border-t border-line">
            {payments.map((payment) => {
              const Icon = PAYMENT_METHOD_ICONS[payment.method];
              return (
                <li key={payment.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accepted-tint text-accepted">
                    <Icon aria-hidden="true" className="size-4" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="money text-[14px] text-ink">{money(payment.amount)}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {formatCalendarDate(payment.paidAt)} · {PAYMENT_METHOD_LABELS[payment.method]}
                    </p>
                    {payment.reference && (
                      <p className="mt-0.5 truncate text-[12.5px] text-muted">
                        Ref. <span className="font-mono">{payment.reference}</span>
                      </p>
                    )}
                    {payment.note && (
                      <p className="mt-1 text-[12.5px] text-pretty text-ink-2">{payment.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(payment)}
                    className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] text-muted transition-colors hover:bg-danger-tint hover:text-danger"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    <span className="sr-only">
                      Delete payment of {money(payment.amount)} on{' '}
                      {formatCalendarDate(payment.paidAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PanelCard>
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
    </>
  );
}
