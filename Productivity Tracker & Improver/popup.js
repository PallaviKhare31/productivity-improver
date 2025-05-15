document.addEventListener('DOMContentLoaded', () => {
  let daySelect = document.getElementById('daySelect');
  let siteList = document.getElementById('siteList');
  let refreshButton = document.getElementById('refreshButton');
  let siteSelect = document.getElementById('siteSelect');
  let hoursInput = document.getElementById('hoursInput');
  let minutesInput = document.getElementById('minutesInput');
  let setLimitButton = document.getElementById('setLimitButton');

  // Populate dropdown with dates for the past week
  populateDays(daySelect);

  // Load data for the selected day
  daySelect.addEventListener('change', () => {
    displayDataForDay(daySelect.value);
  });

  // Show data for today's date initially
  displayDataForDay(daySelect.value);

  // Refresh button functionality
  refreshButton.addEventListener('click', () => {
    displayDataForDay(daySelect.value);
  });

  // Set time limit functionality
  setLimitButton.addEventListener('click', () => {
    const selectedSite = siteSelect.value;
    const hours = parseInt(hoursInput.value);
    const minutes = parseInt(minutesInput.value);
    const totalMilliseconds = (hours * 3600 + minutes * 60) * 1000; // Convert to milliseconds

    chrome.storage.local.get('timeLimits', (data) => {
      const timeLimits = data.timeLimits || {};
      const today = getTodayDate();
      
      if (!timeLimits[today]) {
        timeLimits[today] = {};
      }

      timeLimits[today][selectedSite] = totalMilliseconds; // Set the time limit for the selected site
      chrome.storage.local.set({ timeLimits: timeLimits }, () => {
        alert(`Time limit set for ${selectedSite}: ${hours} hrs ${minutes} mins`);
      });
    });
  });

  function populateDays(selectElement) {
    let today = new Date();
    for (let i = 0; i < 7; i++) {
      let day = new Date();
      day.setDate(today.getDate() - i);
      let dateStr = day.toISOString().split('T')[0]; // YYYY-MM-DD
      let option = document.createElement('option');
      option.value = dateStr;
      option.textContent = dateStr;
      selectElement.appendChild(option);
    }
    populateSiteSelect();
  }

  function populateSiteSelect() {
    chrome.storage.local.get('siteTimes', (data) => {
      const siteTimes = data.siteTimes || {};
      const today = getTodayDate();
      const dayData = siteTimes[today] || {};

      siteSelect.innerHTML = ''; // Clear previous options

      for (let site in dayData) {
        let option = document.createElement('option');
        option.value = site;
        option.textContent = site;
        siteSelect.appendChild(option);
      }
    });
  }

  function displayDataForDay(day) {
    chrome.storage.local.get('siteTimes', (data) => {
      let siteTimes = data.siteTimes || {};
      let dayData = siteTimes[day] || {};

      siteList.innerHTML = ''; // Clear previous list

      for (let site in dayData) {
        let timeSpent = dayData[site]; // Time in milliseconds
        let formattedTime = formatTime(timeSpent); // Format to hours, minutes, seconds
        
        // Get the time limit for the current site
        chrome.storage.local.get('timeLimits', (limitData) => {
          const timeLimits = limitData.timeLimits || {};
          const today = getTodayDate();
          const limit = timeLimits[today] && timeLimits[today][site] ? timeLimits[today][site] : null;
          const formattedLimit = limit ? formatTime(limit) : 'No limit set';

          // Check if the time spent exceeds the limit
          let limitExceededMessage = '';
          let siteOutput = '';

          if (limit && timeSpent > limit) {
            const exceededTime = timeSpent - limit; // Time exceeded in milliseconds
            limitExceededMessage = ` (Time Limit Exceeded by: <span style="color: red;">${formatTime(exceededTime)}</span>)`;
            siteOutput = `<strong style="color: red;">${site}</strong>: <strong>${formattedTime}</strong> (<span style="color: blue;">Set Limit: ${formattedLimit}</span>)<strong style="color: red;">${limitExceededMessage}</strong>`;
          } else {
            siteOutput = `<span style="color: green;">${site}</span>: ${formattedTime} (<span style="color: blue;">Set Limit: ${formattedLimit}</span>)`;
          }

          let siteDiv = document.createElement('div');
          siteDiv.className = 'site';
          siteDiv.innerHTML = siteOutput; // Output site with appropriate color
          
          siteList.appendChild(siteDiv);
        });
      }

      // Update total time spent in storage to reflect the latest
      chrome.storage.local.set({ siteTimes: siteTimes });
    });
  }

  function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    return `${hours} hrs ${minutes} mins ${seconds} secs`;
  }

  function getTodayDate() {
    let today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
});
