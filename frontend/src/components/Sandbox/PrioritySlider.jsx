import { useMemo } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatHours } from '../../engine/calculator'

// Individual sortable project item
function SortableProjectItem({ project, status, index }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 'auto',
    }

    const getStatusBadge = () => {
        if (!status) return null

        switch (status.overallStatus) {
            case 'staffed':
                return (
                    <span className="status-staffed text-xs px-2 py-0.5 rounded-full">
                        Staffed
                    </span>
                )
            case 'partial':
                return (
                    <span className="status-partial text-xs px-2 py-0.5 rounded-full">
                        Partial
                    </span>
                )
            case 'unstaffed':
                return (
                    <span className="status-unstaffed text-xs px-2 py-0.5 rounded-full">
                        Unstaffed
                    </span>
                )
            default:
                return null
        }
    }

    const getStatusBackground = () => {
        if (!status) return ''

        switch (status.overallStatus) {
            case 'staffed':
                return 'border-l-[var(--color-capacity-green)]'
            case 'partial':
                return 'border-l-[var(--color-capacity-amber)]'
            case 'unstaffed':
                return 'border-l-[var(--color-capacity-red)]'
            default:
                return ''
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        group p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]
        border-l-4 ${getStatusBackground()}
        transition-all duration-200 cursor-grab
        hover:bg-[var(--color-border)]/50
        ${isDragging ? 'opacity-90 shadow-xl scale-[1.02] cursor-grabbing' : ''}
      `}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {/* Priority Number */}
                    <div className="w-6 h-6 rounded bg-[var(--color-bg-secondary)] flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)] flex-shrink-0">
                        {index + 1}
                    </div>

                    {/* Project Name */}
                    <div className="min-w-0">
                        <div className="font-medium text-sm truncate" title={project.name}>
                            {project.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] truncate">
                            {project.team} / {project.role} / {project.location}
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                    {getStatusBadge()}
                </div>
            </div>

            {/* Deficit info (only show if unstaffed) */}
            {status && status.totalDeficit > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)]">Deficit:</span>
                    <span className="text-[var(--color-capacity-red)] font-medium">
                        {formatHours(status.totalDeficit)} hrs
                    </span>
                </div>
            )}

            {/* Drag Handle Indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
                <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                </svg>
            </div>
        </div>
    )
}

export default function PrioritySlider({ projects, priorityOrder, projectStatus, onPriorityChange }) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Create a map for quick project lookup
    const projectMap = useMemo(() => {
        const map = {}
        projects.forEach(p => {
            map[p.id] = p
        })
        return map
    }, [projects])

    // Get ordered projects for display
    const orderedProjects = useMemo(() => {
        return priorityOrder
            .map(id => projectMap[id])
            .filter(Boolean)
    }, [priorityOrder, projectMap])

    const handleDragEnd = (event) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = priorityOrder.indexOf(active.id)
            const newIndex = priorityOrder.indexOf(over.id)
            const newOrder = arrayMove(priorityOrder, oldIndex, newIndex)
            onPriorityChange(newOrder)
        }
    }

    return (
        <div className="p-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={priorityOrder}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {orderedProjects.map((project, index) => (
                            <SortableProjectItem
                                key={project.id}
                                project={project}
                                status={projectStatus[project.id]}
                                index={index}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <div className="text-xs text-[var(--color-text-secondary)] text-center">
                    {projects.length} projects • Drag to reorder priorities
                </div>
            </div>
        </div>
    )
}
