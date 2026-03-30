// --- 1. GLOBAL TRACKING & INITIAL MOUSE MOVEMENT ---
// We define these at the very top so they are ready immediately
const loaderGif = document.getElementById('moving-loader-gif');
let heroLastX = 0, heroLastY = 0;
const threshold = 5;
let heroIsPaused = false;

// Global mouse tracker (for the GIF cursor)
window.addEventListener('mousemove', (e) => {
  if (loaderGif) {
    loaderGif.style.left = e.clientX + 'px';
    loaderGif.style.top = e.clientY + 'px';
  }
});

// --- 2. ELEMENT RANDOMIZERS & SORTING ---

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

// --- 3. HERO INTERACTION ---

function setupHeroInteraction() {
  const heroContainer = document.getElementById('hero-container');
  if (!heroContainer) return;

  const cursorPlaying = "url('cursors/playblend1.webp'), auto"; 
  const cursorPaused = "url('cursors/pauseblend1.webp'), auto";
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
  
  const currentCursor = heroIsPaused ? cursorPaused : cursorPlaying;
  heroContainer.style.cursor = currentCursor;

  // NEW: Tell p5 to update its cursor too!
  if (window.myP5) {
    window.myP5.cursor(currentCursor);
    if (heroIsPaused) window.myP5.noLoop();
    else window.myP5.loop();
  }
});
}

// --- 4. PROJECT INTERACTION (Chaos, No Overlap) ---

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
  if (window.innerWidth < 800) {
    el.style.left = '0px';
    el.style.top = '0px';
    return;
  }
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

// --- 5. LIGHTBOX & CAROUSEL SYNC ---

function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (!lightbox || !lightboxImg) return;

  let activeCarousel = null;

  document.addEventListener('click', (e) => {
    const el = e.target;
    
    // Stop propagation if clicking inside project info to prevent chaos reshuffle
    if (el.closest('.project-info')) e.stopPropagation();
    
    // 1. FULLSCREEN BUTTON
    if (el.classList.contains('fullscreen-btn')) {
      activeCarousel = el.closest('.carousel-container');
      const activeImg = activeCarousel.querySelector('img.active') || activeCarousel.querySelector('img[style*="block"]');
      if (activeImg) openLightbox(activeImg);
      return;
    }

    // 2. LIGHTBOX IMAGE CLICK (Carousel Sync)
    if (!lightbox.classList.contains('hidden') && el.id === 'lightbox-img' && activeCarousel) {
      const slides = Array.from(activeCarousel.querySelectorAll('.carousel-slides img'));
      let currentIndex = slides.findIndex(img => img.classList.contains('active') || img.style.display === 'block');
      
      slides[currentIndex].classList.remove('active');
      slides[currentIndex].style.display = 'none';
      
      currentIndex = (currentIndex + 1) % slides.length;
      const nextImg = slides[currentIndex];
      
      nextImg.classList.add('active');
      nextImg.style.display = 'block';
      
      // Update the Lightbox view to match the new slide
      lightboxImg.src = nextImg.src; 
      return;
    }

    // 3. ON-PAGE CAROUSEL CLICK
    const carouselContainer = el.closest('.carousel-container');
    if (carouselContainer && el.tagName === 'IMG' && !el.classList.contains('fullscreen-btn')) {
        const slides = Array.from(carouselContainer.querySelectorAll('.carousel-slides img'));
        let currentIndex = slides.findIndex(img => img.classList.contains('active') || img.style.display === 'block');
        slides[currentIndex].classList.remove('active');
        slides[currentIndex].style.display = 'none';
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
        slides[currentIndex].style.display = 'block';
        return;
    }

    // 4. OPEN LIGHTBOX (Standard Images/Videos)
    const isProjectInfoChild = el.closest('.project-info');
    if (isProjectInfoChild && !carouselContainer) {
      if (el.tagName === 'IMG' || el.classList.contains('image-video-lightbox-fix')) {
        activeCarousel = null; 
        openLightbox(el);
      }
    }
  });

  function openLightbox(el) {
    const oldVid = lightbox.querySelector('video');
    if (oldVid) oldVid.remove();

    if (el.tagName === 'IMG') {
      lightboxImg.src = el.src; // CRITICAL: This sets the image
      lightboxImg.classList.remove('hidden');
    } else {
      lightboxImg.classList.add('hidden');
      const lbVideo = document.createElement('video');
      lbVideo.src = el.querySelector('source')?.src || el.src;
      lbVideo.autoplay = lbVideo.loop = lbVideo.muted = lbVideo.playsInline = true;
      lbVideo.classList.add('lightbox-content');
      lightbox.appendChild(lbVideo);
    }
    
    lightbox.classList.remove('hidden');
    // Ensure the lightbox is scrolled to the top of its own container
    lightbox.scrollTop = 0; 
    document.body.style.overflow = 'hidden';
  }

  lightbox.addEventListener('click', (e) => {
    // Only close if clicking the background, not the image/video
    if (!e.target.classList.contains('lightbox-content')) {
      lightbox.classList.add('hidden');
      document.body.style.overflow = 'auto';
      activeCarousel = null;
      lightboxImg.src = ""; // Clear source on close
    }
  });
}



// --- 7. INITIALIZE ---

document.addEventListener('DOMContentLoaded', () => {
  console.log("Assets loaded.");
  
  // 1. Setup all interaction logic
  sortProjectsByDate(); 
  initAllElements(); 
  setupHeroInteraction();
  setupProjectInteractions(); 
  setupLightbox(); 
  
  if (typeof p5 !== 'undefined') new p5(sketch);

  // 2. Hide the loader
  const loader = document.getElementById('loading-screen');
  if (loader) {
    loader.classList.add('hidden-loader');
  }
});

// --- 3D LAB PORTAL LOGIC ---
const portal = document.getElementById('lab-portal');
let portalTimer;
let isAtBottom = false;

window.addEventListener('scroll', () => {
    // Only run if portal element exists
    if (!portal) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;

    if (scrollPercent >= 90) { // Trigger slightly early for reliability
        if (!isAtBottom) {
            isAtBottom = true;
            console.log("At bottom! Starting 2-second portal timer...");
            
portalTimer = setTimeout(() => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    const viewportMiddle = window.innerHeight / 2;
    const targetTop = currentScroll + viewportMiddle;

    portal.style.top = targetTop + 'px';
    
    // Ensure the browser 'sees' the hidden state first
    portal.classList.remove('float-3d');
    
    // FORCE REFLOW: This wakes up the Chromium rendering engine
    void portal.offsetWidth; 
    
    portal.classList.remove('exit-portal'); // Clean up the exit state
    void portal.offsetWidth;                // Force reflow
    portal.classList.add('float-3d');       // Swoop in!
}, 2000);

        }
    } else {
    // If user scrolls up
    if (isAtBottom) {
        isAtBottom = false;
        console.log("Scrolled up, initiating exit...");
        
        // 1. Cancel the entrance timer in case it hasn't fired yet
        clearTimeout(portalTimer);
        
        // 2. If the portal is currently visible, make it exit
        if (portal.classList.contains('float-3d')) {
            portal.classList.remove('float-3d');
            portal.classList.add('exit-portal');
            
            // Optional: Completely hide it after the animation finishes (2s)
            setTimeout(() => {
                if (!isAtBottom) portal.classList.remove('exit-portal');
            }, 2000);
        }
    }
}
});

// --- COMBINED MOUSE LOGIC ---
// We use the existing mousemove listener at the top of your script or add this one:
window.addEventListener('mousemove', (e) => {
    // 1. Move the loader GIF (Existing logic)
    if (loaderGif) {
        loaderGif.style.left = e.clientX + 'px';
        loaderGif.style.top = e.clientY + 'px';
    }

    // 2. Move the Portal (The Magic Float)
    if (portal && portal.classList.contains('float-3d')) {
        const xPct = (e.clientX / window.innerWidth) - 0.5;
        const yPct = (e.clientY / window.innerHeight) - 0.5;

        const moveX = xPct * 100; // Drift amount
        const moveY = yPct * 100;
        const rotateY = xPct * 40; // Tilt amount
        const rotateX = -yPct * 40;

        portal.style.setProperty('--mx', `${moveX}px`);
        portal.style.setProperty('--my', `${moveY}px`);
        portal.style.setProperty('--rotX', `${rotateX}deg`);
        portal.style.setProperty('--rotY', `${rotateY}deg`);
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const lazyVideos = document.querySelectorAll("video.lazy-video");

    const videoObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(videoEntry => {
            // Check if the video is now visible on screen
            if (videoEntry.isIntersecting) {
                const video = videoEntry.target;
                const source = video.querySelector("source");

                // Move the data-src to the actual src
                source.src = video.dataset.src;
                video.load(); // Tell the browser to start the download
                
                video.classList.add("loaded");
                
                // Stop watching this video once it's loaded
                observer.unobserve(video);
            }
        });
    }, {
        // This 'rootMargin' triggers the download 200px BEFORE the video 
        // actually enters the screen, so it's ready by the time they get there.
        rootMargin: "0px 0px 200px 0px" 
    });

    lazyVideos.forEach(video => {
        videoObserver.observe(video);
    });
});