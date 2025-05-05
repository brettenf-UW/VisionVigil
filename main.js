import { OPENAI_API_KEY } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const oldGoalsTextarea = document.getElementById('old-goals');
  const newGoalsTextarea = document.getElementById('new-goals');
  const analyzeButton = document.getElementById('analyze-btn');
  const reviewDecisionsButton = document.getElementById('review-decisions-btn');
  const csvUploadInput = document.getElementById('csv-upload');
  const loadingElement = document.getElementById('loading');
  const resultsContainer = document.getElementById('results-container');
  const csvResultsContainer = document.getElementById('csv-results-container');
  
  // History of analyses
  let analysisHistory = [];
  
  // Parsed decisions from CSV
  let decisionsData = [];
  
  // Create results container if it doesn't exist
  if (!resultsContainer) {
    const container = document.createElement('div');
    container.id = 'results-container';
    container.className = 'results-container';
    document.querySelector('main.container').appendChild(container);
  }
  
  // Create CSV results container if it doesn't exist
  if (!csvResultsContainer) {
    const container = document.createElement('div');
    container.id = 'csv-results-container';
    container.className = 'results-container hidden';
    document.querySelector('main.container').appendChild(container);
  }
  
  // Event Listeners
  analyzeButton.addEventListener('click', async () => {
    // Validate inputs
    const oldGoals = oldGoalsTextarea.value.trim();
    const newGoals = newGoalsTextarea.value.trim();
    
    if (!oldGoals || !newGoals) {
      alert('Please enter both old and new goals to analyze.');
      return;
    }
    
    // Show loading state
    analyzeButton.disabled = true;
    loadingElement.classList.remove('hidden');
    
    try {
      const results = await analyzePivot(oldGoals, newGoals);
      // Add timestamp to results
      results.timestamp = new Date().toLocaleString();
      results.oldGoals = oldGoals;
      results.newGoals = newGoals;
      
      // Add to history
      analysisHistory.unshift(results);
      
      // Display all results
      displayResults();
    } catch (error) {
      console.error('Analysis error:', error);
      alert('An error occurred during analysis. Please try again.');
    } finally {
      // Hide loading state
      analyzeButton.disabled = false;
      loadingElement.classList.add('hidden');
    }
  });
  
  // Review Decisions Button Click Handler
  reviewDecisionsButton.addEventListener('click', () => {
    csvUploadInput.click();
  });
  
  // CSV Upload Handler
  csvUploadInput.addEventListener('change', async (event) => {
    // Check if a file was selected
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }
    
    // Show loading state
    reviewDecisionsButton.disabled = true;
    loadingElement.classList.remove('hidden');
    
    try {
      // Parse the CSV file
      const csvData = await parseCSVFile(file);
      decisionsData = csvData;
      
      // Hide goal analyzer results and show CSV results
      resultsContainer.classList.add('hidden');
      csvResultsContainer.classList.remove('hidden');
      
      // Analyze the decisions
      const analysisResults = await analyzeDecisions(decisionsData);
      
      // Display the analysis results
      displayDecisionAnalysis(analysisResults);
    } catch (error) {
      console.error('CSV analysis error:', error);
      alert('An error occurred while analyzing the CSV file. Please try again.');
    } finally {
      // Hide loading state
      reviewDecisionsButton.disabled = false;
      loadingElement.classList.add('hidden');
      
      // Reset file input
      csvUploadInput.value = '';
    }
  });
  
  // Function to parse CSV file
  async function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          const rows = csvText.split('\n');
          
          // Extract headers (assuming first row contains headers)
          const headers = rows[0].split(',').map(header => header.trim());
          
          // Parse data rows
          const data = [];
          for (let i = 1; i < rows.length; i++) {
            if (rows[i].trim() === '') continue;
            
            const values = rows[i].split(',');
            const rowData = {};
            
            // Map each value to its corresponding header
            headers.forEach((header, index) => {
              rowData[header] = values[index] ? values[index].trim() : '';
            });
            
            data.push(rowData);
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read the CSV file.'));
      };
      
      reader.readAsText(file);
    });
  }
  
  // Function to call OpenAI API
  async function analyzePivot(oldGoals, newGoals) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert business strategy analyst that specializes in detecting organizational pivots and goal shifts. 
            Analyze the differences between last quarter's goals and this quarter's goals to identify strategic pivots.
            Calculate a pivot_score from 0 to 1 where:
            - 0 means complete continuity (goals are nearly identical)
            - 0.5 means moderate pivot (significant shifts while maintaining some core focus areas)
            - 1 means complete pivot (total strategy overhaul with little continuity)
            
            Return your analysis in JSON format with the following structure:
            {
              "pivot_score": 0.XX, // number between 0-1
              "summary": [
                "Key point about leadership changes",
                "Key point about new priorities",
                "Key point about potential risks or benefits of this pivot"
              ]
            }`
          },
          {
            role: 'user',
            content: `Please analyze these two sets of quarterly goals:
            
            LAST QUARTER GOALS:
            ${oldGoals}
            
            THIS QUARTER GOALS:
            ${newGoals}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }
    
    return JSON.parse(data.choices[0].message.content);
  }
  
  // Function to analyze decisions using OpenAI API
  async function analyzeDecisions(decisions) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert business analyst specializing in detecting organizational pivot patterns and identifying potential conflicts in decision-making.
            
            Analyze the provided business decisions data to:
            1. Flag decisions that involve excessive pivoting (radical changes in direction)
            2. Highlight the reasons why these decisions were flagged
            3. Identify which major pivots are in conflict with each other
            
            Return your analysis in JSON format with the following structure:
            {
              "flagged_decisions": [
                {
                  "id": "Fire_Drill_ID",
                  "project": "Project_Name",
                  "date": "YYYY-MM-DD",
                  "sprint": "Sprint",
                  "changed_by": "Changed_By",
                  "reason": "Reason_Given", 
                  "impact": "Impact",
                  "why_flagged": "Explanation of why this was flagged as an excessive pivot",
                  "pivot_severity": 0.XX // number between 0-1 where higher indicates more severe pivot
                }
              ],
              "conflict_analysis": [
                {
                  "conflict_id": "unique_id",
                  "conflicting_decisions": ["Fire_Drill_ID1", "Fire_Drill_ID2", ...],
                  "conflict_description": "Description of why these decisions conflict",
                  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
                }
              ],
              "summary": {
                "total_decisions": XX,
                "flagged_count": XX,
                "conflict_count": XX,
                "top_pivot_areas": ["Area 1", "Area 2", "Area 3"],
                "overall_assessment": "Brief assessment of organization's pivot habits"
              }
            }`
          },
          {
            role: 'user',
            content: `Please analyze these business decisions from our CSV data:
            
            ${JSON.stringify(decisions, null, 2)}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }
    
    return JSON.parse(data.choices[0].message.content);
  }
  
  // Function to display decision analysis results
  function displayDecisionAnalysis(results) {
    const container = document.getElementById('csv-results-container');
    container.innerHTML = '';
    
    // Create summary card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'card results-card';
    
    const summaryHeader = document.createElement('h2');
    summaryHeader.textContent = 'Decision Analysis Summary';
    summaryCard.appendChild(summaryHeader);
    
    // Add timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.textContent = new Date().toLocaleString();
    summaryCard.appendChild(timestampDiv);
    
    // Summary content
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'decision-summary';
    
    const summaryContent = document.createElement('div');
    summaryContent.innerHTML = `
      <p><strong>Total Decisions Analyzed:</strong> ${results.summary.total_decisions}</p>
      <p><strong>Decisions Flagged for Excessive Pivoting:</strong> ${results.summary.flagged_count}</p>
      <p><strong>Conflicts Identified:</strong> ${results.summary.conflict_count}</p>
      <p><strong>Top Areas Affected by Pivots:</strong> ${results.summary.top_pivot_areas.join(', ')}</p>
      <p><strong>Overall Assessment:</strong> ${results.summary.overall_assessment}</p>
    `;
    
    summaryDiv.appendChild(summaryContent);
    summaryCard.appendChild(summaryDiv);
    
    // Add the summary card to the container
    container.appendChild(summaryCard);
    
    // Create conflicts card if there are conflicts
    if (results.conflict_analysis && results.conflict_analysis.length > 0) {
      const conflictsCard = document.createElement('div');
      conflictsCard.className = 'card results-card';
      
      const conflictsHeader = document.createElement('h2');
      conflictsHeader.textContent = 'Conflicting Decisions';
      conflictsCard.appendChild(conflictsHeader);
      
      // Create conflicts list
      results.conflict_analysis.forEach(conflict => {
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'conflict-items';
        
        const conflictContent = document.createElement('div');
        conflictContent.innerHTML = `
          <h3>Conflict #${conflict.conflict_id}</h3>
          <p><strong>Conflicting Decisions:</strong> ${conflict.conflicting_decisions.join(', ')}</p>
          <p><strong>Description:</strong> ${conflict.conflict_description}</p>
          <h4>Recommendations:</h4>
        `;
        
        const recommendationsList = document.createElement('ul');
        conflict.recommendations.forEach(rec => {
          const li = document.createElement('li');
          li.textContent = rec;
          recommendationsList.appendChild(li);
        });
        
        conflictContent.appendChild(recommendationsList);
        conflictDiv.appendChild(conflictContent);
        conflictsCard.appendChild(conflictDiv);
      });
      
      // Add the conflicts card to the container
      container.appendChild(conflictsCard);
    }
    
    // Create flagged decisions table
    const flaggedDecisionsCard = document.createElement('div');
    flaggedDecisionsCard.className = 'card results-card';
    
    const flaggedHeader = document.createElement('h2');
    flaggedHeader.textContent = 'Flagged Decisions';
    flaggedDecisionsCard.appendChild(flaggedHeader);
    
    // Create table
    const table = document.createElement('table');
    table.className = 'decision-table';
    
    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['ID', 'Project', 'Date', 'Sprint', 'Changed By', 'Reason', 'Impact', 'Why Flagged', 'Severity'];
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    
    results.flagged_decisions.forEach(decision => {
      const row = document.createElement('tr');
      row.className = 'flagged-decision';
      
      // Add cells
      const cells = [
        decision.id,
        decision.project,
        decision.date,
        decision.sprint,
        decision.changed_by,
        decision.reason,
        decision.impact,
        decision.why_flagged,
        decision.pivot_severity.toFixed(2)
      ];
      
      cells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        row.appendChild(td);
      });
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    flaggedDecisionsCard.appendChild(table);
    
    // Add the flagged decisions card to the container
    container.appendChild(flaggedDecisionsCard);
  }
  
  // Function to display pivot analysis results
  function displayResults() {
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    
    analysisHistory.forEach((result, index) => {
      // Create result card
      const resultCard = document.createElement('div');
      resultCard.className = 'card results-card';
      resultCard.dataset.index = index;
      
      // Create timestamp header
      const timestampDiv = document.createElement('div');
      timestampDiv.className = 'timestamp';
      timestampDiv.textContent = result.timestamp;
      resultCard.appendChild(timestampDiv);
      
      // Create score container
      const scoreContainer = document.createElement('div');
      scoreContainer.className = 'score-container';
      
      const scoreTitle = document.createElement('h2');
      scoreTitle.textContent = 'Pivot Score:';
      scoreContainer.appendChild(scoreTitle);
      
      const scoreValue = document.createElement('div');
      scoreValue.className = 'score';
      if (result.pivot_score < 0.3) {
        scoreValue.classList.add('score-low');
      } else if (result.pivot_score < 0.7) {
        scoreValue.classList.add('score-medium');
      } else {
        scoreValue.classList.add('score-high');
      }
      scoreValue.textContent = result.pivot_score.toFixed(2);
      scoreContainer.appendChild(scoreValue);
      
      resultCard.appendChild(scoreContainer);
      
      // Create summary container
      const summaryContainer = document.createElement('div');
      summaryContainer.className = 'summary-container';
      
      const summaryTitle = document.createElement('h2');
      summaryTitle.textContent = 'Summary:';
      summaryContainer.appendChild(summaryTitle);
      
      const summaryList = document.createElement('ul');
      result.summary.forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        summaryList.appendChild(li);
      });
      summaryContainer.appendChild(summaryList);
      
      resultCard.appendChild(summaryContainer);
      
      // Add the result card to the container
      container.appendChild(resultCard);
    });
  }
});