let labSettings = {
    circleCount: 1,
    spread: 0,
    strokeWeight: 1,
    isPaused: false,
    shape: 'circle',
    isDarkMode: false // NEW
};

const labSketch = (p) => {
    const cursorPlaying = "url('cursors/playblend1.webp'), auto";
    const cursorPaused = "url('cursors/pauseblend1.webp'), auto";

    p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('canvas-container');
        p.background(244); 
        p.cursor(cursorPlaying);
    };

p.draw = () => {
    if (labSettings.isPaused) return;

    // Always draw black; the CSS Filter will flip it if needed
    p.stroke(0); 
    p.strokeWeight(labSettings.strokeWeight);
    p.noFill();
    // ... rest of your size and shape logic ...


        let distToCenter = p.dist(p.mouseX, p.mouseY, p.width/2, p.height/2);
        let size = p.map(distToCenter, 0, p.width/2, 800, 50);

        for (let i = 0; i < labSettings.circleCount; i++) {
            let offsetX = p.random(-labSettings.spread, labSettings.spread);
            let offsetY = p.random(-labSettings.spread, labSettings.spread);
            
            let posX = p.mouseX + offsetX;
            let posY = p.mouseY + offsetY;

            // --- SHAPE LOGIC ---
            if (labSettings.shape === 'circle') {
                p.circle(posX, posY, size);
            } 
            else if (labSettings.shape === 'square') {
                p.rectMode(p.CENTER);
                p.rect(posX, posY, size, size);
            } 
            else if (labSettings.shape === 'triangle') {
                // Equilateral triangle calculation
                let h = size * (Math.sqrt(3)/2);
                p.ellipse(
                    posX, posY - h/2,             // Top point
                    posX - size/2, posY + h/2,     // Bottom left
                    posX + size/2, posY + h/2      // Bottom right
                );
            }
        }
    };

    p.mousePressed = () => {
        // Buffer for buttons at the bottom
        if (p.mouseY > p.height - 80) return; 

        labSettings.isPaused = !labSettings.isPaused;

        if (labSettings.isPaused) {
            p.cursor(cursorPaused);
            p.noLoop(); 
        } else {
            p.cursor(cursorPlaying);
            p.loop();
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        p.background(244);
    };
};

// --- Updated CONTROL FUNCTIONS ---

function saveArt() {
  // 1. If we are in Light Mode, just save normally and stop.
  if (!labSettings.isDarkMode) {
    myLab.saveCanvas('bjarki-creation', 'jpg');
    return;
  }

  // 2. We are in Dark Mode! We need to manually invert before saving.
  // We use p5's loadPixels() to get the raw data.
  myLab.loadPixels();
  
  // 3. The Pixel Loop (Math is required)
  // Each pixel has 4 values (R, G, B, A), so we jump by 4.
  let d = myLab.pixelDensity();
  let totalPixels = 4 * (myLab.width * d) * (myLab.height * d);

  for (let i = 0; i < totalPixels; i += 4) {
    // We get the Red, Green, and Blue values and subtract them from 255
    let r = myLab.pixels[i];     // R
    let g = myLab.pixels[i + 1]; // G
    let b = myLab.pixels[i + 2]; // B
    
    // Mathematically invert the colors
    myLab.pixels[i]     = 255 - r; // New R
    myLab.pixels[i + 1] = 255 - g; // New G
    myLab.pixels[i + 2] = 255 - b; // New B
    
    // We leave pixels[i + 3] (Alpha) alone
  }

  // 4. Put the flipped pixels back onto the canvas
  myLab.updatePixels();

  // 5. Save the actually-inverted image
  myLab.saveCanvas('bjarki-creation-dark', 'jpg');

  // 6. Optional: Immediately flip it back to Light mode
  // so the user can continue drawing without a weird flash.
  // We use p5's filter function for this rapid flip-back.
  myLab.filter(myLab.INVERT); 
}
// Start the p5 engine
const myLab = new p5(labSketch);

// 3. OVERLAY LOGIC

function closeOverlay() {
    const overlay = document.getElementById('overlay-instructions');
    if (overlay) {
        overlay.classList.add('hide-overlay');
        // Ensure the screen is fresh when they hit start
        if (typeof myLab !== 'undefined') {
            myLab.background(244);
        }
    }
}

// --- NEW CONTROL FUNCTIONS ---

function updateMode(mode) {
    // 1. Remove 'active' class from all buttons to reset visual state
    document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Add 'active' class to the button that was clicked
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    if (mode === 'minimal') {
        labSettings.circleCount = 1;
        labSettings.spread = 0;
        labSettings.strokeWeight = 1;
    } 
    else if (mode === 'spray') {
        // We increase these numbers to create the "cluster" effect
        labSettings.circleCount = 5; 
        labSettings.spread = 15;      
        labSettings.strokeWeight = 0.5; // Thinner lines look better in spray mode
    }
}

function clearCanvas() {
    // We clear to 244 (White) because the CSS filter handles the inversion
    myLab.background(244);
}

function toggleShape() {
    const btn = document.getElementById('shape-toggle');
    
    if (labSettings.shape === 'circle') {
        labSettings.shape = 'square';
        btn.innerText = "shape: square";
    } else if (labSettings.shape === 'square') {
        labSettings.shape = 'triangle';
        btn.innerText = "shape: ellipse";
    } else {
        labSettings.shape = 'circle';
        btn.innerText = "shape: circle";
    }
}

function toggleInvert() {
    // 1. Toggle the state
    labSettings.isDarkMode = !labSettings.isDarkMode;
    
    // 2. Target the canvas element
    const canvas = document.querySelector('canvas');
    const btn = document.getElementById('invert-toggle');

    if (labSettings.isDarkMode) {
        canvas.classList.add('inverted-canvas');
        btn.innerText = "invert";
    } else {
        canvas.classList.remove('inverted-canvas');
        btn.innerText = "invert";
    }
    
    // NOTE: We do NOT call background() here anymore.
    // Your drawing stays exactly where it was!
}

// --- TIMER LOGIC ---

let timeLeft = 3; // Set your duration here
const timerEl = document.getElementById('timer-sec');

// Start the countdown immediately on page load
const countdown = setInterval(() => {
    timeLeft--;
    
    // Update the number in the HTML
    if (timerEl) {
        timerEl.innerText = timeLeft;
    }

    // When time runs out, close the overlay
    if (timeLeft <= 0) {
        closeOverlay();
    }
}, 1000);

// Update your existing closeOverlay to stop the timer 
// (In case the user clicks the button before 5 seconds is up)
function closeOverlay() {
    clearInterval(countdown); // This stops the timer from running in the background
    
    const overlay = document.getElementById('overlay-instructions');
    if (overlay) {
        overlay.classList.add('hide-overlay');
        if (typeof myLab !== 'undefined') {
            myLab.background(244);
        }
    }
}