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

// Character stats and power calculation
const characterStats = {
    race: null,
    willOfD: false,
    birthplace: null,
    occupation: null,
    hasHaki: false,
    hakiType: null,
    hakiLevel: 0,
    hasDevilFruit: false,
    devilFruit: null,
    devilFruitMastery: 0,
    fightingStyle: null,
    fightingIQ: null,
    age: null,
    power: 0
};





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

// Replace your existing loadCategory function with this corrected version
function loadCategory(index) {
    if (!wheelConfig || !wheelConfig.categories || index >= wheelConfig.categories.length) {
        return;
    }
    
    const category = wheelConfig.categories[index];
    console.log(`Loading category: ${category.title}`);
    
    // Check if this category has a condition
    if (category.conditional) {
        const dependsOn = category.conditional.category;
        const requiredValue = category.conditional.value;
        
        console.log(`This category depends on "${dependsOn}" being "${requiredValue}"`);
        
        // Find the dependency's statKey
        let dependsOnStatKey = null;
        for (const cat of wheelConfig.categories) {
            if (cat.title === dependsOn) {
                dependsOnStatKey = cat.statKey;
                break;
            }
        }
        
        // Get the actual value from characterStats
        const actualValue = characterStats[dependsOnStatKey];
        
        console.log(`Dependency check: ${dependsOn} (${dependsOnStatKey}) value = "${actualValue}"`);
        console.log(`Required value = "${requiredValue}"`);
        
        if (actualValue === true ? requiredValue !== "Yes" : 
            actualValue === false ? requiredValue !== "No" : 
            String(actualValue) !== String(requiredValue)) {
            console.log(`❌ Condition NOT met for ${category.title}, skipping to next category`);
            currentCategoryIndex++;
            if (currentCategoryIndex < wheelConfig.categories.length) {
                loadCategory(currentCategoryIndex);
            } else {
                document.getElementById('category-title').textContent = "Complete";
            }
            return;
        }
        
        console.log(`✅ Condition MET for ${category.title}, showing this category`);
    }
    
    // Load the category
    document.getElementById('category-title').textContent = category.title;
    segments = category.options;
    
    // Generate colors
    generateColors();
    
    // Create wheel
    createWheel();
    
    // Update the selection display
    setTimeout(() => updateSelectionDisplay(), 10);
    
    // Enable spin button if needed
    if (!wheelProcessing) {
        disableSpinButton(false);
    }
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

// Update createWheel to match the text rendering from highlightWinningSegment
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
    
    // Calculate font size based on number of segments and text length - MATCH HIGHLIGHT FUNCTION
    let fontSizePx = parseInt(getCssVar('--wheel-font-size')) || 10; // Get from CSS like highlightWinningSegment
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
        
        // Draw text - USE EXACT SAME CODE AS highlightWinningSegment
        ctx.save();
        ctx.translate(canvasCenter, canvasCenter);
        ctx.rotate(i * segmentAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = textColor;
        
        // Handle long text - EXACTLY AS IN highlightWinningSegment
        const text = segments[i];
        const maxWidth = canvasCenter - 30; // Maximum width for text
        
        // Use text measurement to ensure text fits
        ctx.font = font;
        const textWidth = ctx.measureText(text).width;
        
        // If text is too long, adjust it - SAME AS highlightWinningSegment
        if (textWidth > maxWidth) {
            // For very long text, handle it specially
            if (text.length > 20) {
                if (text.includes("Model:")) {
                    // Split at "Model:"
                    const parts = text.split("Model:");
                    const line1 = parts[0].trim();
                    const line2 = "Model:" + (parts[1] || "").trim();
                    
                    // Draw two-line text
                    ctx.font = `bold ${fontSizePx-1}px monospace`;
                    ctx.fillText(line1, canvasCenter - 20, -fontSizePx/2);
                    ctx.fillText(line2, canvasCenter - 20, fontSizePx);
                } 
                else if (text.includes("no Mi")) {
                    // Split at "no Mi"
                    const parts = text.split("no Mi");
                    const line1 = parts[0] + "no Mi";
                    const line2 = parts[1] ? parts[1].trim() : "";
                    
                    // Draw two-line text
                    ctx.font = `bold ${fontSizePx-1}px monospace`;
                    ctx.fillText(line1, canvasCenter - 20, -fontSizePx/2);
                    if (line2) ctx.fillText(line2, canvasCenter - 20, fontSizePx);
                }
                else {
                    // For other long text, just use a smaller font
                    ctx.font = `bold ${fontSizePx-2}px monospace`;
                    ctx.fillText(text, canvasCenter - 20, 5);
                }
            } else {
                // For moderately long text, just use a smaller font
                ctx.font = `bold ${fontSizePx-1}px monospace`;
                ctx.fillText(text, canvasCenter - 20, 5);
            }
        } else {
            // Single-line text at y=0
            ctx.fillText(text, canvasCenter - 20, 0);
        }
        
        ctx.restore();
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(canvasCenter, canvasCenter, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
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
        
        // Handle long text
        const text = segments[i];
        const maxWidth = canvasCenter - 30; // Maximum width for text
        
        // Use text measurement to ensure text fits
        ctx.font = font;
        const textWidth = ctx.measureText(text).width;
        
        // If text is too long, adjust it
        if (textWidth > maxWidth) {
            // For very long text, handle it specially
            if (text.length > 20) {
                if (text.includes("Model:")) {
                    // Split at "Model:"
                    const parts = text.split("Model:");
                    const line1 = parts[0].trim();
                    const line2 = "Model:" + (parts[1] || "").trim();
                    
                    // Draw two-line text
                    ctx.font = `bold ${fontSizePx-1}px monospace`;
                    ctx.fillText(line1, canvasCenter - 20, -fontSizePx/2);
                    ctx.fillText(line2, canvasCenter - 20, fontSizePx);
                } 
                else if (text.includes("no Mi")) {
                    // Split at "no Mi"
                    const parts = text.split("no Mi");
                    const line1 = parts[0] + "no Mi";
                    const line2 = parts[1] ? parts[1].trim() : "";
                    
                    // Draw two-line text
                    ctx.font = `bold ${fontSizePx-1}px monospace`;
                    ctx.fillText(line1, canvasCenter - 20, -fontSizePx/2);
                    if (line2) ctx.fillText(line2, canvasCenter - 20, fontSizePx);
                }
                else {
                    // For other long text, just use a smaller font
                    ctx.font = `bold ${fontSizePx-2}px monospace`;
                    ctx.fillText(text, canvasCenter - 20, 5);
                }
            } else {
                // For moderately long text, just use a smaller font
                ctx.font = `bold ${fontSizePx-1}px monospace`;
                ctx.fillText(text, canvasCenter - 20, 5);
            }
        } else {
            // Single-line text at y=0
            ctx.fillText(text, canvasCenter - 20, 0);
        }
        
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

// Add this weights configuration
const optionWeights = {
    "Do you have haki?": {
        base: { "Yes": 40, "No": 60 }, // Base chance: 40% Yes, 60% No
        modifiers: {
            race: {
                "Humans": { "Yes": 10, "No": -10 }, // Humans: 50% Yes, 50% No
                "Lunarians": { "Yes": 20, "No": -20 }, // Lunarians: 60% Yes, 40% No
                "Giants": { "Yes": 15, "No": -15 } // Giants: 55% Yes, 45% No
            },
            occupation: {
                "Marine": { "Yes": 15, "No": -15 }, // Marines: 55% Yes, 45% No
                "Pirate": { "Yes": 10, "No": -10 },
                "Revolutionary Army": { "Yes": 20, "No": -20 },
                "Civilian": { "Yes": -20, "No": 20 } // Civilians: 20% Yes, 80% No
            }
        }
    },
    "Do you have a devil fruit?": {
        base: { "Yes": 30, "No": 70 }, // Base chance: 30% Yes, 70% No
        modifiers: {
            race: {
                "Fishmen": { "Yes": -10, "No": 10 }, // Fishmen: 20% Yes, 80% No
                "Merfolk": { "Yes": -10, "No": 10 } // Merfolk: 20% Yes, 80% No
            },
            occupation: {
                "Marine": { "Yes": 5, "No": -5 }, // Marines: 35% Yes, 65% No
                "Pirate": { "Yes": 15, "No": -15 }, // Pirates: 45% Yes, 55% No
                "World Government": { "Yes": 10, "No": -10 } // WG: 40% Yes, 60% No
            }
        }
    }
};

// Fix the spin function to properly prevent spinning between selections
function spin() {
    if (isSpinning || wheelProcessing || !segments || segments.length === 0) return;
    
    isSpinning = true;
    wheelProcessing = true; // Set this flag to block any spins until completely done
    disableSpinButton(true); // Disable the button
    
    // Get current category
    const currentCategory = wheelConfig.categories[currentCategoryIndex].title;
    
    // Calculate weights for this category if available
    let winningIndex = 0;
    
    if (optionWeights[currentCategory]) {
        // Start with base weights
        const weightConfig = optionWeights[currentCategory];
        let weights = {...weightConfig.base};
        
        console.log(`Using weighted selection for ${currentCategory}`);
        console.log(`Base weights:`, weights);
        
        // Apply race modifiers if race is set
        if (weightConfig.modifiers.race && characterStats.race) {
            const raceModifiers = weightConfig.modifiers.race[characterStats.race];
            if (raceModifiers) {
                for (const option in raceModifiers) {
                    weights[option] = Math.max(0, (weights[option] || 0) + raceModifiers[option]);
                }
                console.log(`After race modifiers:`, weights);
            }
        }
        
        // Apply occupation modifiers if occupation is set
        if (weightConfig.modifiers.occupation && characterStats.occupation) {
            const occupationModifiers = weightConfig.modifiers.occupation[characterStats.occupation];
            if (occupationModifiers) {
                for (const option in occupationModifiers) {
                    weights[option] = Math.max(0, (weights[option] || 0) + occupationModifiers[option]);
                }
                console.log(`After occupation modifiers:`, weights);
            }
        }
        
        // Normalize weights to ensure they sum to 100
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        for (const option in weights) {
            weights[option] = (weights[option] / totalWeight) * 100;
        }
        
        console.log(`Normalized weights:`, weights);
        
        // Use weights for selection
        const randomValue = Math.random() * 100;
        let cumulativeWeight = 0;
        
        // Map option names to their indices in the segments array
        const optionToIndex = {};
        segments.forEach((segment, index) => {
            optionToIndex[segment] = index;
        });
        
        // Select based on weights
        for (const option in weights) {
            cumulativeWeight += weights[option];
            if (randomValue <= cumulativeWeight && optionToIndex[option] !== undefined) {
                winningIndex = optionToIndex[option];
                break;
            }
        }
        
        console.log(`Selected ${segments[winningIndex]} with random value ${randomValue}`);
    } else {
        // Use standard random selection
        winningIndex = Math.floor(Math.random() * segments.length);
        console.log(`Using standard random selection for ${currentCategory}`);
    }
    
    const winningSegment = segments[winningIndex];
    
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
        clearInterval(liveUpdateInterval);
        
        // Store final rotation
        deg = finalRotation;
        
        // FORCE the selection to match the backend winner
        selection.textContent = winningSegment;
        
        // Play selection sound
        selectSound.play().catch(e => console.log("Sound error:", e));
        
        // Highlight winning segment
        highlightWinningSegment(winningIndex);
        
        // Add to selections history
        if (currentCategoryIndex < wheelConfig.categories.length) {
            const category = wheelConfig.categories[currentCategoryIndex].title;
            
            // Wait a moment before updating selections and moving to next category
            setTimeout(() => {
                // Update with exact string matching - but DON'T auto-advance yet
                updateSelections(category, winningSegment, false); // Pass false to prevent auto-advancing
                
                // THEN wait another moment before moving to next category
                setTimeout(() => {
                    nextCategory();
                    
                    // Only re-enable button if there are more categories
                    if (currentCategoryIndex < wheelConfig.categories.length) {
                        wheelProcessing = false;
                        disableSpinButton(false);
                    }
                }, 1000); // Wait 1 second before moving to next category
            }, 500); // Wait 0.5 seconds before updating selections
        }
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

// Fix the updateSelections function to ensure values are stored as strings
function updateSelections(category, selection, skipNext = true) {
    // Find the statKey for this category
    let statKey = null;
    for (const cat of wheelConfig.categories) {
        if (cat.title === category) {
            statKey = cat.statKey;
            break;
        }
    }

    // Update the character stats directly
    if (statKey) {
        // Always store as string to fix comparison issues
        characterStats[statKey] = String(selection);
        console.log(`Updated character stat: ${statKey} = "${selection}"`);
    }
    
    // Debug the current character stats
    console.log("Current character stats:", JSON.stringify(characterStats));

    // Update UI display
    const selectionsList = document.getElementById('selections-list');
    const existingItem = Array.from(selectionsList.children).find(
        item => item.dataset.category === category
    );

    if (existingItem) {
        // Check if the item has an input or select element
        const inputElement = existingItem.querySelector('input');
        const selectElement = existingItem.querySelector('select');
        
        if (inputElement) {
            inputElement.value = selection;
        } else if (selectElement) {
            // For dropdowns, find and select the matching option
            for (let i = 0; i < selectElement.options.length; i++) {
                if (selectElement.options[i].value === selection) {
                    selectElement.selectedIndex = i;
                    break;
                }
            }
        }
    } else {
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.dataset.category = category;
        
        // Different input type based on options
        let inputHtml = '';
        
        // Get the category object for options
        const categoryObj = wheelConfig.categories.find(cat => cat.title === category);
        
        // For Yes/No questions, use dropdown
        if (categoryObj && categoryObj.options && 
            categoryObj.options.length === 2 && 
            categoryObj.options.includes("Yes") && 
            categoryObj.options.includes("No")) {
            
            inputHtml = `
                <select class="stat-value" 
                        onchange="updateCharacterStat('${category}', this.value)">
                    <option value="" ${selection === "" ? "selected" : ""}>Select...</option>
                    <option value="Yes" ${selection === "Yes" ? "selected" : ""}>Yes</option>
                    <option value="No" ${selection === "No" ? "selected" : ""}>No</option>
                </select>
            `;
        } 
        // For options with limited choices, use dropdown
        else if (categoryObj && categoryObj.options && categoryObj.options.length > 0) {
            inputHtml = `
                <select class="stat-value" 
                        onchange="updateCharacterStat('${category}', this.value)">
                    <option value="">Select...</option>
                    ${categoryObj.options.map(opt => 
                        `<option value="${opt}" ${selection === opt ? "selected" : ""}>${opt}</option>`
                    ).join('')}
                </select>
            `;
        } 
        // For free-form input, use text field
        else {
            inputHtml = `
                <input type="text" 
                       value="${selection}" 
                       placeholder="Enter value..." 
                       onchange="updateCharacterStat('${category}', this.value)"
                       class="stat-value">
            `;
        }
        
        item.innerHTML = `
            <div class="stat-entry">
                <span class="stat-label">${category}:</span>
                ${inputHtml}
            </div>
        `;
        
        selectionsList.appendChild(item);
    }

    // Mark category as completed
    completedCategories.add(category);
    
    // Save to localStorage
    saveToLocalStorage();

    // Update power calculation after stats change
    if (typeof calculatePower === 'function') {
        console.log("Calculating power after selection update");
        calculatePower();
    }
    if (typeof updatePowerDisplay === 'function') {
        updatePowerDisplay();
    }
    
    // Skip to next category if this was a manual update and skipNext is true
    if (skipNext) {
        // Skip the current category if it matches what we just updated
        if (currentCategoryIndex < wheelConfig.categories.length && 
            wheelConfig.categories[currentCategoryIndex].title === category) {
            nextCategory();
        }
    }
}

// Add this function to save selections
function saveToLocalStorage() {
    const selectionsList = document.getElementById('selections-list');
    const savedData = {
        selections: Array.from(selectionsList.children).map(item => {
            const inputElement = item.querySelector('input');
            const selectElement = item.querySelector('select');
            
            return {
                category: item.dataset.category,
                selection: inputElement ? inputElement.value : 
                          (selectElement ? selectElement.options[selectElement.selectedIndex].value : "")
            };
        }),
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
    // Find the statKey for this category
    let statKey = null;
    for (const cat of wheelConfig.categories) {
        if (cat.title === category) {
            statKey = cat.statKey;
            break;
        }
    }

    // Update the character stats directly
    if (statKey) {
        // Always store as string to fix comparison issues
        characterStats[statKey] = String(newValue);
        console.log(`Manual update: ${statKey} = "${newValue}"`);
        
        // Special case: Handle race-specific rules
        if (statKey === "race" && newValue !== "Humans") {
            // If race is not human, automatically set Will of D to No
            characterStats.willOfD = "No";
            completedCategories.add("Do you have the Will of D?");
        }
    }

    // Mark this category as completed
    completedCategories.add(category);
    
    // Update UI display
    updateSelections(category, newValue, false);
    
    // Save to localStorage
    saveToLocalStorage();
    
    // If this is the current category, move to next
    if (currentCategoryIndex < wheelConfig.categories.length && 
        wheelConfig.categories[currentCategoryIndex].title === category) {
        nextCategory();
    }
    
    // Skip any categories that are already completed
    while (currentCategoryIndex < wheelConfig.categories.length && 
           completedCategories.has(wheelConfig.categories[currentCategoryIndex].title)) {
        currentCategoryIndex++;
    }
    
    // Load next category or finish
    if (currentCategoryIndex < wheelConfig.categories.length) {
        loadCategory(currentCategoryIndex);
    } else {
        document.getElementById('category-title').textContent = "Complete";
        wheelProcessing = true;
        disableSpinButton(true);
    }
    
    // ADD THESE LINES to update power after stat changes
    console.log("Calling calculatePower after stat update");
    calculatePower();
    updatePowerDisplay();
}

// Add special age animation
function spinWithAnimation() {
    const category = wheelConfig.categories[currentCategoryIndex];
    
    if (category.animation === "random" && category.title === "How old are you?") {
        // Simulate random age selection with animation
        const options = category.options;
        let counter = 0;
        const totalIterations = 20; // How many flashes
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * options.length);
            selection.textContent = options[randomIndex];
            counter++;
            
            if (counter >= totalIterations) {
                clearInterval(interval);
                // Proceed with normal spin
                spin();
            }
        }, 100);
    } else {
        // Regular spin
        spin();
    }
}
// Update the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const settingsPanel = document.getElementById('settings-panel');
    const adminToggle = document.getElementById('admin-mode');
    const adminControls = document.getElementById('admin-controls');
    const categoryShortcuts = document.getElementById('category-shortcuts');
    
    // Toggle settings panel
  // Replace your existing hamburger click event in the DOMContentLoaded event
hamburger.addEventListener('click', function(e) {
    if (!isDragging) {
        // Simple toggle with clear visibility check
        if (settingsPanel.style.display === 'block') {
            settingsPanel.style.display = 'none';
        } else {
            settingsPanel.style.display = 'block';
            initializeSettingsPanel();
        }
    }
});

    // Make hamburger draggable
    hamburger.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Toggle admin mode
    adminToggle.addEventListener('change', function() {
        if (this.checked) {
            adminControls.style.display = 'block';
            // Build category shortcuts
            buildCategoryShortcuts();
        } else {
            adminControls.style.display = 'none';
        }
    });
});

// Add this function to initialize the settings panel with editable inputs
function initializeSettingsPanel() {
    if (!wheelConfig || !wheelConfig.categories) return;
    
    // Loop through all categories and add them to the settings panel
    wheelConfig.categories.forEach(category => {
        // Skip categories without titles
        if (!category.title) return;
        
        // Check if this category already exists in the selections list
        const selectionsList = document.getElementById('selections-list');
        const existingItem = Array.from(selectionsList.children).find(
            item => item.dataset.category === category.title
        );
        
        // Get current value from characterStats if available
        let statKey = null;
        for (const cat of wheelConfig.categories) {
            if (cat.title === category.title) {
                statKey = cat.statKey;
                break;
            }
        }
        
        const currentValue = statKey ? characterStats[statKey] || "" : "";
        
        // If it doesn't exist, add it with an empty or current value
        if (!existingItem) {
            const item = document.createElement('div');
            item.className = 'selection-item';
            item.dataset.category = category.title;
            
            // Different input type based on options
            let inputHtml = '';
            
            // For Yes/No questions, use dropdown
            if (category.options && 
                category.options.length === 2 && 
                category.options.includes("Yes") && 
                category.options.includes("No")) {
                
                inputHtml = `
                    <select class="stat-value" 
                            onchange="updateCharacterStat('${category.title}', this.value)">
                        <option value="" ${currentValue === "" ? "selected" : ""}>Select...</option>
                        <option value="Yes" ${currentValue === "Yes" ? "selected" : ""}>Yes</option>
                        <option value="No" ${currentValue === "No" ? "selected" : ""}>No</option>
                    </select>
                `;
            } 
            // For options with limited choices, use dropdown
            else if (category.options && category.options.length > 0) {
                inputHtml = `
                    <select class="stat-value" 
                            onchange="updateCharacterStat('${category.title}', this.value)">
                        <option value="">Select...</option>
                        ${category.options.map(opt => 
                            `<option value="${opt}" ${currentValue === opt ? "selected" : ""}>${opt}</option>`
                        ).join('')}
                    </select>
                `;
            } 
            // For free-form input, use text field
            else {
                inputHtml = `
                    <input type="text" 
                           value="${currentValue}" 
                           placeholder="Enter value..." 
                           onchange="updateCharacterStat('${category.title}', this.value)"
                           class="stat-value">
                `;
            }
            
            item.innerHTML = `
                <div class="stat-entry">
                    <span class="stat-label">${category.title}:</span>
                    ${inputHtml}
                </div>
            `;
            
            selectionsList.appendChild(item);
        }
        // If it exists but doesn't have the right value, update it
        else if (currentValue && existingItem.querySelector('input, select').value !== currentValue) {
            const input = existingItem.querySelector('input, select');
            if (input.tagName === 'SELECT') {
                // For dropdowns, find and select the option
                for (let i = 0; i < input.options.length; i++) {
                    if (input.options[i].value === currentValue) {
                        input.selectedIndex = i;
                        break;
                    }
                }
            } else {
                // For text inputs
                input.value = currentValue;
            }
        }
    });
    
    // Initialize power display
    updatePowerDisplay();
}

// Update the hamburger click event handler to properly toggle
const hamburgerClickHandler = function(e) {
    if (!isDragging) {
        // Simple AND RELIABLE toggle with explicit check
        if (settingsPanel.style.display === 'block') {
            settingsPanel.style.display = 'none';
        } else {
            settingsPanel.style.display = 'block';
            initializeSettingsPanel();
        }
    }
};


// (since they're referenced in the correct DOMContentLoaded event handler)
function buildCategoryShortcuts() {
    const categoryShortcuts = document.getElementById('category-shortcuts');
    // Clear existing shortcuts
    categoryShortcuts.innerHTML = '';
    
    // Add shortcuts for each category
    if (wheelConfig && wheelConfig.categories) {
        wheelConfig.categories.forEach((category, index) => {
            const shortcut = document.createElement('div');
            shortcut.className = 'category-shortcut';
            shortcut.textContent = category.title;
            shortcut.dataset.index = index;
            
            // Add completed indicator
            if (completedCategories.has(category.title)) {
                shortcut.style.textDecoration = 'line-through';
                shortcut.style.opacity = '0.7';
            }
            
            shortcut.addEventListener('click', function() {
                // Jump to this category
                adminJumpToCategory(parseInt(this.dataset.index));
            });
            
            categoryShortcuts.appendChild(shortcut);
        });
    }
}

function adminJumpToCategory(index) {
    // Skip to the selected category
    currentCategoryIndex = index;
    
    // Load the selected category
    if (currentCategoryIndex < wheelConfig.categories.length) {
        const category = wheelConfig.categories[currentCategoryIndex];
        
        // If this is a conditional category, we need to satisfy the condition
        if (category.conditional) {
            const dependsOn = category.conditional.category;
            const requiredValue = category.conditional.value;
            
            // Find the dependency
            let dependencyCategory = null;
            let dependencyStatKey = null;
            
            for (const cat of wheelConfig.categories) {
                if (cat.title === dependsOn) {
                    dependencyCategory = cat;
                    dependencyStatKey = cat.statKey;
                    break;
                }
            }
            
            // If we found the dependency, set its value to satisfy the condition
            if (dependencyCategory && dependencyStatKey) {
                // Set the required value
                characterStats[dependencyStatKey] = requiredValue;
                
                // Update the selections display
                updateSelections(dependsOn, requiredValue);
                
                console.log(`Set dependency ${dependsOn} to ${requiredValue} to satisfy condition`);
            }
        }
        
        // Load the category
        loadCategory(currentCategoryIndex);
        wheelProcessing = false;
        disableSpinButton(false);
        console.log(`Admin mode: jumped to category ${category.title}`);
        
        // Update shortcuts to reflect new state
        buildCategoryShortcuts();
    } else {
        document.getElementById('category-title').textContent = "Complete";
        wheelProcessing = true;
        disableSpinButton(true);
    }
}

// Add this directly to your script.js file
// It will run after the page loads to calculate and display power
document.addEventListener('DOMContentLoaded', function() {
    // Calculate power on page load if we have any character stats
    if (typeof calculatePower === 'function' && 
        characterStats && 
        (characterStats.race || characterStats.fightingIQ)) {
        console.log("Calculating initial power on page load");
        calculatePower();
        updatePowerDisplay();
    }
});

// Replace the existing drawWheel function with this simplified version
function drawWheel(options) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const numOptions = options.length;
    const arcSize = (2 * Math.PI) / numOptions;
    
    // IMPORTANT: Determine font size based on segment count for ENTIRE wheel
    // This ensures ALL segments on the same wheel use the same font size
    let wheelFontSize;
    if (numOptions <= 8) {
        wheelFontSize = 14; // Few options - large font
    } else if (numOptions <= 12) {
        wheelFontSize = 12; // Medium number - medium font
    } else if (numOptions <= 18) {
        wheelFontSize = 10; // Many options - small font
    } else {
        wheelFontSize = 8;  // Lots of options - tiny font
    }
    
    // Check if ANY text in this wheel is exceptionally long
    const hasLongText = options.some(text => text.length > 20);
    
    // If ANY segment has long text, reduce font size for ALL segments
    if (hasLongText) {
        wheelFontSize = Math.max(6, wheelFontSize - 2);
    }
    
    // Draw segments
    for (let i = 0; i < numOptions; i++) {
        const angle = i * arcSize;
        
        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
        ctx.closePath();
        
        // Alternate colors
        ctx.fillStyle = i % 2 === 0 ? '#FFC107' : '#FF9800';
        ctx.fill();
        ctx.stroke();
        
        // Draw text with consistent font size for all segments
        drawSegmentText(ctx, options[i], centerX, centerY, radius, angle, arcSize, wheelFontSize);
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
}

// Replace the existing drawSegmentText function with this properly confined version
function drawSegmentText(ctx, text, centerX, centerY, radius, startAngle, arcSize, fontSize) {
    // Calculate the middle angle of the segment
    const middleAngle = startAngle + arcSize / 2;
    
    // Position text closer to center (40% of radius) for safety
    const textRadius = radius * 0.4; // Move text even more inward
    const textX = centerX + Math.cos(middleAngle) * textRadius;
    const textY = centerY + Math.sin(middleAngle) * textRadius;
    
    // Save the canvas state
    ctx.save();
    
    // Move to the text position
    ctx.translate(textX, textY);
    
    // Rotate text appropriately (never upside-down)
    const isBottomHalf = middleAngle > Math.PI / 2 && middleAngle < 3 * Math.PI / 2;
    const textAngle = isBottomHalf ? (middleAngle - Math.PI / 2) : (middleAngle + Math.PI / 2);
    ctx.rotate(textAngle);
    
    // Set text properties
    ctx.fillStyle = '#000';
    ctx.textAlign = "center"; // Center all text
    ctx.textBaseline = "middle";
    
    // Much smaller font size based on number of options
    const numOptions = 2 * Math.PI / arcSize;
    let actualFontSize;
    
    if (numOptions > 25) {
        actualFontSize = 3; // Extremely tiny for lots of options
    } else if (numOptions > 18) {
        actualFontSize = 4; // Very tiny for many options
    } else if (numOptions > 12) {
        actualFontSize = 5; // Tiny for several options
    } else {
        actualFontSize = 6; // Small but readable for few options
    }
    
    // Set font size
    ctx.font = `${actualFontSize}px Arial`;
    
    // ALWAYS split long text into multiple lines
    if (text.length > 12) {
        // For special formats like Zoan fruits with "Model:"
        if (text.includes("Model:")) {
            const parts = text.split("Model:");
            const line1 = parts[0].trim();
            const line2 = "Model:" + (parts[1] || "").trim();
            
            // Draw two lines with vertical offset
            ctx.fillText(line1, 0, -actualFontSize);
            ctx.fillText(line2, 0, actualFontSize);
        }
        // For Devil Fruits with "no Mi"
        else if (text.includes("no Mi")) {
            const parts = text.split("no Mi");
            const line1 = parts[0] + "no Mi";
            const line2 = parts[1] ? parts[1].trim() : "";
            
            // Draw two lines with vertical offset
            ctx.fillText(line1, 0, -actualFontSize);
            if (line2) ctx.fillText(line2, 0, actualFontSize);
        }
        // General split for long text
        else {
            const midPoint = Math.floor(text.length / 2);
            let splitIndex = text.lastIndexOf(' ', midPoint);
            if (splitIndex === -1) splitIndex = midPoint;
            
            const line1 = text.substring(0, splitIndex);
            const line2 = text.substring(splitIndex + 1);
            
            // Draw two lines with vertical offset
            ctx.fillText(line1, 0, -actualFontSize);
            ctx.fillText(line2, 0, actualFontSize);
        }
    } else {
        // Short text - just one line
        ctx.fillText(text, 0, 0);
    }
    
    // Restore canvas state
    ctx.restore();
}

// Replace your long-text check with this unified code:
const xPos = canvasCenter - 20;
ctx.textAlign = "right";
ctx.textBaseline = "middle";  // prevent vertical jitter
ctx.font = font;

const text = segments[i];
const textWidth = ctx.measureText(text).width;
const maxWidth = canvasCenter - 30; // same logic

if (textWidth > maxWidth) {
    // Two-line fallback
    const mid = Math.floor(text.length / 2);
    let spaceIndex = text.lastIndexOf(' ', mid);
    if (spaceIndex === -1) spaceIndex = mid;
    
    const line1 = text.substring(0, spaceIndex).trimEnd();
    const line2 = text.substring(spaceIndex).trimStart();
    
    // Slightly smaller font for two lines
    ctx.font = `bold ${fontSizePx - 1}px monospace`;

    // Draw the two lines around y=0
    const halfLine = (fontSizePx - 1) / 2;
    ctx.fillText(line1, xPos, -halfLine);
    ctx.fillText(line2, xPos, +halfLine);
} else {
    // Single-line text at y=0
    ctx.fillText(text, xPos, 0);
}