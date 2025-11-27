import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Unerwarteter Fehler</h1>
                <p className="text-gray-600">Die Anwendung ist auf einen Fehler gestoßen</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h2 className="text-sm font-semibold text-red-900 mb-2">Fehlermeldung:</h2>
              <p className="text-sm text-red-800 font-mono break-words">
                {error?.message || 'Unbekannter Fehler'}
              </p>
            </div>

            {errorInfo?.componentStack && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Komponenten-Stack:</h2>
                <pre className="text-xs text-gray-700 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                  {errorInfo.componentStack.split('\n').slice(0, 10).join('\n')}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-sm font-semibold text-blue-900 mb-2">Fehlerdetails für Entwickler:</h2>
              <pre className="text-xs text-blue-800 font-mono overflow-x-auto">
                {error?.stack?.split('\n').slice(0, 5).join('\n')}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Seite neu laden
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Zur Startseite
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Dieser Fehler wurde in der Konsole protokolliert. Bitte laden Sie die Seite neu oder wenden Sie sich an den Support, wenn das Problem weiterhin besteht.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
