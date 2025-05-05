# VisionVigil - Quarterly Pivot Analyzer

VisionVigil is a web application that helps businesses and teams analyze strategic shifts between quarterly goals. It leverages OpenAI's GPT-4o-mini model to provide insights into the degree of pivot between sets of business objectives.

![image](https://github.com/user-attachments/assets/369875f1-773b-481d-a163-f03a0b9337f5)


## Quick Start Guide

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key

### Setup
1. Clone this repository to your local machine
2. Copy `config.example.js` to `config.js`:
   ```
   cp config.example.js config.js
   ```
3. Edit `config.js` and replace `'your-api-key-here'` with your actual OpenAI API key
4. Open `index.html` in your web browser

### Using the Application

#### Option 1: Analyze Goal Pivots
1. Paste your previous quarter's goals into the "Old Goals" textarea
2. Paste your current quarter's goals into the "New Goals" textarea
3. Click the "Analyze Pivot" button
4. View the results showing:
   - Pivot Score (0-1) indicating the degree of strategic shift
   - Summary points highlighting key changes and implications

Each analysis is saved in your session for easy reference. The most recent analysis appears at the top of the results.

#### Option 2: Review Previous Decisions
1. Prepare a CSV file with the following columns:
   - `Date`: Date when the decision was made (YYYY-MM-DD format)
   - `Fire_Drill_ID`: Unique identifier for the decision
   - `Project_Name`: The project related to the decision
   - `Sprint`: Sprint number or identifier
   - `Changed_By`: Person or role responsible for the decision
   - `Reason_Given`: Rationale behind the decision
   - `Impact`: Consequence or impact of the decision
2. Click the "Review Previous Decisions" button
3. Select your CSV file when prompted
4. View the analysis results showing:
   - Summary of all decisions analyzed
   - Flagged decisions with excessive pivoting
   - Conflicting decisions identified
   - Recommendations for addressing conflicts

The analysis highlights pivot patterns across multiple decisions to help identify organizational anti-patterns.

## Technical Overview

### Architecture

VisionVigil is a client-side web application built with vanilla JavaScript. It uses the OpenAI API to perform goal analysis with AI.

### Files Structure
- `index.html` - Main HTML structure and UI components
- `main.css` - Styling with CSS variables for theme consistency
- `main.js` - JavaScript functionality including API integration
- `config.js` - Configuration file containing API key (not included in repo)
- `config.example.js` - Example configuration template

### Key Features

#### 1. User Interface
The application features a responsive design with a clean, material-inspired layout. The UI includes:
- Two textareas for comparing old and new goals
- Option to upload CSV files with historical decisions
- Analysis buttons with loading indicators
- Results section displaying insights in card-based layout
- Color-coded scoring system (green for low pivot, amber for medium, red for high)
- Tabular view for CSV decision analysis

#### 2. API Integration
The application interacts with OpenAI's API for intelligent analysis:
- Uses the `gpt-4o-mini` model for cost-effective analysis
- Structured prompt engineering to guide the AI analysis
- Multiple analysis pathways (goal comparison and decision review)
- JSON response format for consistent parsing
- Error handling for API failures

#### 3. Analysis Logic
The AI performs two types of strategic analysis:

**Goals Analysis:**
- Continuity between old and new goals
- Strategic shifts in focus areas
- Organizational direction changes
- Potential implications of identified pivots

**Decision Review Analysis:**
- Identifying excessive pivoting in historical decisions
- Detecting conflicts between decisions
- Assessing severity of pivots
- Providing recommendations for resolving conflicts
- Highlighting organizational pivot patterns

#### 4. Results Visualization
**Goals Analysis Results:**
- Numerical pivot score (0-1)
- Color-coded indicators for pivot magnitude
- Bullet-point summaries of key insights
- Timestamp for tracking when analysis was performed
- History tracking to maintain previous analyses in the session

**Decision Review Results:**
- Summary statistics of all analyzed decisions
- Table of flagged decisions with excessive pivoting
- Colored highlighting of severe pivot decisions
- Conflict analysis with recommendations
- Top pivot areas identified across the organization

### Styling
The application uses a modern material design approach with:
- CSS variables for consistent theming
- Responsive layout that works on mobile and desktop
- Card-based UI with subtle elevation shadows
- Animated loading indicator
- Hover effects for interactive elements

### Performance Considerations
- Analyses are performed on-demand to minimize API costs
- Results are stored in the browser session (not persisted)
- Minimal dependencies (no external libraries required)

## Development

### Extending the Application
To extend VisionVigil with new features:

1. **Additional Analysis Metrics**
   - Modify the system prompts in `main.js` to request additional analysis dimensions
   - Update the result display logic in the display functions
   - Add new visualizations for additional metrics

2. **History Management**
   - Implement localStorage to persist analysis history between sessions
   - Add export functionality for reports (JSON, CSV, PDF)
   - Create user accounts for saving analysis history

3. **Enhanced Visualization**
   - Integrate chart libraries to visualize pivot trends over time
   - Add comparison views for multiple quarter analyses
   - Create interactive dashboards for decision analysis

4. **CSV Analysis Features**
   - Support for more complex CSV formats
   - Batch analysis of multiple decision files
   - Pattern detection across projects
   - Organizational pivot trend analysis over time

### Browser Compatibility
The application uses modern JavaScript features and should work in all recent browsers.

## License
[Add your license information here]

## Acknowledgements
- Powered by OpenAI API
- Built as part of a Generative AI course project
