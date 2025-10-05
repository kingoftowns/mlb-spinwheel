// Color palette for dynamic wheel options
const colorPalette = [
    "#A71930", "#CE1141", "#DF4601", "#BD3039", "#0E3386", "#27251F",
    "#C6011F", "#E31937", "#33006F", "#0C2C56", "#002D62", "#004687",
    "#BA0021", "#005A9C", "#00A3E0", "#12284B", "#002B5C", "#002D72",
    "#003087", "#003831", "#E81828", "#27251F", "#2F241D", "#FD5A1E",
    "#0C2C56", "#C41E3A", "#092C5C", "#003278", "#134A8E", "#AB0003"
];

let teams = [];
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt-input');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

let currentOffset = 0;
let isSpinning = false;

// In development (port 3000), proxy to backend on 9090.
// In production, nginx proxies /api/ to backend service.
const API_BASE = window.location.port === '3000' ? 'http://localhost:9090' : window.location.origin;

// Load current options on page load
async function loadCurrentOptions() {
    try {
        const response = await fetch(`${API_BASE}/api/current-options`);
        const data = await response.json();

        if (data.options && data.options.length > 0) {
            teams = data.options.map((name, index) => ({
                name,
                color: colorPalette[index % colorPalette.length]
            }));
            resizeCanvas();
        }
    } catch (error) {
        console.error('Error loading current options:', error);
        // Fallback to default MLB teams
        teams = [
            { name: "Arizona Diamondbacks", color: "#A71930" },
            { name: "Atlanta Braves", color: "#CE1141" },
            { name: "Baltimore Orioles", color: "#DF4601" },
            { name: "Boston Red Sox", color: "#BD3039" },
            { name: "Chicago Cubs", color: "#0E3386" },
            { name: "Chicago White Sox", color: "#27251F" },
            { name: "Cincinnati Reds", color: "#C6011F" },
            { name: "Cleveland Guardians", color: "#E31937" },
            { name: "Colorado Rockies", color: "#33006F" },
            { name: "Detroit Tigers", color: "#0C2C56" },
            { name: "Houston Astros", color: "#002D62" },
            { name: "Kansas City Royals", color: "#004687" },
            { name: "Los Angeles Angels", color: "#BA0021" },
            { name: "Los Angeles Dodgers", color: "#005A9C" },
            { name: "Miami Marlins", color: "#00A3E0" },
            { name: "Milwaukee Brewers", color: "#12284B" },
            { name: "Minnesota Twins", color: "#002B5C" },
            { name: "New York Mets", color: "#002D72" },
            { name: "New York Yankees", color: "#003087" },
            { name: "Oakland Athletics", color: "#003831" },
            { name: "Philadelphia Phillies", color: "#E81828" },
            { name: "Pittsburgh Pirates", color: "#27251F" },
            { name: "San Diego Padres", color: "#2F241D" },
            { name: "San Francisco Giants", color: "#FD5A1E" },
            { name: "Seattle Mariners", color: "#0C2C56" },
            { name: "St. Louis Cardinals", color: "#C41E3A" },
            { name: "Tampa Bay Rays", color: "#092C5C" },
            { name: "Texas Rangers", color: "#003278" },
            { name: "Toronto Blue Jays", color: "#134A8E" },
            { name: "Washington Nationals", color: "#AB0003" }
        ];
        resizeCanvas();
    }
}

// Generate new wheel options
async function generateOptions() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('Please enter a prompt or list');
        return;
    }

    hideError();
    showLoading();
    generateBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/generate-options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (data.error) {
            showError(data.error);
            hideLoading();
            generateBtn.disabled = false;
            return;
        }

        if (data.options && data.options.length > 0) {
            teams = data.options.map((name, index) => ({
                name,
                color: colorPalette[index % colorPalette.length]
            }));
            loading.textContent = `Generated ${data.options.length} options`;
            setTimeout(() => {
                hideLoading();
            }, 2000);
            resizeCanvas();
            promptInput.value = '';
            result.textContent = '';
        } else {
            showError('No options generated. Please try again.');
        }
    } catch (error) {
        console.error('Error generating options:', error);
        showError('Failed to generate options. Please try again.');
    } finally {
        generateBtn.disabled = false;
    }
}

function showLoading() {
    loading.textContent = 'Generating options...';
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

// Set canvas size based on viewport
function resizeCanvas() {
    const width = Math.min(400, window.innerWidth - 60);
    const height = Math.min(600, window.innerHeight - 250);
    canvas.width = width;
    canvas.height = height;
    drawWheel();
}

// Draw the wheel
function drawWheel() {
    const slotHeight = 60;
    const totalHeight = teams.length * slotHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create repeating pattern for seamless scrolling
    const offset = currentOffset % totalHeight;

    // Calculate how many repeats we need to fill the canvas
    const repeatsNeeded = Math.ceil(canvas.height / totalHeight) + 2;

    // Draw slots (draw enough repeats to fill the canvas)
    for (let repeat = -1; repeat <= repeatsNeeded; repeat++) {
        teams.forEach((team, index) => {
            const y = repeat * totalHeight + index * slotHeight - offset;

            // Only draw if visible
            if (y + slotHeight >= 0 && y <= canvas.height) {
                // Draw slot background
                ctx.fillStyle = team.color;
                ctx.fillRect(0, y, canvas.width, slotHeight);

                // Draw border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.strokeRect(0, y, canvas.width, slotHeight);

                // Draw team name
                ctx.fillStyle = '#fff';
                const fontSize = Math.max(12, Math.min(18, canvas.width / 20));
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(team.name, canvas.width / 2, y + slotHeight / 2);
            }
        });
    }

    // Draw center pointer line (right side)
    const pointerY = canvas.height / 2;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 10, pointerY);
    ctx.lineTo(canvas.width + 30, pointerY);
    ctx.stroke();
}

function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    result.textContent = '';

    const spinDuration = 5000; // 5 seconds
    const slotHeight = 60;
    const totalHeight = teams.length * slotHeight;

    // Pick a random winner first
    const winningIndex = Math.floor(Math.random() * teams.length);

    // Calculate the target offset
    // The pointer is at canvas.height / 2
    // We want winningIndex slot's center to be at the pointer
    // Drawing logic: y = index * slotHeight - offset (for repeat 0)
    // We want: y + slotHeight/2 = canvas.height / 2
    // So: index * slotHeight - offset + slotHeight/2 = canvas.height / 2
    // offset = index * slotHeight + slotHeight/2 - canvas.height / 2
    const pointerY = canvas.height / 2;
    let targetOffset = winningIndex * slotHeight + slotHeight / 2 - pointerY;

    // Normalize to positive value within one cycle
    while (targetOffset < 0) {
        targetOffset += totalHeight;
    }
    targetOffset = targetOffset % totalHeight;

    // Add multiple full rotations for visual effect
    // Use a minimum pixel distance to ensure good visual effect even with few items
    const minPixelDistance = 3000; // At least 3000 pixels of travel
    const maxPixelDistance = 5000; // Up to 5000 pixels
    const targetPixelDistance = Math.random() * (maxPixelDistance - minPixelDistance) + minPixelDistance;

    // Calculate how many full rotations this represents
    const spins = Math.floor(targetPixelDistance / totalHeight);

    // Calculate total distance from current position to target (with extra spins)
    const currentNormalized = currentOffset % totalHeight;
    let deltaToTarget = targetOffset - currentNormalized;
    if (deltaToTarget < 0) {
        deltaToTarget += totalHeight; // Go forward to target
    }
    const totalDistance = spins * totalHeight + deltaToTarget;

    const startTime = Date.now();
    const startOffset = currentOffset;

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentOffset = startOffset + totalDistance * easeOut;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Verify the landing position using same logic as drawing
            const finalOffset = currentOffset % totalHeight;
            const pointerY = canvas.height / 2;

            // Find which slot is at the pointer (same as drawing logic)
            let actualWinner = -1;
            const repeatsNeeded = Math.ceil(canvas.height / totalHeight) + 2;

            for (let repeat = -1; repeat <= repeatsNeeded; repeat++) {
                for (let i = 0; i < teams.length; i++) {
                    const y = repeat * totalHeight + i * slotHeight - finalOffset;
                    const slotCenter = y + slotHeight / 2;

                    if (Math.abs(slotCenter - pointerY) < slotHeight / 2) {
                        actualWinner = i;
                        console.log('Found at repeat', repeat, 'y:', y, 'center:', slotCenter);
                        break;
                    }
                }
                if (actualWinner !== -1) break;
            }

            console.log('Expected winner:', winningIndex, teams[winningIndex].name);
            console.log('Actual winner:', actualWinner, teams[actualWinner]?.name);
            console.log('Final offset:', finalOffset, 'Target offset:', targetOffset);
            console.log('Canvas height:', canvas.height, 'Pointer Y:', pointerY);

            result.textContent = teams[winningIndex].name;
            isSpinning = false;
            spinBtn.disabled = false;
        }
    }

    animate();
}

// Event listeners
spinBtn.addEventListener('click', spinWheel);
generateBtn.addEventListener('click', generateOptions);

// Allow Enter key to generate
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateOptions();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (!isSpinning) {
        resizeCanvas();
    }
});

// Initial setup
loadCurrentOptions();
