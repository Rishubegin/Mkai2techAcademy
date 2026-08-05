import { Component } from "react";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error in app tree:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
          <h1 className="text-2xl font-bold text-navy dark:text-white">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md">
            An unexpected error occurred. Try reloading the page — if it keeps happening, please
            let us know.
          </p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
