import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application rendering failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <main className="page app-error-boundary" role="alert"><section><p className="eyebrow">SORRY, SOMETHING WENT WRONG</p><h1>This page could not be displayed.</h1><p>Refresh the page to try again.</p><button type="button" className="btn-submit" onClick={() => window.location.reload()}>Refresh page</button></section></main>;
    }
    return this.props.children;
  }
}
