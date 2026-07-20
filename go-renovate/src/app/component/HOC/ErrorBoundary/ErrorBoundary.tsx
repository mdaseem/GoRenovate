"use client";

import React from "react";
import ErrorState from "../../Atoms/ErrorState/ErrorState";

type propType = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  message?: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

type stateType = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<propType, stateType> {
  constructor(props: propType) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): stateType {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          title={this.props.title}
          message={this.props.message}
          actionLabel="Try again"
          onAction={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
