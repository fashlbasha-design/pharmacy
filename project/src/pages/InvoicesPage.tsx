import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, Search, Eye, Printer, Download, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { InvoicePrint } from '@/components/invoices/InvoicePrint';
import { fetchSales, fetchSaleById, fetchSettings } from '@/services/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Sale } from '@/types';

export function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', search],
    queryFn: () => fetchSales(undefined, search || undefined),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const filtered = useMemo(() => sales ?? [], [sales]);
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleView = async (sale: Sale) => {
    const full = await fetchSaleById(sale.id);
    setViewingSale(full);
    setModalOpen(true);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'width=800,height=600');
    if (!win) {
      toast.error('يرجى السماح بالنوافذ المنبثقة');
      return;
    }
    win.document.write(`
      <html dir="rtl"><head><title>فاتورة</title>
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700&display=swap" rel="stylesheet">
      </head><body>${printContents}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleDownloadPDF = () => {
    if (!viewingSale) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(22);
    doc.text(settings?.pharmacy_name ?? 'صيدلية الشفاء', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(settings?.address ?? '', 105, 28, { align: 'center' });
    doc.text(settings?.phone ?? '', 105, 34, { align: 'center' });

    doc.setFontSize(18);
    doc.text('فاتورة', 105, 48, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`رقم: ${viewingSale.invoice_number}`, 105, 56, { align: 'center' });
    doc.setFontSize(9);
    doc.text(formatDateTime(viewingSale.created_at), 105, 62, { align: 'center' });

    let y = 76;
    doc.setFontSize(10);
    doc.text(`العميل: ${viewingSale.customer?.name ?? 'عميل نقدي'}`, 20, y);
    y += 6;
    doc.text(`الكاشير: ${viewingSale.cashier_name ?? '—'}`, 20, y);
    y += 8;

    doc.setFillColor(22, 182, 124);
    doc.rect(15, y - 4, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('#', 20, y + 1);
    doc.text('المنتج', 35, y + 1);
    doc.text('الكمية', 120, y + 1);
    doc.text('السعر', 140, y + 1);
    doc.text('الإجمالي', 165, y + 1);
    y += 8;
    doc.setTextColor(0, 0, 0);

    viewingSale.sale_items?.forEach((item, i) => {
      doc.text(String(i + 1), 20, y);
      doc.text(item.product_name.substring(0, 40), 35, y);
      doc.text(String(item.quantity), 120, y);
      doc.text(item.unit_price.toFixed(2), 140, y);
      doc.text(item.total.toFixed(2), 165, y);
      y += 7;
    });

    y += 5;
    doc.text(`المجموع الفرعي: ${viewingSale.subtotal.toFixed(2)}`, 150, y);
    y += 6;
    if (viewingSale.discount > 0) {
      doc.text(`الخصم: -${viewingSale.discount.toFixed(2)}`, 150, y);
      y += 6;
    }
    doc.text(`الضريبة: ${viewingSale.tax.toFixed(2)}`, 150, y);
    y += 8;
    doc.setFontSize(14);
    doc.text(`الإجمالي: ${viewingSale.total.toFixed(2)} ${settings?.currency ?? 'ج.م'}`, 150, y);

    doc.setFontSize(9);
    doc.text('شكراً لتعاملكم معنا', 105, 280, { align: 'center' });

    doc.save(`فاتورة-${viewingSale.invoice_number}.pdf`);
    toast.success('تم تحميل الفاتورة');
  };

  const columns: Column<Sale>[] = [
    {
      key: 'invoice_number',
      header: 'رقم الفاتورة',
      render: (s) => <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{s.invoice_number}</span>,
    },
    {
      key: 'created_at',
      header: 'التاريخ',
      render: (s) => <span className="text-sm text-slate-600 dark:text-slate-400">{formatDateTime(s.created_at)}</span>,
    },
    {
      key: 'customer',
      header: 'العميل',
      render: (s) => <span className="text-sm">{s.customer?.name ?? 'عميل نقدي'}</span>,
    },
    {
      key: 'cashier_name',
      header: 'الكاشير',
      render: (s) => <span className="text-sm text-slate-600 dark:text-slate-400">{s.cashier_name ?? '—'}</span>,
    },
    {
      key: 'total',
      header: 'الإجمالي',
      render: (s) => <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(s.total)}</span>,
    },
    {
      key: 'payment_method',
      header: 'الدفع',
      render: (s) => (
        <Badge variant={s.payment_method === 'cash' ? 'success' : s.payment_method === 'card' ? 'info' : 'warning'}>
          {s.payment_method === 'cash' ? 'نقداً' : s.payment_method === 'card' ? 'فيزا' : 'محفظة'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (s) => <Badge variant={s.status === 'completed' ? 'success' : s.status === 'refunded' ? 'danger' : 'warning'}>{s.status === 'completed' ? 'مكتملة' : s.status === 'refunded' ? 'مرتجعة' : 'معلقة'}</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="الفواتير"
        description={`${total} فاتورة`}
        icon={<FileText className="h-5 w-5" />}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث برقم الفاتورة..."
            className="h-10 w-full rounded-xl border border-slate-300 bg-white pr-9 pl-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </motion.div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        emptyMessage="لا توجد فواتير"
        actions={(sale) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleView(sale)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
              title="عرض"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleView(sale).then(() => setTimeout(handlePrint, 300))}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/20"
              title="طباعة"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Invoice detail modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تفاصيل الفاتورة"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              <X className="h-4 w-4" />
              إغلاق
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
              تحميل PDF
            </Button>
          </>
        }
      >
        {viewingSale && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800">
            <InvoicePrint ref={printRef} sale={viewingSale} settings={settings ?? null} />
          </div>
        )}
      </Modal>
    </div>
  );
}
