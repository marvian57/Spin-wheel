function randomColor(){
    r = Math.floor(Math.random() * 255);
    g = Math.floor(Math.random() * 255);
    b = Math.floor(Math.random() * 255);
    return {r,g,b}
}

function toRad(deg){
    return deg * (Math.PI / 180.0);
}

function randomRange(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function easeOutSine(x) {
    return Math.sin((x * Math.PI) / 2);
}

// get percent between 2 numbers
function getPercent(input,min,max){
    return (((input - min) * 100) / (max - min))/100
}

// Add this new easing function for better deceleration
function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

// Add this smoother easing function (quartic easing)
function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// Get CSS variables
function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Wheel configuration
let wheelConfig = null;
let currentCategoryIndex = 0;
let selections = [];

// Wheel properties
let segments = [];
let segColors = [];
let isSpinning = false;
let deg = 0;
let selection = document.getElementById('selection');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let canvasCenter = canvas.width / 2;

// Sound effects
const tickSound = new Audio('sounds/tick.mp3');
tickSound.volume = 0.5; // Lower volume for tick sound
const selectSound = new Audio('sounds/select.mp3');

// Initialize with default colors
const defaultColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4',
    '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107',
    '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'
];

// Add these variables at the top of your script
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Add these variables at the top with your other globals
let completedCategories = new Set();

// Add this configuration to define which categories are character stats
const CHARACTER_STATS = [
    'What is your race?',
    'How old are you?',
    'Birth Location',
    'Occupation',
    'Haki Type',
    'Devil Fruit',
    'What are you?' // Added this category
];

// Load wheel configuration from textarea
function loadWheelConfig() {
    try {
        const configText = document.getElementById('wheel-config').value;
        wheelConfig = JSON.parse(configText);
        
        // Reset to first category
        currentCategoryIndex = 0;
        loadCategory(currentCategoryIndex);
        
        // Load any saved selections
        loadSavedSelections();
        
        // Update the wheel display
        createWheel();
        updateSelectionDisplay();
    } catch (error) {
        console.error("Error loading wheel configuration:", error);
    }
}

// Load a specific category into the wheel
function loadCategory(index) {
    if (!wheelConfig || !wheelConfig.categories || index >= wheelConfig.categories.length) {
        return;
    }
    
    const category = wheelConfig.categories[index];
    
    // Skip if this category is already completed
    if (completedCategories.has(category.title)) {
        currentCategoryIndex++;
        if (currentCategoryIndex < wheelConfig.categories.length) {
            loadCategory(currentCategoryIndex);
        } else {
            document.getElementById('category-title').textContent = "Complete";
            wheelProcessing = true;
            disableSpinButton(true);
        }
        return;
    }
    
    document.getElementById('category-title').textContent = category.title;
    segments = category.options;
    
    // Reset rotation for new wheel
    deg = 0;
    canvas.style.transition = 'none';
    canvas.style.transform = 'rotate(0deg)';
    
    // Generate colors based on number of segments
    generateColors();
    
    // Create the wheel
    createWheel();
    
    // Update the selection text to show what's at the pointer initially
    updateSelectionDisplay();
}

// Add a function to update the selection display based on current wheel position
function updateSelectionDisplay() {
    if (!segments || segments.length === 0) return;
    
    const segmentAngle = 360 / segments.length;
    
    // Get current wheel position
    let currentRotation = 0;
    const currentStyle = window.getComputedStyle(canvas).transform;
    if (currentStyle && currentStyle !== 'none') {
        const matrix = new DOMMatrix(currentStyle);
        currentRotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180/Math.PI));
        if (currentRotation < 0) currentRotation += 360;
    }
    
    // Calculate which segment is at the pointer
    const normalizedAngle = currentRotation % 360;
    const relativeAngle = (360 - normalizedAngle + 90) % 360;
    const currentIndex = Math.floor(relativeAngle / segmentAngle) % segments.length;
    
    // Update the selection display
    if (currentIndex >= 0 && currentIndex < segments.length) {
        selection.textContent = segments[currentIndex];
    }
}

// Move to next category after selection
function nextCategory() {
    currentCategoryIndex++;
    
    if (currentCategoryIndex < wheelConfig.categories.length) {
        loadCategory(currentCategoryIndex);
    } else {
        // All categories completed - just show the title
        document.getElementById('category-title').textContent = "Complete";
        // Keep wheelProcessing true to block further spins
        wheelProcessing = true;
        disableSpinButton(true);
    }
}

// Generate colors for the segments
function generateColors() {
    segColors = [];
    for (let i = 0; i < segments.length; i++) {
        segColors.push(defaultColors[i % defaultColors.length]);
    }
}

// Update the createWheel function to add a black border
function createWheel() {
    // Get the actual canvas size from CSS
    const wheelSize = parseInt(getCssVar('--wheel-size')) || 350;
    
    // Handle high-DPI displays for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size (css pixels)
    canvas.style.width = wheelSize + 'px';
    canvas.style.height = wheelSize + 'px';
    
    // Set actual size in memory (scaled for high-DPI)
    canvas.width = wheelSize * dpr;
    canvas.height = wheelSize * dpr;
    
    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);
    
    // Clear with proper dimensions
    ctx.clearRect(0, 0, wheelSize, wheelSize);
    
    if (!segments || segments.length === 0) return;
    
    // Adjusted center point (using CSS size, not scaled canvas size)
    canvasCenter = wheelSize / 2;
    
    // Draw black border around the wheel
    ctx.beginPath();
    ctx.arc(canvasCenter, canvasCenter, canvasCenter - 5, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    
    let segmentAngle = (2 * Math.PI) / segments.length;
    
    // Get text styling from CSS
    const textColor = getCssVar('--wheel-text-color') || 'white';
    let fontSizePx = parseInt(getCssVar('--wheel-font-size')) || 10;
    let font = `bold ${fontSizePx}px monospace`;
    
    // Apply anti-aliasing
    ctx.textBaseline = 'middle';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw each segment
    for (let i = 0; i < segments.length; i++) {
        // Draw segment
        ctx.beginPath();
        ctx.fillStyle = segColors[i];
        ctx.moveTo(canvasCenter, canvasCenter);
        ctx.arc(canvasCenter, canvasCenter, canvasCenter - 10, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.lineTo(canvasCenter, canvasCenter);
        ctx.fill();
        
        // Draw segment border
        ctx.beginPath();
        ctx.moveTo(canvasCenter, canvasCenter);
        ctx.arc(canvasCenter, canvasCenter, canvasCenter - 10, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.lineTo(canvasCenter, canvasCenter);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(canvasCenter, canvasCenter);
        ctx.rotate(i * segmentAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = textColor;
        ctx.font = font;
        ctx.fillText(segments[i], canvasCenter - 20, 5);
        ctx.restore();
    }
}

// Update the highlightWinningSegment function to ensure the border is drawn
function highlightWinningSegment(winningIndex) {
    // Get the actual canvas size from CSS
    const wheelSize = parseInt(getCssVar('--wheel-size')) || 350;
    
    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Ensure canvas size is correct
    canvas.style.width = wheelSize + 'px';
    canvas.style.height = wheelSize + 'px';
    canvas.width = wheelSize * dpr;
    canvas.height = wheelSize * dpr;
    
    // Scale all drawing operations
    ctx.scale(dpr, dpr);
    
    // Clear with proper dimensions
    ctx.clearRect(0, 0, wheelSize, wheelSize);
    
    // Adjusted center point
    canvasCenter = wheelSize / 2;
    
    if (!segments || segments.length === 0) return;
    
    // Draw black border around the wheel - KEEP THIS HERE
    ctx.beginPath();
    ctx.arc(canvasCenter, canvasCenter, canvasCenter - 5, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    
    // Calculate segment angle
    let segmentAngle = (2 * Math.PI) / segments.length;
    
    // Get text styling from CSS
    const textColor = getCssVar('--wheel-text-color') || 'white';
    let fontSizePx = parseInt(getCssVar('--wheel-font-size')) || 10;
    let font = `bold ${fontSizePx}px monospace`;
    
    // Apply anti-aliasing
    ctx.textBaseline = 'middle';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw each segment
    for (let i = 0; i < segments.length; i++) {
        const isWinner = (i === winningIndex);
        
        // Draw segment with different opacity based on winner status
        ctx.beginPath();
        
        if (isWinner) {
            // Winner segment - full opacity
            ctx.fillStyle = segColors[i];
        } else {
            // Non-winner segments - reduced opacity
            const baseColor = segColors[i];
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`; // 30% opacity
        }
        
        // Draw the segment with exact same dimensions for all
        ctx.moveTo(canvasCenter, canvasCenter);
        ctx.arc(canvasCenter, canvasCenter, canvasCenter - 10, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.lineTo(canvasCenter, canvasCenter);
        ctx.fill();
        
        // Draw text
        ctx.save();
        ctx.translate(canvasCenter, canvasCenter);
        ctx.rotate(i * segmentAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        
        // Adjust text opacity based on winner status
        if (isWinner) {
            // Winner text - full brightness
            ctx.fillStyle = textColor;
        } else {
            // Non-winner text - dimmer
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        }
        
        // Use exact same positioning for all text
        ctx.font = font;
        ctx.fillText(segments[i], canvasCenter - 20, 5);
        ctx.restore();
    }
}

// Add this function to disable the spin button during spinning
function disableSpinButton(disable) {
    const spinButton = document.getElementById('spin-button');
    if (spinButton) {
        spinButton.disabled = disable;
        spinButton.style.opacity = disable ? '0.5' : '1';
        spinButton.style.cursor = disable ? 'not-allowed' : 'pointer';
    }
}

// More aggressive button disabling, using a global variable
let wheelProcessing = false;

// Fix the spin function to properly prevent spinning between selections
function spin() {
    if (isSpinning || wheelProcessing || !segments || segments.length === 0) return;
    
    isSpinning = true;
    wheelProcessing = true; // Set this flag to block any spins until completely done
    disableSpinButton(true); // Disable the button
    
    // 1. First, randomly select which segment we want to land on (this is the BACKEND selection)
    const winningIndex = Math.floor(Math.random() * segments.length);
    const winningSegment = segments[winningIndex];
    
    console.log("Backend selected winner:", winningSegment, "at index:", winningIndex);
    
    // 2. Calculate segment angle size
    const segmentAngle = 360 / segments.length;
    
    // 3. Calculate rotation needed to place the segment at the pointer (90 degrees)
    // This is the key part - we calculate exactly how much to rotate to place the winning segment at 90 degrees
    const segmentStart = winningIndex * segmentAngle;
    const segmentMiddle = segmentStart + (segmentAngle / 2);
    const rotationToSegment = 90 - segmentMiddle;
    
    // Debug the rotation calculation
    console.log("Segment angle:", segmentAngle);
    console.log("Segment start:", segmentStart);
    console.log("Segment middle:", segmentMiddle);
    console.log("Rotation needed to center segment at pointer:", rotationToSegment);
    
    // Get current wheel position
    let currentRotation = 0;
    const currentStyle = window.getComputedStyle(canvas).transform;
    if (currentStyle && currentStyle !== 'none') {
        const matrix = new DOMMatrix(currentStyle);
        currentRotation = Math.round(Math.atan2(matrix.b, matrix.a) * (180/Math.PI));
        if (currentRotation < 0) currentRotation += 360;
    }
    
    // Add extra full rotations (always 3 full rotations for consistent timing)
    const fullRotations = 3 * 360;
    
    // Calculate final rotation - ensure we're taking the shortest path
    currentRotation = currentRotation % 360;
    let rotationNeeded;
    
    if (rotationToSegment > currentRotation) {
        rotationNeeded = rotationToSegment - currentRotation;
    } else {
        rotationNeeded = 360 - (currentRotation - rotationToSegment);
    }
    
    // Add full rotations to the rotation needed to reach target
    const finalRotation = deg + rotationNeeded + fullRotations;
    
    console.log("Current rotation:", currentRotation);
    console.log("Rotation needed:", rotationNeeded);
    console.log("Final rotation to apply:", finalRotation);
    
    // Always use exactly 3 seconds for animation
    const spinDuration = 3000;
    
    // We'll use CSS transition for the smooth animation
    canvas.style.transition = `transform ${spinDuration/1000}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
    canvas.style.transform = `rotate(${finalRotation}deg)`;
    
    // Track last segment for sound effects
    let lastTrackedIndex = -1;
    
    // Set up live updates during spin
    const startTime = Date.now();
    const liveUpdateInterval = setInterval(() => {
        // Get current rotation from the transform property
        const transformValue = window.getComputedStyle(canvas).transform;
        let currentDeg;
        
        // Parse the actual transform value from the matrix
        if (transformValue && transformValue !== 'none') {
            const matrix = new DOMMatrix(transformValue);
            currentDeg = Math.round(Math.atan2(matrix.b, matrix.a) * (180/Math.PI));
            if (currentDeg < 0) currentDeg += 360;
            
            // Calculate which segment is currently at the pointer
            const normalizedAngle = currentDeg % 360;
            const relativeAngle = (360 - normalizedAngle + 90) % 360;
            const currentIndex = Math.floor(relativeAngle / segmentAngle) % segments.length;
            
            // Show current segment during spin
            if (currentIndex >= 0 && currentIndex < segments.length) {
                selection.textContent = segments[currentIndex];
                
                // Play tick sound when segment changes
                if (currentIndex !== lastTrackedIndex) {
                    lastTrackedIndex = currentIndex;
                    // Use cloneNode to allow overlapping sounds
                    tickSound.cloneNode(true).play().catch(e => console.log("Sound error:", e));
                }
            }
        }
    }, 50);
    
    // When spin completes - with error handling
    setTimeout(() => {
        isSpinning = false;
        // DO NOT re-enable the button here - remove this line
        // disableSpinButton(false);
        clearInterval(liveUpdateInterval);
        
        // Store final rotation
        deg = finalRotation;
        
        // FORCE the selection to match the backend winner regardless of visual position
        selection.textContent = winningSegment;
        
        // Play selection sound
        selectSound.play().catch(e => console.log("Sound error:", e));
        
        // Redraw wheel with highlighted winning segment
        setTimeout(() => {
            highlightWinningSegment(winningIndex);
        }, 50);
        
        // Debug logs to confirm final selection
        console.log("Spin completed, final rotation:", finalRotation);
        console.log("Backend winner (forced):", winningSegment);
        
        // Add to selections history with error checking
        if (currentCategoryIndex < wheelConfig.categories.length) {
            selections.push({
                category: wheelConfig.categories[currentCategoryIndex].title,
                selection: winningSegment
            });
        }
        
        // Add to selections history
        if (currentCategoryIndex < wheelConfig.categories.length) {
            const category = wheelConfig.categories[currentCategoryIndex].title;
            updateSelections(category, winningSegment);
        }
        
        // Delay before next category
        setTimeout(() => {
            nextCategory();
            
            // ONLY re-enable the button here IF there are more categories
            if (currentCategoryIndex < wheelConfig.categories.length) {
                wheelProcessing = false; // Only reset this when truly ready for next spin
                disableSpinButton(false);
            }
        }, 1500);
    }, spinDuration + 100);
}

// Update the selections history display
function updateSelectionsHistory() {
    // Implementation left empty in original code
};
    
// Add this at the start of your window.onload function
window.onload = function() {
    // Clear all saved data
    localStorage.clear();
    
    // Reset global variables
    currentCategoryIndex = 0;
    selections = [];
    completedCategories = new Set();
    wheelProcessing = false;
    isSpinning = false;
    deg = 0;
    
    // Load fresh wheel configuration
    loadWheelConfig();
    createWheel();
    
    // Set responsive wheel size based on screen size - optimized for mobile
    const viewportWidth = Math.min(window.innerWidth, window.innerHeight);
    const optimalSize = Math.min(300, viewportWidth * 0.7); // 70% of viewport or 300px, whichever is smaller
    
    // Set wheel size using CSS variables
    document.documentElement.style.setProperty('--wheel-size', optimalSize + 'px');
    
    // Rest of the onload code remains the same...
    loadWheelConfig();
    loadSavedSelections(); // Load saved selections after config
    
    // Add event listener to update selection display when canvas is touched/clicked
    canvas.addEventListener('click', function(e) {
        if (!isSpinning) {
            updateSelectionDisplay();
        }
    });
    
    // Update selection display initially
    updateSelectionDisplay();
    
    // Preload sounds with correct paths
    try {
        tickSound.load();
        selectSound.load();
        
        // Debug paths
        console.log("Base URL:", window.location.href);
        console.log("Attempted tick sound path:", new URL('./sounds/tick.mp3', window.location.href).href);
    } catch (e) {
        console.error("Sound loading error:", e);
    }
    
    // Handle browser autoplay restrictions
    document.addEventListener('click', function() {
        // Try with different path formats to handle the 404
        const paths = ['./sounds/tick.mp3', '../sounds/tick.mp3', 'sounds/tick.mp3', '/sounds/tick.mp3'];
        let unlockSound = null;
        
        for (let path of paths) {
            try {
                unlockSound = new Audio(path);
                unlockSound.volume = 0;
                unlockSound.play().then(() => {
                    unlockSound.pause();
                    unlockSound.currentTime = 0;
                    console.log("Sound unlocked successfully with path:", path);
                    // Update main sound paths if this one worked
                    tickSound.src = path;
                    selectSound.src = path.replace('tick.mp3', 'select.mp3');
                }).catch(e => console.log("Audio unlock failed with path:", path));
                break;
            } catch (e) {
                console.log("Failed to create audio with path:", path);
            }
        }
    }, {once: true});
    
    // Handle window resize for responsiveness
    window.addEventListener('resize', function() {
        const viewportWidth = Math.min(window.innerWidth, window.innerHeight);
        const optimalSize = Math.min(300, viewportWidth * 0.7);
        document.documentElement.style.setProperty('--wheel-size', optimalSize + 'px');
        createWheel(); // Redraw the wheel at new size
    });
};

// Also update the resize handler accordingly
window.addEventListener('resize', function() {
    const viewportWidth = Math.min(window.innerWidth, window.innerHeight);
    const optimalSize = Math.min(300, viewportWidth * 0.7);
    document.documentElement.style.setProperty('--wheel-size', optimalSize + 'px');
    createWheel(); // Redraw the wheel at new size
});

// Add this after your existing initialization code
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const settingsPanel = document.getElementById('settings-panel');
    
    // Toggle settings panel
    hamburger.addEventListener('click', function(e) {
        if (!isDragging) {
            this.classList.toggle('active');
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Make hamburger draggable
    hamburger.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
});

// Dragging functions
function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === document.getElementById('hamburger')) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        
        const hamburger = document.getElementById('hamburger');
        const panel = document.getElementById('settings-panel');
        
        hamburger.style.transform = `translate(${currentX}px, ${currentY}px)`;
        if (panel.style.display === 'block') {
            panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

// Update the updateSelections function to only track character stats
function updateSelections(category, selection) {
    // Only process if it's a character stat
    if (!CHARACTER_STATS.includes(category)) return;

    const selectionsList = document.getElementById('selections-list');
    const existingItem = Array.from(selectionsList.children).find(
        item => item.dataset.category === category
    );

    if (existingItem) {
        existingItem.querySelector('input').value = selection;
    } else {
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.dataset.category = category;
        item.innerHTML = `
            <div class="stat-entry">
                <span class="stat-label">${category}:</span>
                <input type="text" 
                       value="${selection}" 
                       onchange="updateCharacterStat('${category}', this.value)"
                       class="stat-value">
            </div>
        `;
        selectionsList.appendChild(item);
    }

    // Mark this category as completed
    completedCategories.add(category);
    saveToLocalStorage();
}

// Add this function to save selections
function saveToLocalStorage() {
    const selectionsList = document.getElementById('selections-list');
    const savedData = {
        selections: Array.from(selectionsList.children).map(item => ({
            category: item.dataset.category,
            selection: item.querySelector('input').value
        })),
        completedCategories: Array.from(completedCategories)
    };
    
    localStorage.setItem('wheelSelections', JSON.stringify(savedData));
}

// Add this function to load saved selections
function loadSavedSelections() {
    const saved = localStorage.getItem('wheelSelections');
    if (saved) {
        const savedData = JSON.parse(saved);
        completedCategories = new Set(savedData.completedCategories || []);
        
        // Clear existing selections display
        const selectionsList = document.getElementById('selections-list');
        selectionsList.innerHTML = '';
        
        // Restore all saved selections
        savedData.selections.forEach(item => {
            updateSelections(item.category, item.selection);
        });
        
        // Skip to first uncompleted category
        while (currentCategoryIndex < wheelConfig.categories.length && 
               completedCategories.has(wheelConfig.categories[currentCategoryIndex].title)) {
            currentCategoryIndex++;
        }
        
        if (currentCategoryIndex < wheelConfig.categories.length) {
            loadCategory(currentCategoryIndex);
        } else {
            document.getElementById('category-title').textContent = "Complete";
            wheelProcessing = true;
            disableSpinButton(true);
        }
    }
}

// Add function to update character stats
function updateCharacterStat(category, newValue) {
    if (!CHARACTER_STATS.includes(category)) return;
    
    // Update in selections array
    const selectionIndex = selections.findIndex(s => s.category === category);
    if (selectionIndex >= 0) {
        selections[selectionIndex].selection = newValue;
    } else {
        selections.push({
            category: category,
            selection: newValue
        });
    }

    // Mark category as completed
    completedCategories.add(category);
    
    // If this is the current category, move to next
    if (wheelConfig.categories[currentCategoryIndex]?.title === category) {
        nextCategory();
    }

    // Save to localStorage
    saveToLocalStorage();
    
    // Skip to next uncompleted category if needed
    while (currentCategoryIndex < wheelConfig.categories.length && 
           completedCategories.has(wheelConfig.categories[currentCategoryIndex].title)) {
        currentCategoryIndex++;
    }
    
    if (currentCategoryIndex < wheelConfig.categories.length) {
        loadCategory(currentCategoryIndex);
    }
}