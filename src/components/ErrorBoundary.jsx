import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-red-500 p-4 text-center z-50">
          <div>
            <h1 className="text-xl font-bold mb-2">Something went wrong.</h1>
            <p className="text-sm opacity-80">{this.state.error?.message}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
