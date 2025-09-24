console.log(
  "Facebook Token & Ad Accounts Extractor activated (FBTool.pro approach)"
);

function extractAccessToken() {
  console.log("🔍 Searching for Facebook access token...");

  const pageHTML = document.documentElement.outerHTML;
  const tokens = new Set();

  // Access token patterns (similar to FBTool.pro extension)
  const tokenPatterns = [
    /"accessToken":"([^"]+)"/g,
    /"access_token":"([^"]+)"/g,
    /accessToken=([^&"\s]+)/g,
    /access_token=([^&"\s]+)/g,
    /EAAG[0-9A-Za-z_-]{50,}/g, // Facebook app access token
    /EAA[0-9A-Za-z_-]{100,}/g, // Extended access token
  ];

  tokenPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(pageHTML)) !== null) {
      const token = match[1] || match[0];
      if (token && token.length > 50) {
        tokens.add(token);
      }
    }
  });

  if (tokens.size > 0) {
    console.log(
      "✅ Found access tokens:",
      Array.from(tokens).map((t) => t.substring(0, 20) + "...")
    );
    return Array.from(tokens)[0]; // Return first token
  }

  console.log("❌ No access token found");
  return null;
}

function extractDTSGToken() {
  console.log("🔍 Searching for DTSG token...");

  const pageHTML = document.documentElement.outerHTML;

  const dtsgPatterns = [
    /"DTSGInitialData",\[\],\{"token":"([^"]+)"/g,
    /DTSGInitData.*?"token":"([^"]+)"/g,
    /"dtsg":\{"token":"([^"]+)"/g,
  ];

  for (const pattern of dtsgPatterns) {
    const match = pattern.exec(pageHTML);
    if (match && match[1]) {
      console.log("✅ Found DTSG token:", match[1].substring(0, 20) + "...");
      return match[1];
    }
  }

  console.log("❌ No DTSG token found");
  return null;
}

function findAdAccounts() {
  console.log("🔍 Starting comprehensive ad account search...");

  const accounts = new Set();
  const pageHTML = document.documentElement.outerHTML;

  // Enhanced account ID patterns
  const patterns = [
    /act_(\d{8,})/g,
    /"adAccountID":\s*"(\d{8,})"/g,
    /"account_id":\s*"(\d{8,})"/g,
    /"accountID":\s*"(\d{8,})"/g,
    /"ad_account_id":\s*"(\d{8,})"/g,
    /account_id=(\d{8,})/g,
    /"id":\s*"act_(\d{8,})"/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(pageHTML)) !== null) {
      const accountId = match[1];
      if (accountId && accountId.length >= 8) {
        accounts.add("act_" + accountId);
      }
    }
  });

  // Also look in window objects
  try {
    if (window.require && window.require.cache) {
      const cache = window.require.cache;
      for (const key in cache) {
        if (cache[key] && cache[key].exports) {
          const exports = JSON.stringify(cache[key].exports);
          if (exports.includes("act_")) {
            const matches = exports.match(/act_(\d{8,})/g);
            if (matches) {
              matches.forEach((match) => accounts.add(match));
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("Could not access require cache:", e.message);
  }

  console.log("📊 Found accounts:", Array.from(accounts));
  return Array.from(accounts);
}

async function getAccountsViaAPI(accessToken) {
  if (!accessToken) return null;

  try {
    console.log("🌐 Trying Facebook Marketing API...");

    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}&fields=account_id,name,account_status,currency`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        console.log("✅ API Success! Found accounts:", data.data);
        return data.data;
      }
    } else {
      console.log("❌ API Error:", response.status, await response.text());
    }
  } catch (e) {
    console.log("❌ API Request failed:", e.message);
  }

  return null;
}

async function runCompleteExtraction() {
  console.log("🚀 Running complete Facebook data extraction...");

  const results = {
    accessToken: null,
    dtsgToken: null,
    adAccounts: [],
    apiAccounts: null,
  };

  // Step 1: Extract access token
  results.accessToken = extractAccessToken();

  // Step 2: Extract DTSG token
  results.dtsgToken = extractDTSGToken();

  // Step 3: Find ad accounts in HTML
  results.adAccounts = findAdAccounts();

  // Step 4: Try API if we have access token
  if (results.accessToken) {
    results.apiAccounts = await getAccountsViaAPI(results.accessToken);
  }

  // Display results
  const totalAccounts = new Set([
    ...results.adAccounts,
    ...(results.apiAccounts
      ? results.apiAccounts.map((acc) => `act_${acc.account_id}`)
      : []),
  ]);

  if (totalAccounts.size > 0 || results.accessToken || results.dtsgToken) {
    const message = [
      "🎉 Facebook Extraction Results:",
      results.accessToken
        ? `✅ Access Token: ${results.accessToken.substring(0, 20)}...`
        : "❌ No Access Token",
      results.dtsgToken
        ? `✅ DTSG Token: ${results.dtsgToken.substring(0, 20)}...`
        : "❌ No DTSG Token",
      `📊 Ad Accounts Found: ${Array.from(totalAccounts).join(", ")}`,
      results.apiAccounts
        ? `🌐 API Accounts: ${results.apiAccounts.length}`
        : "❌ API Failed",
    ].join("\n");

    console.log(message);

    // Store in chrome storage for popup access
    if (chrome && chrome.storage) {
      chrome.storage.local.set({
        lastExtraction: {
          timestamp: Date.now(),
          ...results,
          totalAccounts: Array.from(totalAccounts),
        },
      });
    }

    // Uncomment for testing
    // alert(message);
  } else {
    console.log("❌ No Facebook data found on this page");
  }

  return results;
}

// Auto-run on Facebook pages
if (location.href.includes("facebook.com")) {
  // Wait for page to load
  setTimeout(() => {
    runCompleteExtraction();
  }, 3000);

  // Also run when navigating (SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      if (
        url.includes("facebook.com") &&
        (url.includes("adsmanager") || url.includes("business"))
      ) {
        setTimeout(() => {
          console.log("🔄 Page changed, re-running extraction...");
          runCompleteExtraction();
        }, 2000);
      }
    }
  }).observe(document, { subtree: true, childList: true });
}

// Make functions available globally for manual testing
window.fbExtractor = {
  extractAccessToken,
  extractDTSGToken,
  findAdAccounts,
  getAccountsViaAPI,
  runCompleteExtraction,
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    runCompleteExtraction()
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        console.error("Extraction error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }

  if (request.action === "ping") {
    sendResponse({ success: true, message: "Content script ready" });
  }
});

console.log(
  "🎯 Facebook Token & Ad Accounts Extractor ready! (FBTool.pro approach)"
);
