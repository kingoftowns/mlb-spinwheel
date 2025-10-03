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

let currentRotation = 0;
let isSpinning = false;

// Set canvas size based on viewport
function resizeCanvas() {
    const size = Math.min(500, window.innerWidth - 40);
    canvas.width = size;
    canvas.height = size;
    drawWheel();
}

// Draw the wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const sliceAngle = (2 * Math.PI) / teams.length;

    teams.forEach((team, index) => {
        const startAngle = index * sliceAngle + currentRotation;
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = team.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        const fontSize = Math.max(8, Math.min(12, radius / 25));
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(team.name, radius - 10, 5);
        ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;
    result.textContent = '';

    const spinDuration = 4000; // 4 seconds
    const minSpins = 5;
    const maxSpins = 8;
    const totalRotation = (Math.random() * (maxSpins - minSpins) + minSpins) * 2 * Math.PI;

    const startTime = Date.now();
    const startRotation = currentRotation;

    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentRotation = startRotation + totalRotation * easeOut;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Determine winner - find which slice is at the top center
            const sliceAngle = (2 * Math.PI) / teams.length;
            const normalizedRotation = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

            // The pointer is at the top (3π/2 in our coordinate system)
            // We need to find which slice index is at that position
            // Slices start at index 0 at angle 0, and go clockwise
            const pointerPosition = (3 * Math.PI / 2);

            // Find which slice the pointer is in by checking each slice's angle range
            let winningIndex = 0;
            for (let i = 0; i < teams.length; i++) {
                const sliceStart = (i * sliceAngle + normalizedRotation) % (2 * Math.PI);
                const sliceEnd = ((i + 1) * sliceAngle + normalizedRotation) % (2 * Math.PI);

                // Check if pointer position falls within this slice
                if (sliceStart <= sliceEnd) {
                    if (pointerPosition >= sliceStart && pointerPosition < sliceEnd) {
                        winningIndex = i;
                        break;
                    }
                } else {
                    // Handle wrap-around case
                    if (pointerPosition >= sliceStart || pointerPosition < sliceEnd) {
                        winningIndex = i;
                        break;
                    }
                }
            }

            console.log('Rotation:', normalizedRotation, 'Winning index:', winningIndex, 'Team:', teams[winningIndex].name);
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
