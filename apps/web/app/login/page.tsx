'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, FileText, KeyRound, Layers3, Lock, LogIn, Mail, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import '../login.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@b-ace.vn');
  const [password, setPassword] = useState('password');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đăng nhập được');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-grid">
      <aside className="hero-side hero-bg">
        <div className="hero-content">
          <div className="hero-brand">
            <div className="hero-brand-icon"><Layers3 size={24} color="#1F2937" /></div>
            <div className="hero-brand-name">B-ACE<span>SME</span></div>
          </div>
          <h1 className="hero-title">
            Quản lý khách hàng<br />
            <span className="hero-title-gradient">thông minh hơn</span>
          </h1>
          <p className="hero-subtitle">
            Nền tảng CRM được thiết kế riêng cho doanh nghiệp SME Việt Nam. Theo dõi lead, quản lý cơ hội, và chốt deal nhanh hơn.
          </p>
          <div className="hero-features">
            <Feature icon={<Users size={20} />} title="Quản lý tập trung" text="Khách hàng, dự án, báo giá — tất cả trong một nơi" />
            <Feature icon={<TrendingUp size={20} />} title="Theo dõi pipeline" text="Biết ngay cơ hội nào sắp chốt, deal nào cần đẩy" />
            <Feature icon={<FileText size={20} />} title="Báo giá tự động" text="Tạo báo giá chuyên nghiệp trong vài phút" />
          </div>
        </div>
        <div className="hero-footer">
          <span>© {new Date().getFullYear()} B-ACE</span>
          <span className="dot">·</span>
          <span>Phiên bản nội bộ</span>
        </div>
      </aside>
      <main className="form-side">
        <div className="form-inner">
          <div className="mobile-logo">
            <div className="mobile-logo-icon"><Layers3 size={20} color="#fff" /></div>
            <span className="mobile-logo-name">B-ACE</span>
          </div>
          <div className="form-header">
            <h2 className="form-title">Đăng nhập</h2>
            <p className="form-subtitle">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
          </div>
          {error && (
            <div className="form-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div className="input-wrap">
                <Mail className="icon" size={16} />
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@congty.com" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Mật khẩu</label>
              <div className="input-wrap">
                <Lock className="icon" size={16} />
                <input id="password" type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required style={{ paddingRight: 44 }} />
                <button type="button" className="pwd-toggle" onClick={() => setShow((value) => !value)} aria-label="Hiện mật khẩu">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-row">
              <label className="cbx">
                <input type="checkbox" defaultChecked />
                <span className="box"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg></span>
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <span className="form-forgot">Quên mật khẩu?</span>
            </div>
            <button className="btn-submit" type="submit" disabled={pending}>
              <LogIn size={16} />
              {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>
          <div className="demo-box">
            <div className="demo-box-icon"><KeyRound size={16} /></div>
            <div className="demo-box-text">
              <strong>Demo:</strong> <code>admin@b-ace.vn</code> <span style={{ margin: '0 4px', color: '#cbd5e1' }}>·</span> <code>password</code>
            </div>
          </div>
          <p className="form-footer">B-ACE © {new Date().getFullYear()} · Phiên bản nội bộ</p>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="hero-feature">
      <div className="hero-feature-icon">{icon}</div>
      <div className="hero-feature-text">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}
