// Add power display to stats panel
function updatePowerDisplay() {
    const power = characterStats.power;
    const powerLevel = getPowerTier(power);
    
    // Find or create power display
    let powerDisplay = document.getElementById('power-display');
    if (!powerDisplay) {
        powerDisplay = document.createElement('div');
        powerDisplay.id = 'power-display';
        powerDisplay.className = 'power-display';
        document.getElementById('settings-panel').appendChild(powerDisplay);
    }
    
    powerDisplay.innerHTML = `
        <h3>Power Level: ${power}</h3>
        <div class="power-meter">
            <div class="power-fill" style="width: ${Math.min(100, power/30)}%"></div>
        </div>
        <p>Tier: ${powerLevel}</p>
    `;
}

// Determine character tier based on power
function getPowerTier(power) {
    if (power < 500) return "Civilian";
    if (power < 1000) return "Fighter";
    if (power < 2000) return "Officer";
    if (power < 3000) return "Vice Admiral / Commander";
    if (power < 4000) return "Admiral / Emperor Commander";
    if (power < 5000) return "Top Tier";
    return "Legendary";
}