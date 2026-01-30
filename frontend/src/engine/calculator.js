/**
 * Capacity Calculation Engine
 * 
 * Performs all supply vs demand calculations client-side for sub-millisecond updates.
 * This is the core "brain" of the What-If simulation.
 */

/**
 * Generate a unique bucket key from team, role, and location
 */
export function getBucketKey(team, role, location) {
    return `${team}|${role}|${location}`.toLowerCase();
}

/**
 * Calculate effective capacity (baseline + virtual resources)
 */
export function calculateEffectiveCapacity(baselineCapacity, virtualResources, months) {
    const effectiveCapacity = {};

    // Start with baseline capacity
    baselineCapacity.forEach(bucket => {
        const key = getBucketKey(bucket.team, bucket.role, bucket.location);
        effectiveCapacity[key] = {
            ...bucket,
            monthly_capacity: { ...bucket.monthly_capacity }
        };
    });

    // Add virtual resources
    virtualResources.forEach(resource => {
        const key = getBucketKey(resource.team, resource.role, resource.location);
        if (effectiveCapacity[key]) {
            // Add hours to existing bucket
            months.forEach(month => {
                const hoursToAdd = resource.hoursPerMonth || 160;
                effectiveCapacity[key].monthly_capacity[month] =
                    (effectiveCapacity[key].monthly_capacity[month] || 0) + hoursToAdd;
            });
        } else {
            // Create new bucket for virtual resource
            const monthlyCapacity = {};
            months.forEach(month => {
                monthlyCapacity[month] = resource.hoursPerMonth || 160;
            });
            effectiveCapacity[key] = {
                id: `virtual_${Date.now()}`,
                team: resource.team,
                role: resource.role,
                location: resource.location,
                monthly_capacity: monthlyCapacity,
                isVirtual: true
            };
        }
    });

    return effectiveCapacity;
}

/**
 * Apply timeline shifts to project demand
 */
export function applyTimelineShifts(projects, timelineShifts, months) {
    return projects.map(project => {
        const shift = timelineShifts[project.id];
        if (!shift || shift === 0) {
            return project;
        }

        // Shift demand by the specified number of months
        const shiftedDemand = {};
        const monthIndex = {};
        months.forEach((month, idx) => {
            monthIndex[month] = idx;
        });

        Object.entries(project.monthly_demand).forEach(([month, hours]) => {
            const currentIdx = monthIndex[month];
            if (currentIdx !== undefined) {
                const newIdx = currentIdx + shift;
                if (newIdx >= 0 && newIdx < months.length) {
                    const newMonth = months[newIdx];
                    shiftedDemand[newMonth] = (shiftedDemand[newMonth] || 0) + hours;
                }
                // Hours that shift beyond available months are dropped
            }
        });

        return {
            ...project,
            monthly_demand: shiftedDemand,
            timelineShift: shift
        };
    });
}

/**
 * Main calculation function - runs on every lever change
 * 
 * @param {Array} baselineCapacity - Original capacity buckets from Excel
 * @param {Array} projects - Project demand data from Excel
 * @param {Array} priorityOrder - Array of project IDs in priority order
 * @param {Array} virtualResources - Added virtual capacity resources
 * @param {Object} timelineShifts - Map of project ID to month shift amount
 * @param {Array} months - List of months to process
 * @returns {Object} Calculation results
 */
export function calculateScenario(
    baselineCapacity,
    projects,
    priorityOrder,
    virtualResources,
    timelineShifts,
    months
) {
    // 1. Build effective capacity (baseline + virtual)
    const effectiveCapacity = calculateEffectiveCapacity(
        baselineCapacity,
        virtualResources,
        months
    );

    // 2. Apply timeline shifts to demand
    const shiftedProjects = applyTimelineShifts(projects, timelineShifts, months);

    // 3. Create a map for quick project lookup
    const projectMap = {};
    shiftedProjects.forEach(project => {
        projectMap[project.id] = project;
    });

    // 4. Initialize tracking structures
    const remainingCapacity = {};
    Object.entries(effectiveCapacity).forEach(([key, bucket]) => {
        remainingCapacity[key] = { ...bucket.monthly_capacity };
    });

    const projectStatus = {};
    const bucketUtilization = {};
    let totalDeficit = 0;

    // Initialize bucket utilization
    Object.entries(effectiveCapacity).forEach(([key, bucket]) => {
        bucketUtilization[key] = {
            ...bucket,
            monthly_utilization: {},
            monthly_consumed: {},
            monthly_remaining: {}
        };
        months.forEach(month => {
            bucketUtilization[key].monthly_consumed[month] = 0;
            bucketUtilization[key].monthly_remaining[month] = bucket.monthly_capacity[month] || 0;
            bucketUtilization[key].monthly_utilization[month] = 0;
        });
    });

    // 5. Initialize project status structures
    priorityOrder.forEach((projectId, priority) => {
        const project = projectMap[projectId];
        if (!project) return;

        projectStatus[projectId] = {
            ...project,
            priority: priority + 1,
            monthlyStatus: {},
            totalDeficit: 0,
            bucketKey: getBucketKey(project.team, project.role, project.location)
        };
    });

    // 6. Process MONTH-BY-MONTH (correct approach for priority-based allocation)
    months.forEach(month => {
        // For each month, process projects in priority order
        priorityOrder.forEach((projectId) => {
            const project = projectMap[projectId];
            if (!project) return;

            const bucketKey = getBucketKey(project.team, project.role, project.location);
            const demand = project.monthly_demand[month] || 0;
            const available = remainingCapacity[bucketKey]?.[month] || 0;

            if (demand === 0) {
                projectStatus[projectId].monthlyStatus[month] = {
                    status: 'none',
                    demand: 0,
                    allocated: 0,
                    deficit: 0
                };
                return;
            }

            if (available >= demand) {
                // Fully staffed for this month
                projectStatus[projectId].monthlyStatus[month] = {
                    status: 'staffed',
                    demand,
                    allocated: demand,
                    deficit: 0
                };

                // Deduct from remaining capacity
                if (remainingCapacity[bucketKey]) {
                    remainingCapacity[bucketKey][month] -= demand;
                }

                // Update bucket utilization
                if (bucketUtilization[bucketKey]) {
                    bucketUtilization[bucketKey].monthly_consumed[month] += demand;
                    bucketUtilization[bucketKey].monthly_remaining[month] -= demand;
                }
            } else if (available > 0) {
                // Partially staffed for this month
                const deficit = demand - available;
                projectStatus[projectId].monthlyStatus[month] = {
                    status: 'partial',
                    demand,
                    allocated: available,
                    deficit
                };

                // Use up all remaining capacity
                if (remainingCapacity[bucketKey]) {
                    remainingCapacity[bucketKey][month] = 0;
                }

                projectStatus[projectId].totalDeficit += deficit;
                totalDeficit += deficit;

                // Update bucket utilization
                if (bucketUtilization[bucketKey]) {
                    bucketUtilization[bucketKey].monthly_consumed[month] += available;
                    bucketUtilization[bucketKey].monthly_remaining[month] = 0;
                }
            } else {
                // Completely unstaffed for this month
                projectStatus[projectId].monthlyStatus[month] = {
                    status: 'unstaffed',
                    demand,
                    allocated: 0,
                    deficit: demand
                };

                projectStatus[projectId].totalDeficit += demand;
                totalDeficit += demand;
            }
        });
    });

    // 7. Calculate overall project status based on monthly results
    Object.values(projectStatus).forEach(project => {
        let hasAnyStaffed = false;
        let hasAnyUnstaffed = false;

        Object.values(project.monthlyStatus).forEach(monthStatus => {
            if (monthStatus.status === 'staffed') {
                hasAnyStaffed = true;
            }
            if (monthStatus.status === 'partial' || monthStatus.status === 'unstaffed') {
                hasAnyUnstaffed = true;
            }
        });

        if (hasAnyUnstaffed && hasAnyStaffed) {
            project.overallStatus = 'partial';
        } else if (hasAnyUnstaffed) {
            project.overallStatus = 'unstaffed';
        } else {
            project.overallStatus = 'staffed';
        }
    });

    // 6. Calculate final utilization percentages
    Object.entries(bucketUtilization).forEach(([key, bucket]) => {
        months.forEach(month => {
            const capacity = effectiveCapacity[key].monthly_capacity[month] || 0;
            const consumed = bucket.monthly_consumed[month];
            if (capacity > 0) {
                bucket.monthly_utilization[month] = Math.round((consumed / capacity) * 100);
            } else {
                bucket.monthly_utilization[month] = 0;
            }
        });
    });

    return {
        effectiveCapacity,
        bucketUtilization,
        projectStatus,
        totalDeficit,
        months
    };
}

/**
 * Get utilization color class based on percentage
 */
export function getUtilizationColor(percentage) {
    if (percentage > 100) return 'capacity-red';
    if (percentage >= 85) return 'capacity-amber';
    return 'capacity-green';
}

/**
 * Get utilization status text
 */
export function getUtilizationStatus(percentage) {
    if (percentage > 100) return 'Overloaded';
    if (percentage >= 85) return 'At Capacity';
    return 'Available';
}

/**
 * Format hours for display
 */
export function formatHours(hours) {
    if (hours >= 1000) {
        return `${(hours / 1000).toFixed(1)}k`;
    }
    return Math.round(hours).toString();
}

/**
 * Get unique values for filters
 */
export function getUniqueValues(items, field) {
    const values = new Set();
    items.forEach(item => {
        if (item[field]) {
            values.add(item[field]);
        }
    });
    return Array.from(values).sort();
}
