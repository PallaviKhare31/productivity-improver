let siteTimes = {};
let currentUrl = "";
let timeSpent = 0; // Time spent in milliseconds
let timerInterval;

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateCurrentTabTime();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateCurrentTabTime();
  }
});

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  let today = new Date();
  return today.toISOString().split('T')[0];
}

// Update the time spent on the current tab
function updateCurrentTabTime() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const newUrl = new URL(tabs[0].url).hostname;
      const today = getTodayDate();

      // Save time spent for the previous URL if it's changed
      if (currentUrl !== newUrl) {
        if (currentUrl && timeSpent > 0) {
          if (!siteTimes[today]) {
            siteTimes[today] = {};
          }
          siteTimes[today][currentUrl] = (siteTimes[today][currentUrl] || 0) + timeSpent;
        }

        // Reset for the new URL
        currentUrl = newUrl;
        timeSpent = 0;
      }

      // Start the timer for the new URL
      timerInterval = setInterval(() => {
        timeSpent += 1000; // Increment time spent by 1 second
        chrome.storage.local.set({ siteTimes: siteTimes });
        checkTimeLimit(newUrl); // Check if time limit reached
      }, 1000);
    }
  });
}

// Check if the time limit is reached for the current site
function checkTimeLimit(site) {
  chrome.storage.local.get('timeLimits', (data) => {
    const timeLimits = data.timeLimits || {};
    const today = getTodayDate();
    const limit = timeLimits[today] && timeLimits[today][site] ? timeLimits[today][site] : null;

    if (limit && timeSpent >= limit) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', // Add a default icon path or use a generic icon
        title: 'Time Limit Reached',
        message: `You have reached your time limit for ${site}.`,
        priority: 2
      });
    }
  });
}

// Clean up the timer when a tab is closed
chrome.tabs.onRemoved.addListener(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
