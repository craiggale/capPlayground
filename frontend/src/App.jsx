import { useState, useCallback } from 'react'
import './index.css'
import FileUpload from './components/FileUpload'
import Dashboard from './components/Sandbox/Dashboard'

function App() {
  const [appState, setAppState] = useState('upload') // 'upload' | 'sandbox'
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleDataLoaded = useCallback((loadedData) => {
    setData(loadedData)
    setAppState('sandbox')
    setError(null)
  }, [])

  const handleReset = useCallback(() => {
    setAppState('upload')
    setData(null)
    setError(null)
  }, [])

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage)
    setIsLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {appState === 'upload' && (
        <FileUpload
          onDataLoaded={handleDataLoaded}
          onError={handleError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          error={error}
        />
      )}

      {appState === 'sandbox' && data && (
        <Dashboard
          data={data}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default App
