import { useState, useEffect, useMemo, useCallback } from 'react'
import PrioritySlider from './PrioritySlider'
import VirtualCapacity from './VirtualCapacity'
import Heatmap from './Heatmap'
import DeltaCounter from './DeltaCounter'
import { calculateScenario, getUniqueValues } from '../../engine/calculator'
import { exportScenarioToPDF } from '../../utils/pdfExport'

export default function Dashboard({ data, onReset }) {
    // Extract baseline data
    const baselineCapacity = useMemo(() => data.capacity.buckets, [data])
    const baselineProjects = useMemo(() => data.demand.projects, [data])
    const months = useMemo(() => data.months, [data])
    const metadata = useMemo(() => data.metadata, [data])

    // Scenario state (the three levers)
    const [priorityOrder, setPriorityOrder] = useState(() =>
        baselineProjects.map(p => p.id)
    )
    const [virtualResources, setVirtualResources] = useState([])
    const [timelineShifts, setTimelineShifts] = useState({})

    // Calculate scenario results whenever any lever changes
    const scenarioResults = useMemo(() => {
        return calculateScenario(
            baselineCapacity,
            baselineProjects,
            priorityOrder,
            virtualResources,
            timelineShifts,
            months
        )
    }, [baselineCapacity, baselineProjects, priorityOrder, virtualResources, timelineShifts, months])

    // Get unique values for dropdowns
    const uniqueTeams = useMemo(() => getUniqueValues(baselineCapacity, 'team'), [baselineCapacity])
    const uniqueRoles = useMemo(() => getUniqueValues(baselineCapacity, 'role'), [baselineCapacity])
    const uniqueLocations = useMemo(() => getUniqueValues(baselineCapacity, 'location'), [baselineCapacity])

    // Handle priority reorder
    const handlePriorityChange = useCallback((newOrder) => {
        setPriorityOrder(newOrder)
    }, [])

    // Handle virtual resource add
    const handleAddVirtualResource = useCallback((resource) => {
        setVirtualResources(prev => [...prev, { ...resource, id: Date.now() }])
    }, [])

    // Handle virtual resource remove
    const handleRemoveVirtualResource = useCallback((resourceId) => {
        setVirtualResources(prev => prev.filter(r => r.id !== resourceId))
    }, [])

    // Handle timeline shift
    const handleTimelineShift = useCallback((projectId, shiftAmount) => {
        setTimelineShifts(prev => ({
            ...prev,
            [projectId]: shiftAmount
        }))
    }, [])

    // Reset scenario to baseline
    const handleResetScenario = useCallback(() => {
        setPriorityOrder(baselineProjects.map(p => p.id))
        setVirtualResources([])
        setTimelineShifts({})
    }, [baselineProjects])

    // Export scenario to PDF
    const handleExportPDF = useCallback(async () => {
        await exportScenarioToPDF({
            projectStatus: scenarioResults.projectStatus,
            virtualResources,
            totalDeficit: scenarioResults.totalDeficit,
            months,
            metadata
        })
    }, [scenarioResults, virtualResources, months, metadata])

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back</span>
                    </button>
                    <div className="w-px h-8 bg-[var(--color-border)]" />
                    <h1 className="text-lg font-semibold">
                        Capacity Sandbox
                        {metadata?.file_name && (
                            <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">
                                — {metadata.file_name}
                            </span>
                        )}
                    </h1>
                </div>

                {/* Delta Counter */}
                <DeltaCounter
                    totalDeficit={scenarioResults.totalDeficit}
                    projectStatus={scenarioResults.projectStatus}
                />

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleResetScenario}
                        className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Priority Slider */}
                <aside className="w-80 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-y-auto flex-shrink-0">
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs flex items-center justify-center font-bold">1</span>
                            Priority Slider
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            Drag to reorder project priorities
                        </p>
                    </div>
                    <PrioritySlider
                        projects={baselineProjects}
                        priorityOrder={priorityOrder}
                        projectStatus={scenarioResults.projectStatus}
                        onPriorityChange={handlePriorityChange}
                    />
                </aside>

                {/* Center - Heatmap */}
                <main className="flex-1 overflow-auto p-6 bg-[var(--color-bg-primary)]">
                    <div className="mb-4">
                        <h2 className="font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs flex items-center justify-center font-bold">3</span>
                            Capacity Heatmap
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            Click and drag to shift project timelines
                        </p>
                    </div>
                    <Heatmap
                        bucketUtilization={scenarioResults.bucketUtilization}
                        projectStatus={scenarioResults.projectStatus}
                        months={months}
                        timelineShifts={timelineShifts}
                        onTimelineShift={handleTimelineShift}
                    />
                </main>

                {/* Right Panel - Virtual Capacity */}
                <aside className="w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-y-auto flex-shrink-0">
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <h2 className="font-semibold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs flex items-center justify-center font-bold">2</span>
                            Virtual Capacity
                        </h2>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            Add "What-If" hires to see impact
                        </p>
                    </div>
                    <VirtualCapacity
                        teams={uniqueTeams}
                        roles={uniqueRoles}
                        locations={uniqueLocations}
                        virtualResources={virtualResources}
                        onAddResource={handleAddVirtualResource}
                        onRemoveResource={handleRemoveVirtualResource}
                    />
                </aside>
            </div>
        </div>
    )
}
