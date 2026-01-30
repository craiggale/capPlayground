import { useState } from 'react'

export default function VirtualCapacity({
    teams,
    roles,
    locations,
    virtualResources,
    onAddResource,
    onRemoveResource
}) {
    const [selectedTeam, setSelectedTeam] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedLocation, setSelectedLocation] = useState('')
    const [hoursPerMonth, setHoursPerMonth] = useState(160)

    const handleAddResource = () => {
        if (!selectedTeam || !selectedRole || !selectedLocation) {
            return
        }

        onAddResource({
            team: selectedTeam,
            role: selectedRole,
            location: selectedLocation,
            hoursPerMonth
        })

        // Reset form
        setSelectedTeam('')
        setSelectedRole('')
        setSelectedLocation('')
        setHoursPerMonth(160)
    }

    const totalVirtualHours = virtualResources.reduce(
        (sum, r) => sum + (r.hoursPerMonth || 160),
        0
    )

    return (
        <div className="p-4">
            {/* Add Resource Form */}
            <div className="space-y-3">
                {/* Team Select */}
                <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                        Team / Market
                    </label>
                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Select team...</option>
                        {teams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                </div>

                {/* Role Select */}
                <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                        Role Group
                    </label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Select role...</option>
                        {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                {/* Location Select */}
                <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                        Location
                    </label>
                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Select location...</option>
                        {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                        ))}
                    </select>
                </div>

                {/* Hours Input */}
                <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                        Hours per Month
                    </label>
                    <input
                        type="number"
                        value={hoursPerMonth}
                        onChange={(e) => setHoursPerMonth(parseInt(e.target.value) || 160)}
                        min={40}
                        max={200}
                        step={8}
                        className="input-field"
                    />
                </div>

                {/* Add Button */}
                <button
                    onClick={handleAddResource}
                    disabled={!selectedTeam || !selectedRole || !selectedLocation}
                    className={`
            w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2
            transition-all duration-200
            ${selectedTeam && selectedRole && selectedLocation
                            ? 'btn-primary'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] cursor-not-allowed'
                        }
          `}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Virtual Resource
                </button>
            </div>

            {/* Virtual Resources List */}
            {virtualResources.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Added Resources</h3>
                        <span className="text-xs text-[var(--color-capacity-green)]">
                            +{totalVirtualHours} hrs/mo
                        </span>
                    </div>

                    <div className="space-y-2">
                        {virtualResources.map((resource) => (
                            <div
                                key={resource.id}
                                className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]
                  border-l-4 border-l-[var(--color-capacity-green)] group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {resource.role}
                                        </div>
                                        <div className="text-xs text-[var(--color-text-secondary)]">
                                            {resource.team} • {resource.location}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--color-capacity-green)] font-medium">
                                            +{resource.hoursPerMonth}h
                                        </span>
                                        <button
                                            onClick={() => onRemoveResource(resource.id)}
                                            className="w-6 h-6 rounded flex items-center justify-center
                        text-[var(--color-text-secondary)] hover:text-[var(--color-capacity-red)]
                        hover:bg-[var(--color-capacity-red)]/10 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="mt-6 p-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                <div className="flex gap-2">
                    <svg className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                        Virtual resources simulate hiring. Add resources to see which projects become staffable.
                    </p>
                </div>
            </div>
        </div>
    )
}
