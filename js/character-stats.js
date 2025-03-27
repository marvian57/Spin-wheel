// Reference tables for power calculations
const powerValues = {
    race: {
        "Humans": 10,
        "Skypeans": 15,
        "Fishmen": 25,
        "Giants": 40,
        "Merfolk": 15,
        "Mink Tribe": 30,
        "Long Arm": 15,
        "Long Leg": 15,
        "Three Eye": 35,
        "Dwarves": 10,
        "Snakeneck": 15,
        "Kinkobito": 15,
        "Lunarians": 50
    },
    hakiType: {
        "Observation Haki": 30,
        "Armament Haki": 35,
        "Conqueror's Haki": 50,
        "Observation & Armament": 65,
        "Observation & Conqueror's": 80,
        "Armament & Conqueror's": 85,
        "All Three Types": 100
    },
    devilFruit: {
        "Paramecia - Gomu Gomu": 40,
        "Paramecia - Bara Bara": 30,
        "Paramecia - Doru Doru": 25,
        "Paramecia - Mane Mane": 20,
        "Paramecia - Hana Hana": 35,
        "Paramecia - Ope Ope": 70,
        "Logia - Mera Mera": 60,
        "Logia - Moku Moku": 50,
        "Logia - Suna Suna": 55,
        "Logia - Goro Goro": 75,
        "Logia - Hie Hie": 65,
        "Logia - Yami Yami": 80,
        "Zoan - Ushi Ushi": 30,
        "Zoan - Tori Tori": 35,
        "Zoan - Zou Zou": 40,
        "Mythical Zoan - Phoenix": 85,
        "Ancient Zoan - T-Rex": 70
    },
    fightingStyle: {
        "Haki Combat": 50,
        "Rokushiki": 45,
        "Three Sword Style": 60,
        "Fish-Man Karate": 55,
        "Black Leg Style": 50,
        "Swordsmanship": 45,
        "Dragon Claw": 55,
        "Usopp Tactics": 30,
        "Hand-to-Hand Combat": 40,
        "Marksmanship": 35,
        "Weapon Specialist": 40
    },
    fightingIQ: {
        "None": 0,
        "Low": 20,
        "Medium": 40,
        "High": 60,
        "Mastered": 80,
        "Supreme Master": 90,
        "Sliver of Truth": 100
    },
    occupation: {
        "Pirate": 15,
        "Marine": 15,
        "Revolutionary Army": 20,
        "World Government": 15,
        "Civilian": 0,
        "Noble": 5
    }
};

// Check if powerValues exists at the top of the file
console.log("At start of character-stats.js, powerValues:", typeof powerValues !== 'undefined' ? 'exists' : 'missing');

// Calculate power based on character stats
function calculatePower() {
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
    
    // Devil fruit handling
    let devilFruitValue = 0;
    if (hasDevilFruit && devilFruit) {
        devilFruitValue = powerValues.devilFruit[devilFruit] || 0;
    }
    
    let fightingStyleValue = (fightingStyle && powerValues.fightingStyle[fightingStyle]) ? powerValues.fightingStyle[fightingStyle] : 0;
    let fightingIQValue = (fightingIQ && powerValues.fightingIQ[fightingIQ]) ? powerValues.fightingIQ[fightingIQ] : 0;
    let occupationValue = (occupation && powerValues.occupation[occupation]) ? powerValues.occupation[occupation] : 0;
    
    // Will of D bonus for humans
    if (willOfD) {
        raceValue += 25;
    }
    
    // Log individual components
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
    
    // MOST IMPORTANT LINE: Store in character stats
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
            <div class="power-fill" style="width: ${Math.min(100, power/10)}%"></div>
        </div>
    `;
}

// Special function to update Will of D display when race changes
function updateWillOfDDisplay(value) {
    const selectionsList = document.getElementById('selections-list');
    const willOfDItem = Array.from(selectionsList.children).find(
        item => item.dataset.category === "Do you have the Will of D?"
    );
    
    if (willOfDItem) {
        const selectElement = willOfDItem.querySelector('select');
        if (selectElement) {
            for (let i = 0; i < selectElement.options.length; i++) {
                if (selectElement.options[i].value === value) {
                    selectElement.selectedIndex = i;
                    break;
                }
            }
        }
    }
}

// Add this at the very end of your file
console.log("Character-stats.js fully loaded, attempting initial power calculation");
calculatePower();
updatePowerDisplay();

// Create a global debug function
window.debugCharacterPower = function() {
    console.log("Debug triggered - recalculating power");
    console.log("Current character stats:", characterStats);
    calculatePower();
    updatePowerDisplay();
};

