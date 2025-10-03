const teams = [
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

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const result = document.getElementById('result');

let currentOffset = 0;
let isSpinning = false;

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

    // Draw slots (draw extra above and below for seamless wrap)
    for (let repeat = -1; repeat <= 2; repeat++) {
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

    // Random spin distance (multiple full rotations plus random offset)
    const minSpins = 4;
    const maxSpins = 7;
    const spins = Math.random() * (maxSpins - minSpins) + minSpins;
    const totalDistance = spins * totalHeight;

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
            // Determine winner - which team is at center pointer
            const pointerY = canvas.height / 2;
            const normalizedOffset = currentOffset % totalHeight;

            // Calculate which team is at the pointer position
            // The pointer is at canvas.height / 2
            // We need to find which slot's Y position contains the pointer

            // When drawing, the slot Y position is: repeat * totalHeight + index * slotHeight - offset
            // At the pointer, we need: y <= pointerY < y + slotHeight
            // Solving: repeat * totalHeight + index * slotHeight - offset <= pointerY
            // We want the index where the slot center aligns with pointer

            const relativePosition = (normalizedOffset + pointerY) % totalHeight;
            const winningIndex = Math.floor(relativePosition / slotHeight) % teams.length;

            console.log('Offset:', normalizedOffset, 'Relative pos:', relativePosition, 'Winning index:', winningIndex, 'Team:', teams[winningIndex].name);
            result.textContent = teams[winningIndex].name;
            isSpinning = false;
            spinBtn.disabled = false;
        }
    }

    animate();
}

spinBtn.addEventListener('click', spinWheel);

// Handle window resize
window.addEventListener('resize', () => {
    if (!isSpinning) {
        resizeCanvas();
    }
});

// Initial setup
resizeCanvas();
