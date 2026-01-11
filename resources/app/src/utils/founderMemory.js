const fs = require('fs');
const path = require('path');

// Path to memory file
const MEMORY_FILE = path.join(__dirname, '../../founder-memory.json');

/**
 * Load founder memory from file
 * @returns {Object} - { planetName: founderId }
 */
function loadFounderMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            const data = fs.readFileSync(MEMORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[FounderMemory] Error loading:', error.message);
    }
    return {};
}

/**
 * Save founder memory to file
 * @param {Object} memory - { planetName: founderId }
 */
function saveFounderMemory(memory) {
    try {
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf8');
        console.log('[FounderMemory] Saved to file');
    } catch (error) {
        console.error('[FounderMemory] Error saving:', error.message);
    }
}

/**
 * Get founder ID for a planet
 * @param {string} planetName - Planet name
 * @returns {string|null} - Founder ID or null
 */
function getFounderId(planetName) {
    if (!planetName) return null;
    const memory = loadFounderMemory();
    return memory[planetName] || null;
}

/**
 * Set founder ID for a planet
 * @param {string} planetName - Planet name
 * @param {string} founderId - Founder user ID
 */
function setFounderId(planetName, founderId) {
    if (!planetName || !founderId) return;
    const memory = loadFounderMemory();
    memory[planetName] = founderId;
    saveFounderMemory(memory);
    console.log(`[FounderMemory] Stored ${planetName} → ${founderId}`);
}

/**
 * Clear all founder memory
 */
function clearFounderMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            fs.unlinkSync(MEMORY_FILE);
            console.log('[FounderMemory] Cleared all memory');
        }
    } catch (error) {
        console.error('[FounderMemory] Error clearing:', error.message);
    }
}

module.exports = {
    getFounderId,
    setFounderId,
    clearFounderMemory
};
