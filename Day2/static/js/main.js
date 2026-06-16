// Global Application State
let appData = {
    updates: [],
    filteredUpdates: [],
    currentFilterType: 'all',
    currentSearchQuery: '',
    currentSort: 'newest',
    selectedUpdate: null,
    activeTemplateStyle: 'standard'
};

// SVG Circular Progress Ring constants
const RING_RADIUS = 11;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    syncText: document.getElementById('sync-text'),
    lastUpdated: document.getElementById('last-updated'),
    
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    typeFilterGroup: document.getElementById('type-filter-group'),
    sortSelect: document.getElementById('sort-select'),
    
    countTotal: document.getElementById('count-total'),
    countFeature: document.getElementById('count-feature'),
    countChange: document.getElementById('count-change'),
    countIssue: document.getElementById('count-issue'),
    
    feedLoader: document.getElementById('feed-loader'),
    feedEmpty: document.getElementById('feed-empty'),
    feedError: document.getElementById('feed-error'),
    errorMessage: document.getElementById('error-message'),
    releaseFeed: document.getElementById('release-feed'),
    
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    retryBtn: document.getElementById('retry-btn'),
    
    // Tweet Modal Elements
    tweetModal: document.getElementById('tweet-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    sendTweetBtn: document.getElementById('send-tweet-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charNumber: document.getElementById('char-number'),
    charWarningText: document.getElementById('char-warning-text'),
    progressCircle: document.querySelector('.progress-ring__circle'),
    templateButtons: document.querySelectorAll('.template-btn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Setup Circle Progress
    if (elements.progressCircle) {
        elements.progressCircle.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
        elements.progressCircle.style.strokeDashoffset = RING_CIRCUMFERENCE;
    }
    
    // Load data
    fetchReleaseNotes(false);
    
    // Bind Event Listeners
    setupEventListeners();
});

// Event Listeners Registration
function setupEventListeners() {
    // Refresh feed
    elements.refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    elements.retryBtn.addEventListener('click', () => fetchReleaseNotes(true));
    
    // Search
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.clearSearchBtn.addEventListener('click', clearSearch);
    
    // Type Filter
    elements.typeFilterGroup.addEventListener('click', handleTypeFilterClick);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Sort
    elements.sortSelect.addEventListener('change', handleSortChange);
    
    // Modal controls
    elements.closeModalBtn.addEventListener('click', hideTweetModal);
    elements.cancelModalBtn.addEventListener('click', hideTweetModal);
    elements.sendTweetBtn.addEventListener('click', publishTweet);
    elements.tweetTextarea.addEventListener('input', handleTweetTextareaInput);
    
    // Templates selectors
    elements.templateButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const button = e.currentTarget;
            elements.templateButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            appData.activeTemplateStyle = button.dataset.style;
            applyTweetTemplate();
        });
    });
}

// Fetch release notes from backend
async function fetchReleaseNotes(forceRefresh = false) {
    showState('loading');
    
    // Animate Refresh Button
    elements.refreshIcon.classList.add('spin-animation');
    elements.refreshBtn.disabled = true;
    if (forceRefresh) {
        elements.syncText.textContent = "Status: Fetching...";
    }
    
    const endpoint = forceRefresh ? '/api/releases/refresh' : '/api/releases';
    
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            appData.updates = data.updates;
            elements.lastUpdated.textContent = `Last sync: ${data.last_fetched}`;
            elements.syncText.textContent = data.from_cache ? "Status: Cached" : "Status: Synced";
            
            // Process and show data
            applyFiltersAndSort();
        } else {
            throw new Error(data.message || "Unknown error occurred.");
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        elements.errorMessage.textContent = error.message;
        elements.syncText.textContent = "Status: Sync Error";
        showState('error');
    } finally {
        elements.refreshIcon.classList.remove('spin-animation');
        elements.refreshBtn.disabled = false;
    }
}

// Display appropriate feed state
function showState(state) {
    elements.feedLoader.style.display = state === 'loading' ? 'flex' : 'none';
    elements.feedEmpty.style.display = state === 'empty' ? 'flex' : 'none';
    elements.feedError.style.display = state === 'error' ? 'flex' : 'none';
    elements.releaseFeed.style.display = state === 'feed' ? 'flex' : 'none';
}

// Filtering and Sorting Engine
function applyFiltersAndSort() {
    let filtered = [...appData.updates];
    
    // 1. Search Query Filter
    const query = appData.currentSearchQuery.toLowerCase().trim();
    if (query !== '') {
        filtered = filtered.filter(item => {
            return item.content_text.toLowerCase().includes(query) || 
                   item.type.toLowerCase().includes(query) || 
                   item.date.toLowerCase().includes(query);
        });
    }
    
    // 2. Type Filter
    if (appData.currentFilterType !== 'all') {
        filtered = filtered.filter(item => {
            return item.type.toLowerCase() === appData.currentFilterType;
        });
    }
    
    // 3. Sorting
    filtered.sort((a, b) => {
        // Since we are parsing date strings like "June 15, 2026", we parse dates.
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (appData.currentSort === 'newest') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    appData.filteredUpdates = filtered;
    
    // Update dashboard metrics
    updateMetrics();
    
    // Render
    renderFeed();
}

// Render release card components in HTML
function renderFeed() {
    elements.releaseFeed.innerHTML = '';
    
    if (appData.filteredUpdates.length === 0) {
        showState('empty');
        return;
    }
    
    appData.filteredUpdates.forEach(update => {
        const card = createCardElement(update);
        elements.releaseFeed.appendChild(card);
    });
    
    showState('feed');
    // Refresh icons inside dynamically created cards
    lucide.createIcons();
}

// Create individual release note card
function createCardElement(update) {
    const card = document.createElement('article');
    card.className = 'release-card';
    card.id = `card-${update.id}`;
    
    // Type Styling Mapper
    const typeLower = update.type.toLowerCase();
    let badgeClass = 'badge-gen';
    let iconClass = 'icon-gen';
    let iconName = 'info';
    
    if (typeLower.includes('feature')) {
        badgeClass = 'badge-feat';
        iconClass = 'icon-feat';
        iconName = 'sparkles';
    } else if (typeLower.includes('change')) {
        badgeClass = 'badge-chng';
        iconClass = 'icon-chng';
        iconName = 'git-commit';
    } else if (typeLower.includes('issue')) {
        badgeClass = 'badge-iss';
        iconClass = 'icon-iss';
        iconName = 'bug';
    } else if (typeLower.includes('deprecation')) {
        badgeClass = 'badge-dep';
        iconClass = 'icon-dep';
        iconName = 'alert-triangle';
    }
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-title-group">
                <div class="badge-wrapper ${iconClass}">
                    <i data-lucide="${iconName}"></i>
                </div>
                <div class="card-meta">
                    <span class="meta-type">${update.type}</span>
                    <span class="meta-date">${update.date}</span>
                </div>
            </div>
            
            <div class="card-actions">
                <span class="badge-text ${badgeClass}">${update.type}</span>
                <button class="btn-card-action tweet-btn-hover" title="Tweet this update" data-id="${update.id}">
                    <i data-lucide="twitter"></i>
                </button>
            </div>
        </div>
        <div class="card-body">
            ${update.content_html}
        </div>
    `;
    
    // Event listener for the specific Tweet button
    const tweetBtn = card.querySelector('.btn-card-action');
    tweetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTweetComposer(update);
    });
    
    return card;
}

// Recalculate Dashboard Stats based on current feed load
function updateMetrics() {
    const total = appData.updates.length;
    const features = appData.updates.filter(u => u.type.toLowerCase().includes('feature')).length;
    const changes = appData.updates.filter(u => u.type.toLowerCase().includes('change')).length;
    const issuesDepr = appData.updates.filter(u => {
        const t = u.type.toLowerCase();
        return t.includes('issue') || t.includes('deprecation');
    }).length;
    
    elements.countTotal.textContent = total;
    elements.countFeature.textContent = features;
    elements.countChange.textContent = changes;
    elements.countIssue.textContent = issuesDepr;
}

// Handle Search Operations
function handleSearchInput(e) {
    appData.currentSearchQuery = e.target.value;
    elements.clearSearchBtn.style.display = appData.currentSearchQuery.length > 0 ? 'flex' : 'none';
    applyFiltersAndSort();
}

function clearSearch() {
    elements.searchInput.value = '';
    appData.currentSearchQuery = '';
    elements.clearSearchBtn.style.display = 'none';
    applyFiltersAndSort();
}

// Handle Category Filter Click
function handleTypeFilterClick(e) {
    const target = e.target.closest('.pill');
    if (!target) return;
    
    // Update active class
    const pills = elements.typeFilterGroup.querySelectorAll('.pill');
    pills.forEach(p => p.classList.remove('active'));
    target.classList.add('active');
    
    appData.currentFilterType = target.dataset.type;
    applyFiltersAndSort();
}

function handleSortChange(e) {
    appData.currentSort = e.target.value;
    applyFiltersAndSort();
}

function resetFilters() {
    clearSearch();
    
    const pills = elements.typeFilterGroup.querySelectorAll('.pill');
    pills.forEach(p => p.classList.remove('active'));
    pills[0].classList.add('active');
    
    appData.currentFilterType = 'all';
    elements.sortSelect.value = 'newest';
    appData.currentSort = 'newest';
    
    applyFiltersAndSort();
}

// -------------------------------------------------------------
// Tweet Composer & Modal Engine
// -------------------------------------------------------------

function openTweetComposer(update) {
    appData.selectedUpdate = update;
    
    // Reset templates to professional by default
    appData.activeTemplateStyle = 'standard';
    elements.templateButtons.forEach(btn => {
        if (btn.dataset.style === 'standard') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Generate text and show
    applyTweetTemplate();
    
    // Open Modal
    elements.tweetModal.classList.add('active');
    elements.tweetTextarea.focus();
}

function hideTweetModal() {
    elements.tweetModal.classList.remove('active');
    appData.selectedUpdate = null;
}

// Apply Selected Style Template
function applyTweetTemplate() {
    if (!appData.selectedUpdate) return;
    
    const update = appData.selectedUpdate;
    const style = appData.activeTemplateStyle;
    
    const link = update.link || "https://docs.cloud.google.com/bigquery/docs/release-notes";
    const date = update.date;
    const type = update.type;
    
    let text = update.content_text;
    
    // Normalizing text whitespace
    text = text.replace(/\s+/g, ' ');
    
    let prefix = "";
    let suffix = "";
    
    if (style === 'standard') {
        prefix = `📢 BigQuery Update (${date})\nCategory: ${type}\n\n`;
        suffix = `\n\nRead more: ${link}\n#BigQuery #GCP`;
    } else if (style === 'punchy') {
        prefix = `⚡ BigQuery ${type} (${date}): `;
        suffix = `\n\nDocs: ${link}`;
    } else if (style === 'emoji') {
        prefix = `🔥 New BigQuery ${type}! (${date}) 🔥\n\n👉 `;
        suffix = `\n\n🔗 Details: ${link}\n#GoogleCloud #BigQuery #CloudCoding`;
    }
    
    const maxTextLen = 280 - prefix.length - suffix.length;
    
    // Truncate if necessary
    if (text.length > maxTextLen) {
        text = text.substring(0, maxTextLen - 3) + "...";
    }
    
    const finalTweet = `${prefix}${text}${suffix}`;
    elements.tweetTextarea.value = finalTweet;
    
    updateCharacterCount(finalTweet.length);
}

// Handle manual edits to text inside composer
function handleTweetTextareaInput(e) {
    updateCharacterCount(e.target.value.length);
}

// Character counter and circular indicator drawing
function updateCharacterCount(length) {
    elements.charNumber.textContent = 280 - length;
    
    // Manage Circular Progress
    const pct = Math.min(length / 280, 1);
    const offset = RING_CIRCUMFERENCE - (pct * RING_CIRCUMFERENCE);
    
    if (elements.progressCircle) {
        elements.progressCircle.style.strokeDashoffset = offset;
        
        // Color coding circular progress
        if (length > 280) {
            elements.progressCircle.style.stroke = 'var(--color-iss)'; // Red
            elements.charNumber.style.color = 'var(--color-iss)';
            elements.charWarningText.textContent = `Character limit exceeded by ${length - 280}!`;
            elements.sendTweetBtn.disabled = true;
        } else if (length >= 260) {
            elements.progressCircle.style.stroke = 'var(--color-dep)'; // Amber
            elements.charNumber.style.color = 'var(--color-dep)';
            elements.charWarningText.textContent = '';
            elements.sendTweetBtn.disabled = false;
        } else {
            elements.progressCircle.style.stroke = '#1d9bf0'; // Twitter Blue
            elements.charNumber.style.color = 'var(--color-text-muted)';
            elements.charWarningText.textContent = '';
            elements.sendTweetBtn.disabled = length === 0;
        }
    }
}

// Redirect to Twitter Web Intent
function publishTweet() {
    const text = elements.tweetTextarea.value;
    if (text.length === 0 || text.length > 280) return;
    
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, '_blank');
    
    hideTweetModal();
}
