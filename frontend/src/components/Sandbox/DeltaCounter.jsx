import { useMemo } from 'react'

export default function DeltaCounter({ totalDeficit, projectStatus }) {
    const stats = useMemo(() => {
        const projects = Object.values(projectStatus)
        const staffed = projects.filter(p => p.overallStatus === 'staffed').length
        const partial = projects.filter(p => p.overallStatus === 'partial').length
        const unstaffed = projects.filter(p => p.overallStatus === 'unstaffed').length
        const total = projects.length

        return { staffed, partial, unstaffed, total }
    }, [projectStatus])

    const isResolved = totalDeficit === 0

    return (
        <div className={`
      flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-500
      ${isResolved
                ? 'bg-[var(--color-capacity-green)]/10 border border-[var(--color-capacity-green)]/30'
                : 'bg-[var(--color-capacity-red)]/10 border border-[var(--color-capacity-red)]/30'
            }
    `}>
            {/* Deficit Display */}
            <div className="flex items-center gap-3">
                <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isResolved ? 'bg-[var(--color-capacity-green)]/20' : 'bg-[var(--color-capacity-red)]/20'}
        `}>
                    {isResolved ? (
                        <svg className="w-5 h-5 text-[var(--color-capacity-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-[var(--color-capacity-red)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                </div>

                <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                        Unstaffed Hours
                    </div>
                    <div className={`
            text-xl font-bold tabular-nums
            ${isResolved ? 'text-[var(--color-capacity-green)]' : 'text-[var(--color-capacity-red)]'}
          `}>
                        {totalDeficit.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Separator */}
            <div className="w-px h-10 bg-[var(--color-border)]" />

            {/* Project Stats */}
            <div className="flex items-center gap-4">
                <div className="text-center">
                    <div className="text-lg font-bold text-[var(--color-capacity-green)] tabular-nums">
                        {stats.staffed}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Staffed</div>
                </div>

                {stats.partial > 0 && (
                    <div className="text-center">
                        <div className="text-lg font-bold text-[var(--color-capacity-amber)] tabular-nums">
                            {stats.partial}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Partial</div>
                    </div>
                )}

                {stats.unstaffed > 0 && (
                    <div className="text-center">
                        <div className="text-lg font-bold text-[var(--color-capacity-red)] tabular-nums">
                            {stats.unstaffed}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Unstaffed</div>
                    </div>
                )}

                <div className="text-center opacity-60">
                    <div className="text-lg font-bold tabular-nums">
                        {stats.total}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Total</div>
                </div>
            </div>
        </div>
    )
}
