'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { priceQuote } from '@bace/shared';
import { api } from '@/lib/auth';
import { type ProjectRow } from '@/lib/crm';
import { compactMoney } from '@/lib/utils';

function QuoteBuilder() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const kind = search.get('kind') === 'proposal' ? 'proposal' : search.get('kind') === 'po' ? 'po' : 'quote';
  const label = kind === 'proposal' ? 'đề xuất' : kind === 'po' ? 'đơn hàng' : 'báo giá';
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState(98);
  const [people, setPeople] = useState(2);
  const [rate, setRate] = useState(1_000_000);
  const [error, setError] = useState('');
  const priced = useMemo(() => priceQuote({
    workingDays: days,
    freelancers: people,
    freelanceRate: rate,
    vpsDomain: 1_000_000,
    buffer: 20_000_000,
    commissionRate: 10,
    entertainmentRate: 10,
    otherRate: 8,
    profitMargin: 50,
  }), [days, people, rate]);

  useEffect(() => {
    api<ProjectRow>(`/opportunities/${params.id}`).then((row) => {
      setProject(row);
      setTitle(`${label[0].toUpperCase()}${label.slice(1)} ${row.name}`);
    }).catch((err: Error) => setError(err.message));
  }, [params.id, label]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    await api('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        opportunityId: params.id,
        title,
        kind,
        workingDays: days,
        freelancers: people,
        freelanceRate: rate,
        profitMargin: 50,
      }),
    });
    router.push(`/du-an/${params.id}`);
  }

  if (!project) return <p className="text-sm text-muted-foreground">{error || 'Đang tải dự án…'}</p>;

  return (
    <>
      <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/du-an/${project.id}`} className="hover:text-foreground">← Dự án</Link>
        <span className="font-medium text-foreground">Tạo {label}</span>
      </div>
      <h1 className="mb-2 font-display text-2xl font-bold">Tạo {label}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Dự án: <strong>{project.name}</strong> · KH: <strong>{project.customer}</strong></p>
      <form className="space-y-6" onSubmit={(event) => save(event).catch((err: Error) => setError(err.message))}>
        <section className="data-panel">
          <h2 className="mb-4 text-base font-semibold">1. Thông tin {label}</h2>
          <label className="block text-sm">Tiêu đề *<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm" /></label>
        </section>
        <section className="data-panel">
          <h2 className="mb-4 text-base font-semibold">2. Nhân sự và chi phí</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">Ngày công<input type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm" /></label>
            <label className="text-sm">Freelancer<input type="number" value={people} onChange={(event) => setPeople(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm" /></label>
            <label className="text-sm">Đơn giá<input type="number" value={rate} onChange={(event) => setRate(Number(event.target.value))} className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm" /></label>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
            <p>Nhân sự<br /><strong>{compactMoney(priced.personnelCost)}</strong></p>
            <p>Chi phí khác<br /><strong>{compactMoney(priced.otherCost)}</strong></p>
            <p>Tổng chi phí<br /><strong>{compactMoney(priced.totalCost)}</strong></p>
            <p>Giá bán<br /><strong className="text-primary">{compactMoney(priced.sellingPrice)}</strong></p>
          </div>
        </section>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Lưu {label}</button>
      </form>
    </>
  );
}

export default function CreateQuotePage() {
  return <Suspense><QuoteBuilder /></Suspense>;
}
