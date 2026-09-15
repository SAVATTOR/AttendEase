# Project Diagrams (GTUC Report)

This directory contains PlantUML diagrams for the **Smart Attendance GTUC Report**. Use these for figures that cannot be screenshotted from the app.

---

## Report Figure → PlantUML Mapping

| Report Figure | Description | PlantUML File |
|---------------|-------------|--------------|
| **Figure 3.1** | System Architecture Diagram | `system-architecture.puml` |
| **Figure 3.2** | QR Session Flow Diagram | `qr-session-flow.puml` |
| **Figure 3.3** | Attendance Marking Process Flow | `attendance-marking-process.puml` |
| **Figure 3.4** | Entity Relationship Diagram | *Use your Supabase ERD screenshot* (or `database-erd.puml` if needed) |
| **Figure 3.5** | Security Layers Diagram | `security-layers.puml` |
| **Figure 4.4** | Real-Time Attendance Update Flow | `real-time-attendance-update.puml` |
| **Figure 4.5** | Deployment Architecture | `deployment-architecture.puml` |

---

## Figures from Screenshots (no PlantUML)

| Report Figure | Description | Source |
|---------------|-------------|--------|
| **Figure 4.1** | Teacher Dashboard – Class List | Screenshot from app |
| **Figure 4.2** | QR Code Session Interface | Screenshot from app |
| **Figure 4.3** | Student Attendance Marking Interface | Screenshot from app |

---

## How to Generate Images from PlantUML

### Option 1: Online (easiest)
1. Go to [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copy the contents of the `.puml` file
3. Paste into the editor
4. Click **Submit** to generate the image
5. Right-click the image → **Save As** PNG or SVG

### Option 2: VS Code extension
1. Install the **PlantUML** extension in VS Code
2. Open the `.puml` file
3. Press **Alt+D** (or right-click → **Preview Current Diagram**)
4. Right-click the preview → **Export Current Diagram** → PNG/SVG

### Option 3: Command line
```bash
# Install PlantUML (requires Java)
# Windows: choco install plantuml
# Mac: brew install plantuml
# Linux: apt install plantuml

# From project root:
plantuml -tpng diagrams/*.puml
plantuml -tsvg diagrams/*.puml
```

---

## Files Summary

| File | Report Figure | Use when |
|------|---------------|----------|
| `system-architecture.puml` | 3.1 | System Architecture |
| `qr-session-flow.puml` | 3.2 | QR Session Flow |
| `attendance-marking-process.puml` | 3.3 | Attendance Marking Process |
| `database-erd.puml` | 3.4 | ERD (optional if using Supabase screenshot) |
| `security-layers.puml` | 3.5 | Security Layers |
| `real-time-attendance-update.puml` | 4.4 | Real-Time Update Flow |
| `deployment-architecture.puml` | 4.5 | Deployment Architecture |

---

## Adding to the Report

1. Generate PNG or SVG from each PlantUML file (see above).
2. Save images in a `figures/` folder (e.g. `figures/fig-3-1-system-architecture.png`).
3. Insert in your report where the figure is referenced.
4. Update the List of Figures with correct page numbers after layout.
