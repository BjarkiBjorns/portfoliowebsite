// Global tracking for movement thresholds
let heroLastX = 0, heroLastY = 0;
let infoLastX = 0, infoLastY = 0;
const threshold = 5;
const moveThreshold = 5;
let heroIsPaused = false;

// --- 1. ELEMENT RANDOMIZERS & SORTING ---

/**
 * Sorts projects within their parent sections based on data-date="YYYY-MM-DD"
 */
function sortProjectsByDate() {
  const sections = document.querySelectorAll('#work, #concept, #music');
  
  sections.forEach(section => {
    const projects = Array.from(section.querySelectorAll('.project'));
    if (projects.length === 0) return;

    projects.sort((a, b) => {
      const dateA = new Date(a.getAttribute('data-date') || '1970-01-01');
      const dateB = new Date(b.getAttribute('data-date') || '1970-01-01');
      return dateB - dateA; 
    });

    projects.forEach(project => section.appendChild(project));
  });
}

function randomizeElement(parentId, elementId) {
  if (parentId === 'hero-container' && heroIsPaused) return;
  const parent = document.getElementById(parentId);
  const el = document.getElementById(elementId);
  if (!parent || !el) return;
  const maxX = parent.clientWidth - el.clientWidth;
  const maxY = parent.clientHeight - el.clientHeight;
  el.style.left = `${Math.floor(Math.random() * Math.max(0, maxX))}px`;
  el.style.top = `${Math.floor(Math.random() * Math.max(0, maxY))}px`;
}

function initAllElements() {
  const heroIds = ['random-video', 'random-video2', 'random-video3', 'random-video4', 'random-image', 'random-image2', 'random-image3'];
  heroIds.forEach(id => randomizeElement('hero-container', id));
}

// --- 2. HERO INTERACTION ---

const heroContainer = document.getElementById('hero-container');

if (heroContainer) {
  const cursorPlaying = "url('cursors/play1.png'), auto"; 
  const cursorPaused = "url('cursors/pause1.png'), auto";

  heroContainer.style.cursor = cursorPlaying;

  heroContainer.addEventListener('mousemove', (e) => {
    if (heroIsPaused) return;
    if (Math.abs(e.pageX - heroLastX) > threshold || Math.abs(e.pageY - heroLastY) > threshold) {
      initAllElements();
      heroLastX = e.pageX; 
      heroLastY = e.pageY;
    }
  });

  heroContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') return;
    heroIsPaused = !heroIsPaused;
    heroContainer.style.cursor = heroIsPaused ? cursorPaused : cursorPlaying;
  });
}

// --- 3. PROJECT INTERACTION (Chaos, No Overlap) ---

function setupProjectInteractions() {
  document.querySelectorAll('.project').forEach(project => {
    const image = project.querySelector('.project-image');
    if (!image) return;

    image.addEventListener('click', () => {
      const infoElements = project.querySelectorAll('.project-info');
      if (infoElements.length === 0) return;
      
      const isOpening = infoElements[0].classList.contains('hidden');
      const placedElements = [image]; 

      infoElements.forEach(info => {
        if (isOpening) {
          info.classList.remove('hidden');
          let attempts = 0;
          let foundSpot = false;

          while (!foundSpot && attempts < 500) {
            randomizeProjectElement(project, info);
            const overlap = placedElements.some(el => checkOverlap(info, el, 20)); 
            if (!overlap) {
              foundSpot = true;
              placedElements.push(info);
            }
            attempts++;
          }
        } else {
          info.classList.add('hidden');
          info.style.left = '';
          info.style.top = '';
        }
      });
    });
  });
}

function checkOverlap(el1, el2, buffer = 0) {
  const r1 = el1.getBoundingClientRect();
  const r2 = el2.getBoundingClientRect();
  return !(r1.right + buffer < r2.left || r1.left - buffer > r2.right || r1.bottom + buffer < r2.top || r1.top - buffer > r2.bottom);
}

function randomizeProjectElement(projectDiv, el) {
  const margin = 50; 
  const parentW = projectDiv.offsetWidth;
  const parentH = projectDiv.offsetHeight;
  const elW = el.offsetWidth || 180; 
  const elH = el.offsetHeight || 150;

  const maxX = Math.max(0, parentW - elW - (margin * 2));
  const maxY = Math.max(0, parentH - elH - (margin * 2));

  el.style.left = `${Math.floor(Math.random() * maxX) + margin}px`;
  el.style.top = `${Math.floor(Math.random() * maxY) + margin}px`;
}

// --- 4. LIGHTBOX FUNCTIONALITY ---

function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (!lightbox || !lightboxImg) return;

  // Listen for clicks
  document.addEventListener('click', (e) => {
    const el = e.target;
    
    // Check if it's a standard image OR a video with your specific fix class
    const isProjectImage = el.tagName === 'IMG' && el.closest('.project-info');
    const isProjectVideo = el.classList.contains('image-video-lightbox-fix') && el.closest('.project-info');
    
    if (isProjectImage || isProjectVideo) {
      // Clear previous content
      lightbox.querySelectorAll('.lightbox-content').forEach(child => {
        if (child.id !== 'lightbox-img') child.remove();
      });

      if (isProjectImage) {
        lightboxImg.src = el.src;
        lightboxImg.classList.remove('hidden');
      } else if (isProjectVideo) {
        lightboxImg.classList.add('hidden'); // Hide the image tag
        
        // Create a video element for the lightbox
        const lbVideo = document.createElement('video');
        lbVideo.src = el.querySelector('source') ? el.querySelector('source').src : el.src;
        lbVideo.autoplay = true;
        lbVideo.loop = true;
        lbVideo.muted = true;
        lbVideo.playsInline = true;
        lbVideo.classList.add('lightbox-content');
        lightbox.appendChild(lbVideo);
      }

      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; 
    }
  });

  lightbox.addEventListener('click', (e) => {
    // Close if clicking the background or the close button
    if (!e.target.classList.contains('lightbox-content')) {
      lightbox.classList.add('hidden');
      document.body.style.overflow = 'auto';
      lightboxImg.src = "";
      
      // Remove any video elements created
      const video = lightbox.querySelector('video');
      if (video) video.remove();
    }
  });
}

// --- 5. INFO / P5 SKETCH ---

const sketchSettings = {
  circleCount: 5,         
  minSizeLimit: 100,        
  maxSizeLimit: 1400,       
  spread: 1,            
  strokeWeight: 1,       
  strokeColor: 2,        
  fillColor: [244, 244, 244, 100], 
  clearOnMove: false     
};

const infoContainer = document.getElementById('info');
if (infoContainer) {
  infoContainer.addEventListener('mousemove', (e) => {
    const rect = infoContainer.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (Math.abs(currentX - infoLastX) > moveThreshold || Math.abs(currentY - infoLastY) > moveThreshold) {
      infoLastX = currentX;
      infoLastY = currentY;
    }
  });
}

const sketch = (p) => {
  const cursorPlaying = "url('cursors/play1.png'), auto";
  const cursorPaused = "url('cursors/pause1.png'), auto";

  p.setup = () => {
    let container = document.getElementById('info');
    if (container) {
      let canvas = p.createCanvas(container.clientWidth, container.clientHeight);
      canvas.parent('p5-canvas-container');
      p.background(244, 0); 
      canvas.elt.style.cursor = cursorPlaying;
    }
  };

  p.draw = () => {
    if (sketchSettings.clearOnMove) p.clear();
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const distanceToCenter = p.dist(p.mouseX, p.mouseY, centerX, centerY);
    const maxDist = p.dist(0, 0, centerX, centerY);

    let dynamicSize = p.map(distanceToCenter, 0, maxDist, sketchSettings.maxSizeLimit, sketchSettings.minSizeLimit);
    dynamicSize = p.max(dynamicSize, sketchSettings.minSizeLimit);

    let variationFactor = p.map(distanceToCenter, 0, maxDist, 0.98, 0.7);

    p.stroke(sketchSettings.strokeColor);
    p.strokeWeight(sketchSettings.strokeWeight);
    const f = sketchSettings.fillColor;
    p.fill(f[0], f[1], f[2], f[3]);

    for (let i = 0; i < sketchSettings.circleCount; i++) {
      const xOffset = p.random(-sketchSettings.spread, sketchSettings.spread);
      const yOffset = p.random(-sketchSettings.spread, sketchSettings.spread);
      const finalSize = p.random(dynamicSize * variationFactor, dynamicSize);
      p.circle(p.mouseX + xOffset, p.mouseY + yOffset, finalSize);
    }
  };

  p.mousePressed = () => {
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      if (p.isLooping()) {
        p.noLoop();
        p.cursor(cursorPaused);
      } else {
        p.loop();
        p.cursor(cursorPlaying);
      }
    }
  };

  p.windowResized = () => {
    let container = document.getElementById('info');
    if (container) {
      p.resizeCanvas(container.clientWidth, container.clientHeight);
    }
  };
};

// --- 6. INITIALIZE ---

window.addEventListener('load', () => {
  sortProjectsByDate(); 
  initAllElements(); 
  setupProjectInteractions(); 
  setupLightbox(); // Initialize Lightbox
  new p5(sketch);
});