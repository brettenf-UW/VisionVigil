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
    
    // Create dashboard container
    const dashboardContainer = document.createElement('div');
    dashboardContainer.className = 'dashboard-container';
    
    // Create summary stats cards
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-container';
    
    // Total decisions card
    const totalDecisionsCard = createStatCard(
      'Total Decisions', 
      results.summary.total_decisions,
      'analytics',
      'stat-neutral'
    );
    statsContainer.appendChild(totalDecisionsCard);
    
    // Flagged decisions card
    const flaggedDecisionsCard = createStatCard(
      'Excessive Pivots', 
      results.summary.flagged_count,
      'warning',
      'stat-high'
    );
    statsContainer.appendChild(flaggedDecisionsCard);
    
    // Conflicts card
    const conflictsCard = createStatCard(
      'Conflicts', 
      results.summary.conflict_count,
      'error',
      'stat-high'
    );
    statsContainer.appendChild(conflictsCard);
    
    dashboardContainer.appendChild(statsContainer);
    container.appendChild(dashboardContainer);
    
    // Create assessment card
    const assessmentCard = document.createElement('div');
    assessmentCard.className = 'card assessment-card';
    
    const assessmentHeader = document.createElement('div');
    assessmentHeader.className = 'assessment-header';
    
    const headerIcon = document.createElement('span');
    headerIcon.className = 'material-icons';
    headerIcon.textContent = 'insights';
    assessmentHeader.appendChild(headerIcon);
    
    const headerText = document.createElement('h2');
    headerText.textContent = 'Executive Summary';
    assessmentHeader.appendChild(headerText);
    
    // Add timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.textContent = new Date().toLocaleString();
    
    assessmentCard.appendChild(assessmentHeader);
    assessmentCard.appendChild(timestampDiv);
    
    // Summary content
    const summaryContent = document.createElement('div');
    summaryContent.className = 'assessment-content';
    summaryContent.innerHTML = `
      <p class="overall-assessment">${results.summary.overall_assessment}</p>
      <div class="pivot-areas">
        <h3>Top Areas Affected:</h3>
        <div class="tag-container">
          ${results.summary.top_pivot_areas.map(area => 
            `<span class="area-tag">${area}</span>`
          ).join('')}
        </div>
      </div>
    `;
    
    assessmentCard.appendChild(summaryContent);
    container.appendChild(assessmentCard);
    
    // Create flagged decisions section
    if (results.flagged_decisions && results.flagged_decisions.length > 0) {
      const flaggedSection = document.createElement('div');
      flaggedSection.className = 'card flagged-section';
      
      const flaggedHeader = document.createElement('div');
      flaggedHeader.className = 'section-header';
      
      const flaggedIcon = document.createElement('span');
      flaggedIcon.className = 'material-icons';
      flaggedIcon.textContent = 'warning';
      flaggedHeader.appendChild(flaggedIcon);
      
      const flaggedTitle = document.createElement('h2');
      flaggedTitle.textContent = 'Critical Pivot Decisions';
      flaggedHeader.appendChild(flaggedTitle);
      
      flaggedSection.appendChild(flaggedHeader);
      
      // Create flagged decisions cards
      const flaggedCardsContainer = document.createElement('div');
      flaggedCardsContainer.className = 'flagged-cards-container';
      
      results.flagged_decisions.forEach(decision => {
        const severityClass = decision.pivot_severity >= 0.8 ? 'severity-high' : 
                             decision.pivot_severity >= 0.6 ? 'severity-medium' : 'severity-low';
        
        const flaggedCard = document.createElement('div');
        flaggedCard.className = `flagged-card ${severityClass}`;
        
        flaggedCard.innerHTML = `
          <div class="flagged-card-header">
            <div class="flagged-id">${decision.id}</div>
            <div class="severity-indicator">Pivot: ${decision.pivot_severity.toFixed(2)}</div>
          </div>
          <div class="flagged-project">${decision.project}</div>
          <div class="flagged-details">
            <div class="detail-row"><span class="detail-label">Date:</span> ${decision.date}</div>
            <div class="detail-row"><span class="detail-label">Sprint:</span> ${decision.sprint}</div>
            <div class="detail-row"><span class="detail-label">By:</span> ${decision.changed_by}</div>
          </div>
          <div class="flagged-reason">
            <div class="detail-label">Reason:</div>
            <div>${decision.reason}</div>
          </div>
          <div class="flagged-impact">
            <div class="detail-label">Impact:</div>
            <div>${decision.impact}</div>
          </div>
          <div class="flagged-explanation">
            <div class="detail-label">Why Flagged:</div>
            <div>${decision.why_flagged}</div>
          </div>
        `;
        
        flaggedCardsContainer.appendChild(flaggedCard);
      });
      
      flaggedSection.appendChild(flaggedCardsContainer);
      container.appendChild(flaggedSection);
    }
    
    // Create conflicts section
    if (results.conflict_analysis && results.conflict_analysis.length > 0) {
      const conflictsSection = document.createElement('div');
      conflictsSection.className = 'card conflicts-section';
      
      const conflictsHeader = document.createElement('div');
      conflictsHeader.className = 'section-header';
      
      const conflictIcon = document.createElement('span');
      conflictIcon.className = 'material-icons';
      conflictIcon.textContent = 'warning_amber';
      conflictsHeader.appendChild(conflictIcon);
      
      const conflictTitle = document.createElement('h2');
      conflictTitle.textContent = 'Decision Conflicts';
      conflictsHeader.appendChild(conflictTitle);
      
      conflictsSection.appendChild(conflictsHeader);
      
      // Create conflicts accordion
      const accordionContainer = document.createElement('div');
      accordionContainer.className = 'accordion-container';
      
      results.conflict_analysis.forEach((conflict, index) => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        const accordionHeader = document.createElement('div');
        accordionHeader.className = 'accordion-header';
        accordionHeader.innerHTML = `
          <div class="conflict-title">Conflict #${index + 1}: ${getConflictSummary(conflict.conflict_description)}</div>
          <div class="conflict-ids">${conflict.conflicting_decisions.length} decisions</div>
          <span class="material-icons accordion-icon">expand_more</span>
        `;
        
        const accordionContent = document.createElement('div');
        accordionContent.className = 'accordion-content';
        accordionContent.innerHTML = `
          <div class="conflict-description">${conflict.conflict_description}</div>
          <div class="conflict-decisions">
            <div class="detail-label">Decisions Involved:</div>
            <div class="conflict-ids-list">${conflict.conflicting_decisions.join(', ')}</div>
          </div>
          <div class="recommendations">
            <div class="detail-label">Recommendations:</div>
            <ul class="recommendations-list">
              ${conflict.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        `;
        
        // Add click handler to toggle accordion
        accordionHeader.addEventListener('click', () => {
          accordionItem.classList.toggle('active');
          const icon = accordionHeader.querySelector('.accordion-icon');
          icon.textContent = accordionItem.classList.contains('active') ? 'expand_less' : 'expand_more';
        });
        
        accordionItem.appendChild(accordionHeader);
        accordionItem.appendChild(accordionContent);
        accordionContainer.appendChild(accordionItem);
      });
      
      conflictsSection.appendChild(accordionContainer);
      container.appendChild(conflictsSection);
    }
  }
  
  // Helper function to create a stat card
  function createStatCard(title, value, icon, statClass) {
    const card = document.createElement('div');
    card.className = `stat-card ${statClass}`;
    
    const iconElement = document.createElement('span');
    iconElement.className = 'material-icons stat-icon';
    iconElement.textContent = icon;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'stat-value';
    valueElement.textContent = value;
    
    const titleElement = document.createElement('div');
    titleElement.className = 'stat-title';
    titleElement.textContent = title;
    
    card.appendChild(iconElement);
    card.appendChild(valueElement);
    card.appendChild(titleElement);
    
    return card;
  }
  
  // Helper function to extract a brief summary from conflict description
  function getConflictSummary(description) {
    const maxLength = 40;
    if (description.length <= maxLength) return description;
    
    // Try to find a good breaking point
    const breakPoint = description.indexOf(' ', maxLength - 10);
    return breakPoint > 0 ? 
      description.substring(0, breakPoint) + '...' : 
      description.substring(0, maxLength) + '...';
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