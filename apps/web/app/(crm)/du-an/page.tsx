'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/auth';
import { type CustomerRow, type ProjectRow, type StageRow } from '@/lib/crm';
import { compactMoney } from '@/lib/utils';

const STATUS: Record<string, string> = { open: 'Đang mở', won: 'Thắng', lost: 'Thua' };

export default function ProjectsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [stages, setStages] = useState<StageRow[]>([]);
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline');
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [lost, setLost] = useState<{ id: string; stageId: string } | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function load() {
    return api<ProjectRow[]>('/opportunities').then(setRows);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
    api<CustomerRow[]>('/customers').then(setCustomers).catch(() => setCustomers([]));
    api<StageRow[]>('/opportunities/stages').then(setStages).catch(() => setStages([]));
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const created = await api<ProjectRow>('/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        name: String(data.get('name') || ''),
        customerId: String(data.get('customerId') || ''),
        stageId: String(data.get('stageId') || ''),
        value: Number(data.get('value') || 0),
        probability: Number(data.get('probability') || 0),
        expectedCloseDate: String(data.get('closeDate') || ''),
      }),
    });
    router.push(`/du-an/${created.id}`);
  }

  async function move(id: string, stageId: string, lostReason?: string) {
    const stage = stages.find((item) => item.id === stageId);
    if (stage?.isLost && !lostReason?.trim()) {
      setLost({ id, stageId });
      setReason('');
      return;
    }
    const updated = await api<ProjectRow>(`/opportunities/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stageId, lostReason }),
    });
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...updated } : row)));
    setLost(null);
  }

  function dropOn(stageId: string) {
    const id = dragId;
    setOver(null);
    setDragId(null);
    if (!id) return;
    const project = rows.find((row) => row.id === id);
    if (!project || project.stageId === stageId) return;
    move(id, stageId).catch((err: Error) => setError(err.message));
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-bold">Dự án</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Kéo thẻ sang giai đoạn mới, hoặc mở hồ sơ để xem báo giá và tệp.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
            <button type="button" onClick={() => setView('pipeline')} className={view === 'pipeline' ? 'rounded-full bg-primary px-3 py-1.5 text-primary-foreground' : 'rounded-full px-3 py-1.5 text-muted-foreground'}>Pipeline</button>
            <button type="button" onClick={() => setView('list')} className={view === 'list' ? 'rounded-full bg-primary px-3 py-1.5 text-primary-foreground' : 'rounded-full px-3 py-1.5 text-muted-foreground'}>Danh sách</button>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Thêm dự án</button>
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      {view === 'pipeline' ? (
        <div className="kanban-board">
          {stages.map((stage) => {
            const cards = rows.filter((row) => row.stageId === stage.id || (!row.stageId && row.stage === stage.name));
            return (
              <section
                key={stage.id}
                className={over === stage.id ? 'kanban-col over' : 'kanban-col'}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOver(stage.id);
                }}
                onDragLeave={() => setOver((current) => (current === stage.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  dropOn(stage.id);
                }}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold" style={{ color: stage.color }}>{stage.name}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-muted-foreground">{cards.length}</span>
                </header>
                <div className="space-y-2">
                  {cards.map((project) => (
                    <article
                      key={project.id}
                      draggable
                      onDragStart={() => setDragId(project.id)}
                      onDragEnd={() => { setDragId(null); setOver(null); }}
                      onClick={() => router.push(`/du-an/${project.id}`)}
                      className={dragId === project.id ? 'kanban-card dragging' : 'kanban-card'}
                    >
                      <p className="text-sm font-semibold">{project.name}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{project.customer}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-medium">{compactMoney(project.value)}</span>
                        <span className="text-muted-foreground">{project.probability}%</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((project) => (
            <button key={project.id} type="button" onClick={() => router.push(`/du-an/${project.id}`)} className="project-card rounded-2xl border border-border bg-card p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{project.name}</p>
                <span className="stage-badge" style={{ background: `${project.stageColor}20`, color: project.stageColor }}>{project.stage}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{project.customer}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium">{compactMoney(project.value)}</span>
                <span className="text-xs text-muted-foreground">{STATUS[project.status]} · {project.closeDate || 'Chưa chốt'}</span>
              </div>
            </button>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dự án.</p>}
        </div>
      )}
      {lost && (
        <>
          <div className="modal-backdrop" onClick={() => setLost(null)} />
          <div className="modal-card">
            <h2 className="text-base font-semibold">Vì sao thua?</h2>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Giá, thời điểm, đối thủ, khách dừng..." className="mt-4 h-24 w-full rounded-md border border-input p-3 text-sm" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setLost(null)} className="h-9 rounded-md border px-4 text-sm">Hủy</button>
              <button type="button" onClick={() => move(lost.id, lost.stageId, reason).catch((err: Error) => setError(err.message))} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground">Lưu</button>
            </div>
          </div>
        </>
      )}
      {open && (
        <>
          <div className="modal-backdrop" onClick={() => setOpen(false)} />
          <form className="modal-card" onSubmit={(event) => create(event).catch((err: Error) => setError(err.message))}>
            <h2 className="text-base font-semibold">Thêm dự án</h2>
            <div className="mt-4 grid gap-3">
              <input name="name" required className="h-10 rounded-md border border-input px-3 text-sm" placeholder="Tên dự án" />
              <select name="customerId" required className="crm-select">
                <option value="">Chọn khách hàng</option>
                {customers.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
              </select>
              <select name="stageId" className="crm-select">
                {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input name="value" className="h-10 rounded-md border border-input px-3 text-sm" placeholder="Giá trị" defaultValue="0" />
                <input name="probability" className="h-10 rounded-md border border-input px-3 text-sm" placeholder="Xác suất %" defaultValue="10" />
              </div>
              <input name="closeDate" type="date" className="h-10 rounded-md border border-input px-3 text-sm" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md border px-4 text-sm">Hủy</button>
                <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground">Lưu</button>
              </div>
            </div>
          </form>
        </>
      )}
    </>
  );
}
