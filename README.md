# What-If Simulation Dashboard

A high-fidelity capacity planning sandbox that allows users to upload Excel resource files and interactively manipulate demand and capacity to resolve bottlenecks in real-time.

## Features

### The Three Playground Levers

1. **Priority Slider** - Drag-and-drop reordering of projects. Higher priority projects get capacity first.
2. **Virtual Capacity** - Simulate hiring by adding virtual resources to specific team/role/location buckets.
3. **Timeline Shifting** - Move project demand forward or backward in time to see capacity impacts.

### Visualizations

- **Live Heatmap** - Color-coded utilization matrix (Green: <85%, Amber: 85-100%, Red: >100%)
- **Delta Counter** - Real-time display of total unstaffed hours across the portfolio
- **PDF Export** - Export current scenario for client sign-off

## Tech Stack

- **Backend**: Python + FastAPI + pandas + openpyxl
- **Frontend**: React + Vite + Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Export**: jsPDF

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Excel File Requirements

The app expects an Excel file (.xlsm, .xlsx, or .xls) with the following sheets:

### Sheet: "Ref Role Grouping 23" (Capacity)
Contains resource capacity data with columns:
- Global Team/Market
- Role Grouping
- Actual Location
- Monthly capacity columns (e.g., "January Capacity", "February Capacity", etc.)

### Sheet: "Consolidated Data" (Demand)
Contains project demand data with columns:
- Project name
- Global Team or Market
- Role Group
- Actual Location
- Monthly forecast hours (columns starting at index 26)

## Demo Mode

If you don't have an Excel file, you can use the "Try Demo Mode" button to load sample data and explore the dashboard features.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload and parse Excel file |
| `/api/demo` | GET | Get demo data |

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI application
│   ├── excel_parser.py      # Excel parsing logic
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app component
│   │   ├── components/
│   │   │   ├── FileUpload.jsx
│   │   │   └── Sandbox/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── PrioritySlider.jsx
│   │   │       ├── VirtualCapacity.jsx
│   │   │       ├── Heatmap.jsx
│   │   │       └── DeltaCounter.jsx
│   │   ├── engine/
│   │   │   └── calculator.js
│   │   └── utils/
│   │       └── pdfExport.js
│   └── package.json
│
└── README.md
```

## License

MIT
