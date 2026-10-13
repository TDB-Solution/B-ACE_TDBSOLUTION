'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileDown, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/auth';
import { vnd } from '@/lib/utils';

type Line = { id?: string; moduleName: string; quantity: number; unitPrice: number; total?: number };

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  profitMargin: number;
  personnelCost: number;
  otherCost: number;
  totalCost: number;
  sellingPrice: number;
  customer: { name: string };
  opportunity: { id: string; name: string };
  items?: Line[];
};

const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const;
const LABEL: Record<string, string> = { draft: 'Nháp', sent: 'Đã gửi', accepted: 'Chấp nhận', rejected: 'Từ chối', expired: 'Hết hạn' };

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [margin, setMargin] = useState(50);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function load() {
    return api<Quote>(`/quotes/${params.id}`).then((row) => {
      setQuote(row);
      setMargin(Number(row.profitMargin) || 0);
      const items = (row.items || []).map((item) => ({
        id: item.id,
        moduleName: item.moduleName,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      }));
      setLines(items.length ? items : [{ moduleName: 'Hạng mục', quantity: 1, unitPrice: Number(row.totalCost) || 0 }]);
    });
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function setStatus(status: string) {
    await api(`/quotes/${params.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  async function saveLines() {
    const updated = await api<Quote>(`/quotes/${params.id}/items`, {
      method: 'PATCH',
      body: JSON.stringify({
        profitMargin: margin,
        items: lines.map((line) => ({
          moduleName: line.moduleName,
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0,
        })),
      }),
    });
    setQuote((current) => current ? { ...current, ...updated, items: updated.items } : current);
    setSaved(true);
  }

  const cost = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
  const price = Math.round(cost * (1 + (Number(margin) || 0) / 100));

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!quote) return <p className="text-sm text-muted-foreground">Đang tải báo giá…</p>;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={quote.opportunity ? `/du-an/${quote.opportunity.id}` : '/bao-gia'} className="text-xs text-muted-foreground">← Dự án</Link>
          <h1 className="mt-3 font-display text-[28px] font-bold">{quote.quoteNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{quote.title} · {quote.customer?.name} · {quote.opportunity?.name}</p>
        </div>
        <button type="button" onClick={() => printQuote(quote, lines, margin, price)} className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/40 bg-secondary px-4 text-sm font-medium text-primary">
          <FileDown size={16} /> Xuất PDF
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button key={status} type="button" onClick={() => setStatus(status).catch((err: Error) => setError(err.message))} className={quote.status === status ? 'rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground' : 'rounded-full border px-3 py-1 text-xs'}>
            {LABEL[status]}
          </button>
        ))}
      </div>
      <section className="data-panel mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Hạng mục</h2>
          <button type="button" onClick={() => setLines((current) => [...current, { moduleName: '', quantity: 1, unitPrice: 0 }])} className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs">
            <Plus size={14} /> Thêm dòng
          </button>
        </div>
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={line.id || index} className="grid grid-cols-[1fr_88px_140px_36px] gap-2">
              <input value={line.moduleName} onChange={(event) => updateLine(setLines, index, { moduleName: event.target.value })} className="h-10 rounded-md border border-input px-3 text-sm" placeholder="Tên hạng mục" />
              <input type="number" min={0} value={line.quantity} onChange={(event) => updateLine(setLines, index, { quantity: Number(event.target.value) })} className="h-10 rounded-md border border-input px-3 text-sm" />
              <input type="number" min={0} value={line.unitPrice} onChange={(event) => updateLine(setLines, index, { unitPrice: Number(event.target.value) })} className="h-10 rounded-md border border-input px-3 text-sm" />
              <button type="button" className="inline-flex items-center justify-center text-muted-foreground" onClick={() => setLines((current) => current.filter((_, item) => item !== index))}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
          <label className="text-xs text-muted-foreground">
            Biên lợi nhuận %
            <input type="number" min={0} value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="mt-1 block h-10 w-28 rounded-md border border-input px-3 text-sm text-foreground" />
          </label>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Chi phí {vnd(cost)}</p>
            <p className="mt-1 text-lg font-semibold text-primary">{vnd(price)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-success">Đã lưu hạng mục</span>}
          <button type="button" onClick={() => saveLines().catch((err: Error) => setError(err.message))} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Lưu hạng mục</button>
        </div>
      </section>
    </>
  );
}

function updateLine(setLines: React.Dispatch<React.SetStateAction<Line[]>>, index: number, patch: Partial<Line>) {
  setLines((current) => current.map((line, item) => (item === index ? { ...line, ...patch } : line)));
}

function printQuote(quote: Quote, lines: Line[], margin: number, price: number) {
  const rows = lines.map((line) => {
    const total = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
    return `<tr><td>${escapeHtml(line.moduleName)}</td><td>${line.quantity}</td><td>${vnd(Number(line.unitPrice) || 0)}</td><td>${vnd(total)}</td></tr>`;
  }).join('');
  const popup = window.open('', '_blank', 'noopener,width=900,height=700');
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(quote.quoteNumber)}</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; color: #1f2937; margin: 40px; }
      h1 { font-size: 28px; margin: 0; }
      .gold { color: #A8894A; }
      .bar { height: 4px; background: #C9A961; margin: 16px 0 24px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
      th { font-size: 11px; letter-spacing: .04em; color: #6b7280; }
      .total { margin-top: 20px; text-align: right; font-size: 20px; }
    </style></head><body>
    <p class="gold">B-ACE SME</p>
    <h1>${escapeHtml(quote.quoteNumber)}</h1>
    <p>${escapeHtml(quote.title)} · ${escapeHtml(quote.customer?.name || '')}</p>
    <div class="bar"></div>
    <table><thead><tr><th>HẠNG MỤC</th><th>SL</th><th>ĐƠN GIÁ</th><th>THÀNH TIỀN</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="total">Giá bán <strong class="gold">${vnd(price)}</strong><br><span style="font-size:12px;color:#6b7280">Biên ${margin}%</span></p>
    </body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
