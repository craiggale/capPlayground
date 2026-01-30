import { useState, useCallback } from 'react'
import axios from 'axios'

export default function FileUpload({ onDataLoaded, onError, isLoading, setIsLoading, error }) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            uploadFile(files[0])
        }
    }, [])

    const handleFileSelect = useCallback((e) => {
        const files = e.target.files
        if (files.length > 0) {
            uploadFile(files[0])
        }
    }, [])

    const uploadFile = async (file) => {
        // Validate file type
        const validExtensions = ['.xlsm', '.xlsx', '.xls']
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

        if (!validExtensions.includes(fileExtension)) {
            onError('Please upload an Excel file (.xlsm, .xlsx, or .xls)')
            return
        }

        setIsLoading(true)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    setUploadProgress(progress)
                },
            })

            if (response.data.success) {
                onDataLoaded(response.data.data)
            } else {
                onError(response.data.message || 'Failed to parse file')
            }
        } catch (err) {
            console.error('Upload error:', err)
            if (err.response?.status === 422) {
                onError(err.response.data.detail || 'Invalid file format or structure')
            } else if (err.code === 'ERR_NETWORK') {
                onError('Cannot connect to server. Please ensure the backend is running on port 8000.')
            } else {
                onError(err.response?.data?.detail || 'Failed to upload file. Please try again.')
            }
        } finally {
            setIsLoading(false)
            setUploadProgress(0)
        }
    }

    const loadDemoData = async () => {
        setIsLoading(true)

        try {
            // Try backend API first (for local development)
            const response = await axios.get('/api/demo')

            if (response.data.success) {
                onDataLoaded(response.data.data)
            } else {
                onError(response.data.message || 'Failed to load demo data')
            }
        } catch (err) {
            console.log('Backend not available, using embedded demo data')
            // Fallback to embedded demo data (for Vercel/static deployment)
            try {
                const { demoData } = await import('../data/demoData.js')
                onDataLoaded(demoData)
            } catch (importErr) {
                console.error('Failed to load embedded demo data:', importErr)
                onError('Failed to load demo data. Please try again.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            {/* Background gradient effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)] opacity-10 blur-[100px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 opacity-10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--color-accent)] to-purple-400 bg-clip-text text-transparent">
                        What-If Simulation
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-lg">
                        Upload your resource planning file to enter the capacity playground
                    </p>
                </div>

                {/* Upload Card */}
                <div
                    className={`
            card-glass p-8 rounded-2xl transition-all duration-300
            ${isDragOver ? 'border-[var(--color-accent)] scale-[1.02]' : ''}
            ${isLoading ? 'opacity-80 pointer-events-none' : ''}
          `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Drop Zone */}
                    <div
                        className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${isDragOver
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                                : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                            }
            `}
                    >
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                                <p className="text-[var(--color-text-secondary)]">
                                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing file...'}
                                </p>
                                {uploadProgress > 0 && (
                                    <div className="w-full max-w-xs bg-[var(--color-bg-tertiary)] rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-accent)] transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                                    <svg className="w-10 h-10 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-xl font-semibold mb-2">
                                    Drop your Excel file here
                                </p>
                                <p className="text-[var(--color-text-secondary)] mb-6">
                                    or click to browse (.xlsm, .xlsx, .xls)
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsm,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="btn-primary inline-block cursor-pointer"
                                >
                                    Choose File
                                </label>
                            </>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-[var(--color-border)]" />
                        <span className="text-[var(--color-text-secondary)] text-sm">or</span>
                        <div className="flex-1 h-px bg-[var(--color-border)]" />
                    </div>

                    {/* Demo Mode Button */}
                    <button
                        onClick={loadDemoData}
                        disabled={isLoading}
                        className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Try Demo Mode
                    </button>
                </div>

                {/* Instructions */}
                <div className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
                    <p>Required sheets: <code className="px-2 py-1 rounded bg-[var(--color-bg-tertiary)]">Ref Role Grouping 23</code> (capacity) and <code className="px-2 py-1 rounded bg-[var(--color-bg-tertiary)]">Consolidated Data</code> (demand)</p>
                </div>
            </div>
        </div>
    )
}
