/**
 * Demo data for standalone deployment (no backend required)
 */

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const demoData = {
    capacity: {
        buckets: [
            {
                id: "bucket_0", team: "Digital", role: "UX Designer", location: "London",
                monthly_capacity: { Jan: 320, Feb: 320, Mar: 320, Apr: 320, May: 320, Jun: 320 }
            },
            {
                id: "bucket_1", team: "Digital", role: "UX Designer", location: "Pune",
                monthly_capacity: { Jan: 480, Feb: 480, Mar: 480, Apr: 480, May: 480, Jun: 480 }
            },
            {
                id: "bucket_2", team: "Digital", role: "Developer", location: "London",
                monthly_capacity: { Jan: 640, Feb: 640, Mar: 640, Apr: 640, May: 640, Jun: 640 }
            },
            {
                id: "bucket_3", team: "Digital", role: "Developer", location: "Pune",
                monthly_capacity: { Jan: 960, Feb: 960, Mar: 960, Apr: 960, May: 960, Jun: 960 }
            },
            {
                id: "bucket_4", team: "Strategy", role: "Consultant", location: "London",
                monthly_capacity: { Jan: 480, Feb: 480, Mar: 480, Apr: 480, May: 480, Jun: 480 }
            },
            {
                id: "bucket_5", team: "Strategy", role: "Consultant", location: "New York",
                monthly_capacity: { Jan: 320, Feb: 320, Mar: 320, Apr: 320, May: 320, Jun: 320 }
            },
            {
                id: "bucket_6", team: "Analytics", role: "Data Analyst", location: "Pune",
                monthly_capacity: { Jan: 480, Feb: 480, Mar: 480, Apr: 480, May: 480, Jun: 480 }
            },
            {
                id: "bucket_7", team: "Analytics", role: "Data Analyst", location: "London",
                monthly_capacity: { Jan: 320, Feb: 320, Mar: 320, Apr: 320, May: 320, Jun: 320 }
            },
        ],
        months: months,
        column_mapping: { team: "Team", role: "Role", location: "Location" }
    },
    demand: {
        projects: [
            {
                id: "project_0", name: "Project Alpha", uniqueId: "Project Alpha",
                team: "Digital", role: "UX Designer", location: "London",
                monthly_demand: { Jan: 200, Feb: 180, Mar: 160, Apr: 140, May: 120, Jun: 100 },
                total_demand: 900
            },
            {
                id: "project_1", name: "Project Beta", uniqueId: "Project Beta",
                team: "Digital", role: "UX Designer", location: "Pune",
                monthly_demand: { Jan: 300, Feb: 350, Mar: 400, Apr: 350, May: 300, Jun: 250 },
                total_demand: 1950
            },
            {
                id: "project_2", name: "Project Gamma", uniqueId: "Project Gamma",
                team: "Digital", role: "Developer", location: "London",
                monthly_demand: { Jan: 400, Feb: 450, Mar: 500, Apr: 450, May: 400, Jun: 350 },
                total_demand: 2550
            },
            {
                id: "project_3", name: "Project Delta", uniqueId: "Project Delta",
                team: "Digital", role: "Developer", location: "Pune",
                monthly_demand: { Jan: 600, Feb: 700, Mar: 800, Apr: 750, May: 650, Jun: 550 },
                total_demand: 4050
            },
            {
                id: "project_4", name: "Project Epsilon", uniqueId: "Project Epsilon",
                team: "Strategy", role: "Consultant", location: "London",
                monthly_demand: { Jan: 250, Feb: 300, Mar: 350, Apr: 300, May: 250, Jun: 200 },
                total_demand: 1650
            },
            {
                id: "project_5", name: "Project Zeta", uniqueId: "Project Zeta",
                team: "Strategy", role: "Consultant", location: "New York",
                monthly_demand: { Jan: 180, Feb: 200, Mar: 220, Apr: 200, May: 180, Jun: 160 },
                total_demand: 1140
            },
            {
                id: "project_6", name: "Project Eta", uniqueId: "Project Eta",
                team: "Analytics", role: "Data Analyst", location: "Pune",
                monthly_demand: { Jan: 300, Feb: 350, Mar: 400, Apr: 380, May: 340, Jun: 300 },
                total_demand: 2070
            },
            {
                id: "project_7", name: "Project Theta", uniqueId: "Project Theta",
                team: "Analytics", role: "Data Analyst", location: "London",
                monthly_demand: { Jan: 200, Feb: 220, Mar: 250, Apr: 230, May: 210, Jun: 190 },
                total_demand: 1300
            },
            {
                id: "project_8", name: "Project Iota", uniqueId: "Project Iota",
                team: "Digital", role: "UX Designer", location: "London",
                monthly_demand: { Jan: 150, Feb: 160, Mar: 170, Apr: 160, May: 150, Jun: 140 },
                total_demand: 930
            },
            {
                id: "project_9", name: "Project Kappa", uniqueId: "Project Kappa",
                team: "Digital", role: "Developer", location: "Pune",
                monthly_demand: { Jan: 500, Feb: 550, Mar: 600, Apr: 580, May: 520, Jun: 480 },
                total_demand: 3230
            },
        ],
        months: months,
        column_mapping: { project: "Project", team: "Team", role: "Role", location: "Location" }
    },
    months: months,
    metadata: {
        parsed_at: new Date().toISOString(),
        file_name: "demo_data.xlsm",
        is_demo: true
    }
};
