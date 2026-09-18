import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo): void { /* keep the user-facing fallback intentionally simple */ }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="app-error"><p className="eyebrow">COURTREF</p><h1>CourtRef 遇到了一点问题</h1><p>页面没有正常加载，请重新尝试。</p><button className="button" type="button" onClick={() => window.location.reload()}>重新加载</button></main>;
  }
}
