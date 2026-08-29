import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(e, info) { console.error("VAANI error boundary:", e, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen grid place-items-center bg-background text-foreground p-6" data-testid="error-boundary">
          <div className="text-center max-w-sm">
            <div className="font-head text-2xl font-light mb-3">Something interrupted VAANI</div>
            <p className="text-muted-foreground text-sm mb-6">A part of the interface failed to load. Please reload to continue.</p>
            <button onClick={() => window.location.reload()} className="rounded-full bg-primary text-primary-foreground px-6 py-2.5 font-medium">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
