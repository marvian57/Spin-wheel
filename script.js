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

// Load wheel configuration from textarea
function loadWheelConfig() {
    try {
        const configText = document.getElementById('wheel-config').value;
        wheelConfig = JSON.parse(configText);
        
        // Reset to first category
        currentCategoryIndex = 0;
        selections = [];
        
        // Load first wheel
        loadCategory(currentCategoryIndex);
    } catch (error) {
        alert('Invalid JSON configuration: ' + error.message);
    }
}

// Load a specific category into the wheel
function loadCategory(index) {
    if (!wheelConfig || !wheelConfig.categories || index >= wheelConfig.categories.length) {
        return;
    }
    
    const category = wheelConfig.categories[index];
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
        // We're intentionally NOT changing the selection.textContent here
    }
}

// Generate colors for the segments
function generateColors() {
    segColors = [];
    for (let i = 0; i < segments.length; i++) {
        segColors.push(defaultColors[i % defaultColors.length]);
    }
}

// Create wheel segments
function createWheel() {
    // Get the actual canvas size from CSS
    const wheelSize = parseInt(getCssVar('--wheel-size')) || 350;
    
    // Set canvas dimensions to match CSS
    canvas.width = wheelSize;
    canvas.height = wheelSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!segments || segments.length === 0) return;
    
    canvasCenter = canvas.width / 2;
    let segmentAngle = (2 * Math.PI) / segments.length;
    
    // Get text styling from CSS
    const textColor = getCssVar('--wheel-text-color') || 'white';
    const font = getCssVar('--wheel-font') || 'bold 14px Arial';
    for (let i = 0; i < segments.length; i++) {
        // Draw segment
        ctx.beginPath();
        ctx.fillStyle = segColors[i];
        ctx.moveTo(canvasCenter, canvasCenter);
        ctx.arc(canvasCenter, canvasCenter, canvasCenter - 10, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.lineTo(canvasCenter, canvasCenter);
        ctx.fill();
        
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

// Redraw wheel with highlighting for the selected segment
function highlightWinningSegment(winningIndex) {
    // Get the actual canvas size from CSS
    const wheelSize = parseInt(getCssVar('--wheel-size')) || 350;
    canvasCenter = wheelSize / 2;
    
    // Clear canvas and prepare for redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!segments || segments.length === 0) return;
    
    // Calculate segment angle
    let segmentAngle = (2 * Math.PI) / segments.length;
    
    // Get text styling from CSS
    const textColor = getCssVar('--wheel-text-color') || 'white';
    const font = getCssVar('--wheel-font') || 'bold 14px Arial';
    
    // Draw each segment
    for (let i = 0; i < segments.length; i++) {
        // Set segment appearance based on whether it's the winner
        const isWinner = (i === winningIndex);
        
        // Draw segment with different styling based on winner status
        ctx.beginPath();
        
        if (isWinner) {
            // Winner segment - normal color, slightly larger
            ctx.fillStyle = segColors[i];
            // Add a subtle glow effect for the winner
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 15;
        } else {
            // Non-winner segments - add transparency
            // Create semi-transparent version of the color
            const baseColor = segColors[i];
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;  // 40% opacity
            ctx.shadowBlur = 0;
        }
        
        // Draw the segment
        ctx.moveTo(canvasCenter, canvasCenter);
        ctx.arc(canvasCenter, canvasCenter, canvasCenter - 10, i * segmentAngle, (i + 1) * segmentAngle);
        ctx.lineTo(canvasCenter, canvasCenter);
        ctx.fill();
        
        // Reset shadow for text
        ctx.shadowBlur = 0;
        
        // Draw text
        ctx.save();
        ctx.translate(canvasCenter, canvasCenter);
        ctx.rotate(i * segmentAngle + segmentAngle / 2);
        ctx.textAlign = "right";
        
        // Adjust text style based on winner status
        if (isWinner) {
            ctx.fillStyle = textColor;
            ctx.font = "bold " + font; // Make winner text bolder
        } else {
            // Dimmer text for non-winners
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.font = font;
        }
        
        ctx.fillText(segments[i], canvasCenter - 20, 5);
        ctx.restore();
    }
}

// Fix the spin function to properly follow the backend selection
function spin() {
    if (isSpinning || !segments || segments.length === 0) return;
    
    isSpinning = true;
    
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
        clearInterval(liveUpdateInterval);
        
        // Store final rotation
        deg = finalRotation;
        
        // FORCE the selection to match the backend winner regardless of visual position
        selection.textContent = winningSegment;
        
        // Play selection sound
        selectSound.play().catch(e => console.log("Sound error:", e));
        
        // Redraw wheel with highlighted winning segment
        // Slight delay to ensure wheel has stopped visually
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
        
        // Delay before next category
        setTimeout(() => {
            nextCategory();
        }, 1500);
    }, spinDuration + 100);
}

// Update the selections history display
function updateSelectionsHistory() {
    // Implementation left empty in original code
};
    
window.onload = function() {
    loadWheelConfig();
    
    // Add event listener to update selection display when canvas is touched/clicked
    canvas.addEventListener('click', function(e) {
        if (!isSpinning) {
            updateSelectionDisplay();
        }
    });
    
    // Update selection display initially
    updateSelectionDisplay();
    
    // Preload sounds
    tickSound.load();
    selectSound.load();
    
    // Handle browser autoplay restrictions
    document.addEventListener('click', function() {
        // Create and immediately stop a sound to enable audio
        const unlockSound = new Audio('sounds/tick.mp3');
        unlockSound.volume = 0;
        unlockSound.play().then(() => {
            unlockSound.pause();
            unlockSound.currentTime = 0;
        }).catch(e => console.log("Audio initialization error:", e));
    }, {once: true});
};