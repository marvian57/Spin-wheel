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

// Wait for DOM to be loaded
window.onload = function() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const centerX = width/2;
    const centerY = height/2;
    const radius = width/2;

    // Create audio element for tick sound
    const tickSound = new Audio('sound/tick.mp3');
    let lastSegment = -1; // Track last segment position to detect changes

    let items = document.getElementsByTagName("textarea")[0].value.split("\n");

    let currentDeg = 0;
    let step = 360/items.length;
    let colors = [];
    let itemDegs = {};
    let speed = 0;
    let maxRotation = randomRange(360* 3, 360 * 6);
    let pause = false;
    let colorsInitialized = false; // Flag to track if colors have been initialized

    // Initialize colors once
    if (!colorsInitialized) {
        for(let i = 0; i < items.length + 1; i++){
            colors.push(randomColor());
        }
        colorsInitialized = true;
    }

    function createWheel(){
        items = document.getElementsByTagName("textarea")[0].value.split("\n");
        step = 360/items.length;
        
        // Only generate colors if they don't exist or there's a mismatch in count
        if (colors.length !== items.length + 1) {
            colors = [];
            for(let i = 0; i < items.length + 1; i++){
                colors.push(randomColor());
            }
        }
        draw();
    }

    // Helper function to get the current segment under the pointer (arrow)
    function getCurrentSegment() {
        // Normalize angle to [0, 360)
        const normalizedAngle = (currentDeg % 360 + 360) % 360;
        
        // THE TRIANGLE IS AT THE BOTTOM (90 degrees in canvas coordinates)
        // This formula calculates which segment is at the bottom pointer position
        const pointerPosition = Math.floor(((90 - normalizedAngle + 360) % 360) / step);
        
        return pointerPosition % items.length;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, toRad(0), toRad(360));
        ctx.fillStyle = `rgb(${33},${33},${33})`;
        ctx.lineTo(centerX, centerY);
        ctx.fill();

        let startDeg = currentDeg;
        itemDegs = {}; // Reset item degrees on each draw
        
        for(let i = 0; i < items.length; i++, startDeg += step){
            let endDeg = startDeg + step;

            color = colors[i];
            let colorStyle = `rgb(${color.r},${color.g},${color.b})`;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 2, toRad(startDeg), toRad(endDeg));
            let colorStyle2 = `rgb(${color.r - 30},${color.g - 30},${color.b - 30})`;
            ctx.fillStyle = colorStyle2;
            ctx.lineTo(centerX, centerY);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 30, toRad(startDeg), toRad(endDeg));
            ctx.fillStyle = colorStyle;
            ctx.lineTo(centerX, centerY);
            ctx.fill();

            // draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(toRad((startDeg + endDeg)/2));
            ctx.textAlign = "center";
            if(color.r > 150 || color.g > 150 || color.b > 150){
                ctx.fillStyle = "#000";
            }
            else{
                ctx.fillStyle = "#fff";
            }
            ctx.font = 'bold 24px serif';
            ctx.fillText(items[i], 130, 10);
            ctx.restore();

            itemDegs[items[i]] = {
                "startDeg": startDeg,
                "endDeg": endDeg
            };
        }
        
        // Update selection text based on current segment
        const currentSegment = getCurrentSegment();
        document.getElementById("selection").textContent = items[currentSegment];
    }

    // Update the animate function for a smoother, longer deceleration
    function animate() {
        if(pause){
            document.body.classList.remove('spinning');
            return;
        }
        
        // Use a custom easing curve for smoother, more wheel-like deceleration
        // This gives a more natural feeling when slowing down
        const progress = getPercent(currentDeg, maxRotation, 0);
        speed = easeOutQuart(progress) * 20; // Lower multiplier for longer spin
        
        if(speed < 0.01){
            speed = 0;
            pause = true;
            document.body.classList.remove('spinning');
        }
        
        currentDeg += speed;
        
        // Check if we've moved to a new segment
        const currentSegment = getCurrentSegment();
        if(currentSegment !== lastSegment && speed > 0.1){
            // Play tick sound when crossing segment boundary
            tickSound.volume = 0.1; // Lower volume
            tickSound.cloneNode(true).play().catch(e => console.log("Audio play failed: ", e));
            lastSegment = currentSegment;
        }
        
        draw();
        window.requestAnimationFrame(animate);
    }
        
    // In the spin function, increase the number of rotations:
    window.spin = function(){
        if(speed != 0){
            return;
        }
    
        document.body.classList.add('spinning');
        currentDeg = 0;
        lastSegment = -1; // Reset the last segment tracker
        
        createWheel();
        
        // Choose a random item for the winner
        const randomIndex = Math.floor(Math.random() * items.length);
        const randomItem = items[randomIndex];
        
        // Truly random position within the chosen segment
        // Value between 0 (start of segment) and 1 (end of segment)
        const randomPosition = Math.random(); // Random position anywhere in the segment
        
        // Calculate rotation needed to align the random position with the arrow
        const segmentStart = randomIndex * step; // Start angle of the chosen segment
        const offsetWithinSegment = randomPosition * step; // Random offset within the segment
        const rotationNeeded = (90 - segmentStart - offsetWithinSegment + 360) % 360;
        
        // Add extra rotations for a longer spin (~4 seconds total)
        maxRotation = (360 * 4) + rotationNeeded;
        
        pause = false;
        window.requestAnimationFrame(animate);
    };

    // Initial draw
    createWheel();
    draw();
    
    // Hide the textarea visually but keep it functional
    const inputArea = document.querySelector('.inputArea');
    if (inputArea) {
        inputArea.style.position = 'absolute';
        inputArea.style.left = '-9999px';
    }
};