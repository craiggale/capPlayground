import { useMemo, useState } from 'react'
import { getUtilizationColor, formatHours } from '../../engine/calculator'

export default function Heatmap({
    bucketUtilization,
    projectStatus,
    months,
    timelineShifts,
    onTimelineShift
}) {
    const [selectedProject, setSelectedProject] = useState(null)
    const [hoveredCell, setHoveredCell] = useState(null)

    // Convert bucket utilization to array and sort
    const buckets = useMemo(() => {
        return Object.values(bucketUtilization).sort((a, b) => {
            // Sort by team, then role, then location
            if (a.team !== b.team) return a.team.localeCompare(b.team)
            if (a.role !== b.role) return a.role.localeCompare(b.role)
            return a.location.localeCompare(b.location)
        })
    }, [bucketUtilization])

    // Get projects sorted by priority
    const projects = useMemo(() => {
        return Object.values(projectStatus).sort((a, b) => a.priority - b.priority)
    }, [projectStatus])

    // Get color class based on utilization
    const getCellColor = (utilization) => {
        if (utilization > 100) return 'bg-[var(--color-capacity-red)]'
        if (utilization >= 85) return 'bg-[var(--color-capacity-amber)]'
        if (utilization > 0) return 'bg-[var(--color-capacity-green)]'
        return 'bg-[var(--color-bg-tertiary)]'
    }

    // Get color opacity based on utilization level
    const getCellOpacity = (utilization) => {
        if (utilization === 0) return 0.3
        if (utilization > 100) return 1
        return Math.max(0.4, Math.min(1, utilization / 100))
    }

    const handleProjectClick = (project) => {
        setSelectedProject(selectedProject?.id === project.id ? null : project)
    }

    const handleShiftProject = (projectId, direction) => {
        const currentShift = timelineShifts[projectId] || 0
        const newShift = currentShift + direction

        // Limit shifts to +/- 6 months
        if (newShift >= -6 && newShift <= 6) {
            onTimelineShift(projectId, newShift)
        }
    }

    return (
        <div className="space-y-6">
            {/* Capacity Heatmap */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)]">
                    <h3 className="font-semibold">Bucket Utilization</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Team / Role / Location capacity over time
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[var(--color-bg-tertiary)]">
                                <th className="sticky left-0 z-10 bg-[var(--color-bg-tertiary)] px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)]">
                                    Team / Role / Location
                                </th>
                                {months.map(month => (
                                    <th key={month} className="px-3 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] min-w-[80px]">
                                        {month}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {buckets.map((bucket, idx) => (
                                <tr
                                    key={bucket.id}
                                    className={`border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors`}
                                >
                                    <td className="sticky left-0 z-10 bg-[var(--color-bg-secondary)] px-4 py-2 border-r border-[var(--color-border)]">
                                        <div className="text-sm font-medium">{bucket.team}</div>
                                        <div className="text-xs text-[var(--color-text-secondary)]">
                                            {bucket.role} • {bucket.location}
                                        </div>
                                    </td>
                                    {months.map(month => {
                                        const utilization = bucket.monthly_utilization?.[month] || 0
                                        const consumed = bucket.monthly_consumed?.[month] || 0
                                        const capacity = bucket.monthly_capacity?.[month] || 0
                                        const isHovered = hoveredCell?.bucketId === bucket.id && hoveredCell?.month === month

                                        return (
                                            <td
                                                key={month}
                                                className="px-3 py-2 text-center relative"
                                                onMouseEnter={() => setHoveredCell({ bucketId: bucket.id, month })}
                                                onMouseLeave={() => setHoveredCell(null)}
                                            >
                                                <div
                                                    className={`
                            heatmap-cell rounded-lg px-2 py-3 text-xs font-bold
                            ${getCellColor(utilization)}
                            ${isHovered ? 'ring-2 ring-white/30' : ''}
                          `}
                                                    style={{ opacity: getCellOpacity(utilization) }}
                                                >
                                                    {utilization}%
                                                </div>

                                                {/* Tooltip */}
                                                {isHovered && (
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                                        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-left whitespace-nowrap">
                                                            <div className="text-xs font-semibold mb-1">{bucket.team} / {bucket.role}</div>
                                                            <div className="text-xs text-[var(--color-text-secondary)]">{bucket.location} • {month}</div>
                                                            <div className="mt-2 pt-2 border-t border-[var(--color-border)] space-y-1">
                                                                <div className="flex justify-between gap-4 text-xs">
                                                                    <span className="text-[var(--color-text-secondary)]">Capacity:</span>
                                                                    <span>{formatHours(capacity)} hrs</span>
                                                                </div>
                                                                <div className="flex justify-between gap-4 text-xs">
                                                                    <span className="text-[var(--color-text-secondary)]">Consumed:</span>
                                                                    <span>{formatHours(consumed)} hrs</span>
                                                                </div>
                                                                <div className="flex justify-between gap-4 text-xs">
                                                                    <span className="text-[var(--color-text-secondary)]">Remaining:</span>
                                                                    <span className={capacity - consumed < 0 ? 'text-[var(--color-capacity-red)]' : 'text-[var(--color-capacity-green)]'}>
                                                                        {formatHours(capacity - consumed)} hrs
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[var(--color-capacity-green)]" />
                        <span className="text-xs text-[var(--color-text-secondary)]">0-84%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[var(--color-capacity-amber)]" />
                        <span className="text-xs text-[var(--color-text-secondary)]">85-100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[var(--color-capacity-red)]" />
                        <span className="text-xs text-[var(--color-text-secondary)]">&gt;100%</span>
                    </div>
                </div>
            </div>

            {/* Project Timeline View */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)]">
                    <h3 className="font-semibold">Project Timeline</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Click a project to shift its timeline. Use arrows to move demand forward/backward.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[var(--color-bg-tertiary)]">
                                <th className="sticky left-0 z-10 bg-[var(--color-bg-tertiary)] px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] min-w-[200px]">
                                    Project
                                </th>
                                <th className="px-2 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] w-20">
                                    Shift
                                </th>
                                {months.map(month => (
                                    <th key={month} className="px-3 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] min-w-[80px]">
                                        {month}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {projects.slice(0, 20).map((project) => {
                                const shift = timelineShifts[project.id] || 0
                                const isSelected = selectedProject?.id === project.id

                                return (
                                    <tr
                                        key={project.id}
                                        className={`
                      border-b border-[var(--color-border)] cursor-pointer transition-colors
                      ${isSelected ? 'bg-[var(--color-accent)]/10' : 'hover:bg-[var(--color-bg-tertiary)]/50'}
                    `}
                                        onClick={() => handleProjectClick(project)}
                                    >
                                        <td className="sticky left-0 z-10 bg-[var(--color-bg-secondary)] px-4 py-2 border-r border-[var(--color-border)]">
                                            <div className="flex items-center gap-2">
                                                <span className={`
                          w-2 h-2 rounded-full flex-shrink-0
                          ${project.overallStatus === 'staffed'
                                                        ? 'bg-[var(--color-capacity-green)]'
                                                        : project.overallStatus === 'partial'
                                                            ? 'bg-[var(--color-capacity-amber)]'
                                                            : 'bg-[var(--color-capacity-red)]'
                                                    }
                        `} />
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate" title={project.name}>
                                                        {project.name}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-text-secondary)]">
                                                        #{project.priority} • {project.role}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleShiftProject(project.id, -1)
                                                    }}
                                                    disabled={shift <= -6}
                                                    className="w-6 h-6 rounded flex items-center justify-center
                            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                            hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed
                            transition-all"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <span className={`
                          text-xs font-mono w-8 text-center
                          ${shift !== 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}
                        `}>
                                                    {shift > 0 ? `+${shift}` : shift}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleShiftProject(project.id, 1)
                                                    }}
                                                    disabled={shift >= 6}
                                                    className="w-6 h-6 rounded flex items-center justify-center
                            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                            hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed
                            transition-all"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        {months.map(month => {
                                            const status = project.monthlyStatus?.[month]
                                            const demand = status?.demand || 0
                                            const deficit = status?.deficit || 0

                                            return (
                                                <td key={month} className="px-3 py-2 text-center">
                                                    {demand > 0 ? (
                                                        <div
                                                            className={`
                                rounded-lg px-2 py-2 text-xs font-medium
                                ${status?.status === 'staffed'
                                                                    ? 'bg-[var(--color-capacity-green)]/20 text-[var(--color-capacity-green)]'
                                                                    : status?.status === 'partial'
                                                                        ? 'bg-[var(--color-capacity-amber)]/20 text-[var(--color-capacity-amber)]'
                                                                        : 'bg-[var(--color-capacity-red)]/20 text-[var(--color-capacity-red)]'
                                                                }
                              `}
                                                        >
                                                            {formatHours(demand)}h
                                                            {deficit > 0 && (
                                                                <div className="text-[10px] opacity-70">
                                                                    -{formatHours(deficit)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[var(--color-text-secondary)]/30">—</span>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {projects.length > 20 && (
                    <div className="p-4 text-center text-xs text-[var(--color-text-secondary)]">
                        Showing top 20 of {projects.length} projects
                    </div>
                )}
            </div>
        </div>
    )
}
