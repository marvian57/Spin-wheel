// Check if powerValues exists at the top of the file
console.log("At start of character-stats.js, powerValues:", typeof powerValues !== 'undefined' ? 'exists' : 'missing');

// Add this function to define default power values if they're missing
function ensurePowerValues() {
    // If powerValues doesn't exist, define it
    if (typeof powerValues === 'undefined') {
        console.log("powerValues missing, creating default values");
        window.powerValues = {
            race: {
                "Humans": 100,
                "Mink Tribe": 120,
                "Giants": 150,
                "Fishmen": 130,
                "Merfolk": 80,
                "Lunarians": 200,
                "Sky People": 90,
                "Long Arm": 110,
                "Long Leg": 110,
                "Three-Eye": 140,
                "Tontatta": 50,
                "Snake Neck": 100
            },
            hakiType: {
                "Observation Haki": 200,
                "Armament Haki": 220,
                "Conqueror's Haki": 300,
                "All Three Types": 500
            },
            devilFruit: {
                "Paramecia": 200,
                "Logia": 300,
                "Zoan": 250,
                "Ancient Zoan": 300,
                "Mythical Zoan": 350
            },
            fightingStyle: {
                "Black Leg Style": 150,
                "Three Sword Style": 200,
                "Six Powers": 180,
                "Fish-Man Karate": 170,
                "Devil Fruit Mastery": 220,
                "Usopp Tactics": 100
            },
            fightingIQ: {
                "Low": 50,
                "Average": 100,
                "High": 150,
                "Genius": 250
            },
            occupation: {
                "Pirate": 100,
                "Marine": 100,
                "Revolutionary Army": 120,
                "Bounty Hunter": 80,
                "Civilian": 0,
                "World Government": 90
            }
        };
    }
}

// Calculate power based on character stats
function calculatePower() {
    // Make sure powerValues is defined
    ensurePowerValues();
    
    // Log character stats for debugging
    console.log("Calculating power with characterStats:", characterStats);
    console.log("Using powerValues:", powerValues);
    
    // Get stats values for calculation
    const race = characterStats.race;
    const hakiType = characterStats.hakiType;
    const hasDevilFruit = characterStats.hasDevilFruit === "Yes";
    const devilFruit = characterStats.devilFruit;
    const fightingStyle = characterStats.fightingStyle;
    const fightingIQ = characterStats.fightingIQ;
    const occupation = characterStats.occupation;
    const willOfD = characterStats.willOfD === "Yes";
    
    // Log raw inputs
    console.log("Raw inputs:", {
        race, hakiType, hasDevilFruit, devilFruit, 
        fightingStyle, fightingIQ, occupation, willOfD
    });
    
    // Get power values from the powerValues object
    let raceValue = (race && powerValues.race[race]) ? powerValues.race[race] : 0;
    let hakiValue = (hakiType && characterStats.hasHaki === "Yes" && powerValues.hakiType[hakiType]) ? powerValues.hakiType[hakiType] : 0;
    let devilFruitValue = (hasDevilFruit && devilFruit && powerValues.devilFruit[devilFruit]) ? powerValues.devilFruit[devilFruit] : 0;
    let fightingStyleValue = (fightingStyle && powerValues.fightingStyle[fightingStyle]) ? powerValues.fightingStyle[fightingStyle] : 0;
    let fightingIQValue = (fightingIQ && powerValues.fightingIQ[fightingIQ]) ? powerValues.fightingIQ[fightingIQ] : 0;
    let occupationValue = (occupation && powerValues.occupation[occupation]) ? powerValues.occupation[occupation] : 0;
    
    // Will of D bonus for humans
    if (willOfD) {
        raceValue += 25;
    }
    
    // Log individual components and their exact lookup paths
    console.log("Power values lookup:", {
        raceLookup: `powerValues.race["${race}"] = ${powerValues.race[race]}`,
        hakiLookup: `powerValues.hakiType["${hakiType}"] = ${powerValues.hakiType[hakiType]}`,
        devilFruitLookup: `powerValues.devilFruit["${devilFruit}"] = ${powerValues.devilFruit[devilFruit]}`,
        fightingStyleLookup: `powerValues.fightingStyle["${fightingStyle}"] = ${powerValues.fightingStyle[fightingStyle]}`,
        fightingIQLookup: `powerValues.fightingIQ["${fightingIQ}"] = ${powerValues.fightingIQ[fightingIQ]}`,
        occupationLookup: `powerValues.occupation["${occupation}"] = ${powerValues.occupation[occupation]}`
    });
    
    // Log power components
    console.log("Final power components:", {
        raceValue: raceValue * 2,
        fightingStyleValue: fightingStyleValue * 1.5,
        fightingIQValue: fightingIQValue * 3,
        occupationValue: occupationValue * 1,
        hakiValue: hakiValue * 2,
        devilFruitValue: devilFruitValue * 2
    });
    
    // Calculate base power
    let power = 0;
    
    // Add base power from stats - each one contributes directly
    power += raceValue * 2;                 // Race gives base power
    power += fightingStyleValue * 1.5;      // Fighting style multiplier
    power += fightingIQValue * 3;           // Fighting IQ is very important
    power += occupationValue * 1;           // Occupation gives some bonus
    power += hakiValue * 2;                 // Haki is powerful
    power += devilFruitValue * 2;           // Devil fruit adds significant power
    
    // Add bonus for having devil fruit mastery as fighting style with a devil fruit
    if (fightingStyle === "Devil Fruit Mastery" && hasDevilFruit) {
        power += 200;
        console.log("Added Devil Fruit Mastery bonus: 200");
    }
    
    // Add bonus for having all three types of haki
    if (hakiType === "All Three Types") {
        power += 300;
        console.log("Added All Three Types bonus: 300");
    }
    
    // Log final calculation
    console.log("Final power calculated:", Math.round(power));
    
    // Store in character stats and return
    characterStats.power = Math.round(power);
    return Math.round(power);
}

// Update power display in the UI
function updatePowerDisplay() {
    console.log("Updating power display with power:", characterStats.power);
    
    const power = characterStats.power;
    
    // Find or create power display
    let powerDisplay = document.getElementById('power-display');
    if (!powerDisplay) {
        powerDisplay = document.createElement('div');
        powerDisplay.id = 'power-display';
        powerDisplay.className = 'power-display';
        document.getElementById('settings-panel').appendChild(powerDisplay);
    }
    
    // Create HTML for power display with meter
    powerDisplay.innerHTML = `
        <h3>Power Level: ${power}</h3>
        <div class="power-meter">
            <div class="power-fill" style="width: ${Math.min(100, power/30)}%"></div>
        </div>
    `;
}

