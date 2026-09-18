import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PageProps = {
  title: string;
  children?: ReactNode;
};

export function Page({ title, children }: PageProps) {
  return (
    <main className="page-shell">
      <div className="page-sidebar" aria-label="主导航">
        <Link className="brand" to="/">CourtRef<span>.</span></Link>
        <nav><Link to="/">存档总览</Link><Link to="/archive/new">新建存档</Link></nav>
      </div>
      <section className="page">
        <div className="page-heading"><p className="eyebrow">COURT MANAGEMENT</p><h1>{title}</h1></div>
        {children}
      </section>
    </main>
  );
}
