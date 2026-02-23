import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background text-foreground animate-fade-in">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reload Application
          </Button>
          <div className="mt-8 p-4 bg-black/20 rounded-lg text-left overflow-auto max-w-2xl max-h-48 text-xs font-mono text-muted-foreground/80">
             {this.state.errorInfo?.componentStack}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
