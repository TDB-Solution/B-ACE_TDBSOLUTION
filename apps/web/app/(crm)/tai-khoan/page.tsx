'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, useAuth } from '@/lib/auth';
import { initials, roleLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const { session } = useAuth();
  const [name, setName] = useState(session?.user.name || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ name: string; phone: string | null }>('/auth/me')
      .then((me) => {
        setName(me.name);
        setPhone(me.phone || '');
      })
      .catch(() => undefined);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    await api('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, phone, ...(password ? { password } : {}) }),
    });
    setPassword('');
    setSaved(true);
  }

  if (!session) return null;

  return (
    <>
      <h1 className="font-display text-[28px] font-bold">Tài khoản của tôi</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Cập nhật thông tin đăng nhập nội bộ.</p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={(event) => save(event).catch((err: Error) => setError(err.message))} className="data-panel mt-6 max-w-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="avatar-initials avatar-profile inline-flex size-12 items-center justify-center rounded-full font-semibold">{initials(name || session.user.name)}</span>
          <div>
            <p className="font-semibold">{session.user.email}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(session.user.role)}</p>
          </div>
        </div>
        <div className="grid gap-3">
          <label className="text-xs font-medium">Họ tên<Input className="mt-1" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="text-xs font-medium">Điện thoại<Input className="mt-1" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label className="text-xs font-medium">Mật khẩu mới<Input className="mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Để trống nếu không đổi" /></label>
        </div>
        <Button className="mt-4" type="submit">Cập nhật</Button>
        {saved && <p className="mt-3 text-sm text-success">Đã lưu vào cơ sở dữ liệu.</p>}
      </form>
    </>
  );
}
