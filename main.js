import { OPENAI_API_KEY } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const oldGoalsTextarea = document.getElementById('old-goals');
  const newGoalsTextarea = document.getElementById('new-goals');
  const analyzeButton = document.getElementById('analyze-btn');
  const loadingElement = document.getElementById('loading');
  const resultsContainer = document.getElementById('results-container');
  
  // History of analyses
  let analysisHistory = [];
  
  // Create results container if it doesn't exist
  if (!resultsContainer) {
    const container = document.createElement('div');
    container.id = 'results-container';
    container.className = 'results-container';
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
  
  // Function to display all results
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