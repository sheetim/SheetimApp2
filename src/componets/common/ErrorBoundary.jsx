import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <Card className="max-w-md w-full md-card md-elevation-3 border-0 dark:bg-gray-800">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-white">משהו השתבש</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
              </p>
              {this.state.error && (
                <details className="text-xs text-right text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <summary className="cursor-pointer mb-2 font-semibold">פרטי שגיאה</summary>
                  <code className="block whitespace-pre-wrap">{this.state.error.toString()}</code>
                </details>
              )}
              <Button
                onClick={() => window.location.reload()}
                className="w-full md-ripple"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                רענן דף
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;