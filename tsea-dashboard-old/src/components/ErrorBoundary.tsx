// ============================================================
// src/components/ErrorBoundary.tsx
// Captura erros React críticos e exibe tela de fallback
// ============================================================
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; errorMessage: string }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, errorMessage: err.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TSEA ErrorBoundary] Erro crítico de UI capturado:', error)
    console.error('[TSEA ErrorBoundary] Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#0a0a0f', color: '#f8f8f8',
          fontFamily: 'Inter, sans-serif', gap: '1rem', padding: '2rem'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', color: '#ff4d4d', margin: 0 }}>
            Erro Crítico do Sistema
          </h1>
          <p style={{ color: '#999', textAlign: 'center', maxWidth: '500px' }}>
            {this.state.errorMessage}
          </p>
          <p style={{ color: '#666', fontSize: '0.8rem' }}>
            Contate o suporte técnico ou reinicie o painel.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            style={{
              marginTop: '1rem', padding: '0.6rem 1.5rem', cursor: 'pointer',
              background: '#1a1a2e', border: '1px solid #333', color: '#fff',
              borderRadius: '6px', fontSize: '0.9rem'
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
