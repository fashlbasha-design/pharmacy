import { forwardRef } from 'react';
import type { Sale, Settings } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Pill } from 'lucide-react';

interface InvoicePrintProps {
  sale: Sale;
  settings: Settings | null;
}

export const InvoicePrint = forwardRef<HTMLDivElement, InvoicePrintProps>(
  ({ sale, settings }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8 text-slate-900" style={{ direction: 'rtl' }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="logo" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600">
                <Pill className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{settings?.pharmacy_name ?? 'صيدلية الشفاء'}</h1>
              <p className="text-sm text-slate-600">{settings?.address ?? ''}</p>
              <p className="text-sm text-slate-600">{settings?.phone ?? ''}</p>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-3xl font-bold text-primary-600">فاتورة</h2>
            <p className="mt-1 font-mono text-lg">{sale.invoice_number}</p>
            <p className="text-sm text-slate-600">{formatDateTime(sale.created_at)}</p>
          </div>
        </div>

        {/* Customer + cashier info */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-500">العميل</h3>
            <p className="font-medium">{sale.customer?.name ?? 'عميل نقدي'}</p>
            {sale.customer?.phone && <p className="text-sm text-slate-600">{sale.customer.phone}</p>}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-500">الكاشير</h3>
            <p className="font-medium">{sale.cashier_name ?? '—'}</p>
            <p className="text-sm text-slate-600">
              طريقة الدفع: {sale.payment_method === 'cash' ? 'نقداً' : sale.payment_method === 'card' ? 'فيزا' : 'محفظة'}
            </p>
          </div>
        </div>

        {/* Items table */}
        <table className="mt-6 w-full">
          <thead>
            <tr className="border-b-2 border-slate-300 text-right">
              <th className="py-3 text-sm font-semibold">#</th>
              <th className="py-3 text-sm font-semibold">المنتج</th>
              <th className="py-3 text-sm font-semibold">الكمية</th>
              <th className="py-3 text-sm font-semibold">السعر</th>
              <th className="py-3 text-sm font-semibold">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sale.sale_items?.map((item, index) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="py-3 text-sm">{index + 1}</td>
                <td className="py-3 text-sm font-medium">{item.product_name}</td>
                <td className="py-3 text-sm">{item.quantity}</td>
                <td className="py-3 text-sm">{formatCurrency(item.unit_price)}</td>
                <td className="py-3 text-sm font-semibold">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-start">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">المجموع الفرعي</span>
              <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">الخصم</span>
                <span className="font-medium">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">الضريبة</span>
              <span className="font-medium">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-lg font-bold">
              <span>الإجمالي</span>
              <span className="text-primary-600">{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-500">شكراً لتعاملكم معنا</p>
          <p className="mt-1 text-xs text-slate-400">{settings?.email ?? ''}</p>
        </div>
      </div>
    );
  },
);
InvoicePrint.displayName = 'InvoicePrint';
