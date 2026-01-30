"""
Excel Parser Module for What-If Simulation Dashboard

Handles parsing of .xlsm files to extract:
1. Capacity data from "Ref Role Grouping 23" sheet
2. Demand data from "Consolidated Data" sheet
"""

import pandas as pd
from typing import Dict, List, Any, Optional
import re
from datetime import datetime


def extract_month_columns(columns: List[str]) -> Dict[str, int]:
    """
    Extract month-based column names and their indices.
    Looks for patterns like 'July Capacity', 'August Capacity', etc.
    """
    month_pattern = re.compile(
        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s*(Capacity|Hours|Forecast)?',
        re.IGNORECASE
    )
    
    month_columns = {}
    for idx, col in enumerate(columns):
        if isinstance(col, str):
            match = month_pattern.search(col)
            if match:
                month_name = match.group(1).capitalize()[:3]  # Convert to 3-letter abbreviation
                month_columns[month_name] = idx
    
    return month_columns


def parse_capacity_sheet(file_path: str) -> Dict[str, Any]:
    """
    Parse the "Ref Role Grouping 23" sheet for capacity data.
    
    Returns:
        {
            "buckets": [
                {
                    "id": "bucket_0",
                    "team": "Digital",
                    "role": "UX Designer",
                    "location": "Pune",
                    "monthly_capacity": {"Jan": 160, "Feb": 160, ...}
                },
                ...
            ],
            "months": ["Jan", "Feb", "Mar", ...]
        }
    """
    try:
        # Read the sheet
        df = pd.read_excel(
            file_path, 
            sheet_name="Ref Role Grouping 23",
            engine='openpyxl'
        )
        
        # Clean column names
        df.columns = [str(col).strip() for col in df.columns]
        
        # Find the key columns (case-insensitive search)
        team_col = None
        role_col = None
        location_col = None
        
        for col in df.columns:
            col_lower = col.lower()
            if 'global team' in col_lower or 'market' in col_lower:
                team_col = col
            elif 'role' in col_lower and 'group' in col_lower:
                role_col = col
            elif 'location' in col_lower:
                location_col = col
        
        # If we can't find the exact columns, use the first few columns as defaults
        if not team_col:
            team_col = df.columns[0] if len(df.columns) > 0 else None
        if not role_col:
            role_col = df.columns[1] if len(df.columns) > 1 else None
        if not location_col:
            location_col = df.columns[2] if len(df.columns) > 2 else None
            
        # Find month columns
        month_columns = extract_month_columns(list(df.columns))
        
        # If no month columns found, look for numeric columns that might be capacity
        if not month_columns:
            months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
            for i, col in enumerate(numeric_cols[:12]):  # Max 12 months
                month_columns[months[i]] = list(df.columns).index(col)
        
        buckets = []
        for idx, row in df.iterrows():
            if pd.isna(row.get(team_col)) and pd.isna(row.get(role_col)):
                continue  # Skip empty rows
                
            monthly_capacity = {}
            for month, col_idx in month_columns.items():
                col_name = df.columns[col_idx]
                value = row.get(col_name, 0)
                monthly_capacity[month] = float(value) if pd.notna(value) else 0
            
            bucket = {
                "id": f"bucket_{idx}",
                "team": str(row.get(team_col, "")).strip() if pd.notna(row.get(team_col)) else "Unknown",
                "role": str(row.get(role_col, "")).strip() if pd.notna(row.get(role_col)) else "Unknown",
                "location": str(row.get(location_col, "")).strip() if pd.notna(row.get(location_col)) else "Unknown",
                "monthly_capacity": monthly_capacity
            }
            buckets.append(bucket)
        
        # Get sorted list of months
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        available_months = sorted(
            month_columns.keys(),
            key=lambda x: month_order.index(x) if x in month_order else 12
        )
        
        return {
            "buckets": buckets,
            "months": available_months,
            "column_mapping": {
                "team": team_col,
                "role": role_col,
                "location": location_col
            }
        }
        
    except Exception as e:
        raise ValueError(f"Error parsing capacity sheet: {str(e)}")


def parse_demand_sheet(file_path: str) -> Dict[str, Any]:
    """
    Parse the "Consolidated Data" sheet for project demand data.
    
    Returns:
        {
            "projects": [
                {
                    "id": "project_0",
                    "name": "Project Alpha",
                    "team": "Digital",
                    "role": "UX Designer",
                    "location": "Pune",
                    "monthly_demand": {"Jan": 80, "Feb": 120, ...}
                },
                ...
            ],
            "months": ["Jan", "Feb", "Mar", ...]
        }
    """
    try:
        # Read the sheet
        df = pd.read_excel(
            file_path,
            sheet_name="Consolidated Data",
            engine='openpyxl'
        )
        
        # Clean column names
        df.columns = [str(col).strip() for col in df.columns]
        
        # Find the key columns
        project_col = None
        team_col = None
        role_col = None
        location_col = None
        
        for col in df.columns:
            col_lower = col.lower()
            if 'project' in col_lower and project_col is None:
                project_col = col
            elif ('global team' in col_lower or 'market' in col_lower) and team_col is None:
                team_col = col
            elif 'role' in col_lower and ('group' in col_lower or role_col is None):
                role_col = col
            elif 'location' in col_lower:
                location_col = col
        
        # Use default columns if not found
        if not project_col:
            project_col = df.columns[0] if len(df.columns) > 0 else None
        if not team_col:
            team_col = df.columns[1] if len(df.columns) > 1 else None
        if not role_col:
            role_col = df.columns[2] if len(df.columns) > 2 else None
        if not location_col:
            location_col = df.columns[3] if len(df.columns) > 3 else None
        
        # Extract monthly demand columns (starting at index 26 as per requirements)
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        month_columns = {}
        # First, try to find named month columns
        for col in df.columns:
            if isinstance(col, str):
                for month in months:
                    if month.lower() in col.lower():
                        month_columns[month] = col
                        break
        
        # If not enough month columns found, use columns starting at index 26
        if len(month_columns) < 6:
            month_columns = {}
            start_idx = 26
            for i, month in enumerate(months):
                if start_idx + i < len(df.columns):
                    month_columns[month] = df.columns[start_idx + i]
        
        projects = []
        project_names_seen = {}
        
        for idx, row in df.iterrows():
            project_name = row.get(project_col, "")
            if pd.isna(project_name) or str(project_name).strip() == "":
                continue
                
            project_name = str(project_name).strip()
            
            # Handle duplicate project names by adding suffix
            if project_name in project_names_seen:
                project_names_seen[project_name] += 1
                unique_id = f"{project_name}_{project_names_seen[project_name]}"
            else:
                project_names_seen[project_name] = 0
                unique_id = project_name
            
            monthly_demand = {}
            for month, col in month_columns.items():
                value = row.get(col, 0)
                monthly_demand[month] = float(value) if pd.notna(value) else 0
            
            # Only include projects with some demand
            if sum(monthly_demand.values()) > 0:
                project = {
                    "id": f"project_{idx}",
                    "name": project_name,
                    "uniqueId": unique_id,
                    "team": str(row.get(team_col, "")).strip() if pd.notna(row.get(team_col)) else "Unknown",
                    "role": str(row.get(role_col, "")).strip() if pd.notna(row.get(role_col)) else "Unknown",
                    "location": str(row.get(location_col, "")).strip() if pd.notna(row.get(location_col)) else "Unknown",
                    "monthly_demand": monthly_demand,
                    "total_demand": sum(monthly_demand.values())
                }
                projects.append(project)
        
        # Sort projects by total demand (highest first) for initial priority
        projects.sort(key=lambda x: x['total_demand'], reverse=True)
        
        # Get sorted list of months
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        available_months = sorted(
            month_columns.keys(),
            key=lambda x: month_order.index(x) if x in month_order else 12
        )
        
        return {
            "projects": projects,
            "months": available_months,
            "column_mapping": {
                "project": project_col,
                "team": team_col,
                "role": role_col,
                "location": location_col
            }
        }
        
    except Exception as e:
        raise ValueError(f"Error parsing demand sheet: {str(e)}")


def parse_excel_file(file_path: str) -> Dict[str, Any]:
    """
    Parse the complete Excel file and return structured data for the frontend.
    
    Returns:
        {
            "capacity": {...},
            "demand": {...},
            "metadata": {
                "parsed_at": "2024-01-30T12:00:00",
                "file_name": "resource_plan.xlsm"
            }
        }
    """
    import os
    
    capacity_data = parse_capacity_sheet(file_path)
    demand_data = parse_demand_sheet(file_path)
    
    # Merge months from both sources
    all_months = list(set(capacity_data['months'] + demand_data['months']))
    month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    all_months.sort(key=lambda x: month_order.index(x) if x in month_order else 12)
    
    return {
        "capacity": capacity_data,
        "demand": demand_data,
        "months": all_months,
        "metadata": {
            "parsed_at": datetime.now().isoformat(),
            "file_name": os.path.basename(file_path)
        }
    }


def generate_demo_data() -> Dict[str, Any]:
    """
    Generate demo data for testing when no Excel file is available.
    """
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    
    # Sample capacity buckets
    buckets = [
        {"id": "bucket_0", "team": "Digital", "role": "UX Designer", "location": "London", 
         "monthly_capacity": {m: 320 for m in months}},
        {"id": "bucket_1", "team": "Digital", "role": "UX Designer", "location": "Pune", 
         "monthly_capacity": {m: 480 for m in months}},
        {"id": "bucket_2", "team": "Digital", "role": "Developer", "location": "London", 
         "monthly_capacity": {m: 640 for m in months}},
        {"id": "bucket_3", "team": "Digital", "role": "Developer", "location": "Pune", 
         "monthly_capacity": {m: 960 for m in months}},
        {"id": "bucket_4", "team": "Strategy", "role": "Consultant", "location": "London", 
         "monthly_capacity": {m: 480 for m in months}},
        {"id": "bucket_5", "team": "Strategy", "role": "Consultant", "location": "New York", 
         "monthly_capacity": {m: 320 for m in months}},
        {"id": "bucket_6", "team": "Analytics", "role": "Data Analyst", "location": "Pune", 
         "monthly_capacity": {m: 480 for m in months}},
        {"id": "bucket_7", "team": "Analytics", "role": "Data Analyst", "location": "London", 
         "monthly_capacity": {m: 320 for m in months}},
    ]
    
    # Sample projects
    projects = [
        {"id": "project_0", "name": "Project Alpha", "uniqueId": "Project Alpha", 
         "team": "Digital", "role": "UX Designer", "location": "London",
         "monthly_demand": {"Jan": 200, "Feb": 180, "Mar": 160, "Apr": 140, "May": 120, "Jun": 100},
         "total_demand": 900},
        {"id": "project_1", "name": "Project Beta", "uniqueId": "Project Beta", 
         "team": "Digital", "role": "UX Designer", "location": "Pune",
         "monthly_demand": {"Jan": 300, "Feb": 350, "Mar": 400, "Apr": 350, "May": 300, "Jun": 250},
         "total_demand": 1950},
        {"id": "project_2", "name": "Project Gamma", "uniqueId": "Project Gamma", 
         "team": "Digital", "role": "Developer", "location": "London",
         "monthly_demand": {"Jan": 400, "Feb": 450, "Mar": 500, "Apr": 450, "May": 400, "Jun": 350},
         "total_demand": 2550},
        {"id": "project_3", "name": "Project Delta", "uniqueId": "Project Delta", 
         "team": "Digital", "role": "Developer", "location": "Pune",
         "monthly_demand": {"Jan": 600, "Feb": 700, "Mar": 800, "Apr": 750, "May": 650, "Jun": 550},
         "total_demand": 4050},
        {"id": "project_4", "name": "Project Epsilon", "uniqueId": "Project Epsilon", 
         "team": "Strategy", "role": "Consultant", "location": "London",
         "monthly_demand": {"Jan": 250, "Feb": 300, "Mar": 350, "Apr": 300, "May": 250, "Jun": 200},
         "total_demand": 1650},
        {"id": "project_5", "name": "Project Zeta", "uniqueId": "Project Zeta", 
         "team": "Strategy", "role": "Consultant", "location": "New York",
         "monthly_demand": {"Jan": 180, "Feb": 200, "Mar": 220, "Apr": 200, "May": 180, "Jun": 160},
         "total_demand": 1140},
        {"id": "project_6", "name": "Project Eta", "uniqueId": "Project Eta", 
         "team": "Analytics", "role": "Data Analyst", "location": "Pune",
         "monthly_demand": {"Jan": 300, "Feb": 350, "Mar": 400, "Apr": 380, "May": 340, "Jun": 300},
         "total_demand": 2070},
        {"id": "project_7", "name": "Project Theta", "uniqueId": "Project Theta", 
         "team": "Analytics", "role": "Data Analyst", "location": "London",
         "monthly_demand": {"Jan": 200, "Feb": 220, "Mar": 250, "Apr": 230, "May": 210, "Jun": 190},
         "total_demand": 1300},
        {"id": "project_8", "name": "Project Iota", "uniqueId": "Project Iota", 
         "team": "Digital", "role": "UX Designer", "location": "London",
         "monthly_demand": {"Jan": 150, "Feb": 160, "Mar": 170, "Apr": 160, "May": 150, "Jun": 140},
         "total_demand": 930},
        {"id": "project_9", "name": "Project Kappa", "uniqueId": "Project Kappa", 
         "team": "Digital", "role": "Developer", "location": "Pune",
         "monthly_demand": {"Jan": 500, "Feb": 550, "Mar": 600, "Apr": 580, "May": 520, "Jun": 480},
         "total_demand": 3230},
    ]
    
    return {
        "capacity": {
            "buckets": buckets,
            "months": months,
            "column_mapping": {"team": "Team", "role": "Role", "location": "Location"}
        },
        "demand": {
            "projects": projects,
            "months": months,
            "column_mapping": {"project": "Project", "team": "Team", "role": "Role", "location": "Location"}
        },
        "months": months,
        "metadata": {
            "parsed_at": datetime.now().isoformat(),
            "file_name": "demo_data.xlsm",
            "is_demo": True
        }
    }
