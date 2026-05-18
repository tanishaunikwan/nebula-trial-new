// Register Plugin
gsap.registerPlugin(ScrollTrigger);

const MAIN_FRAME_COUNT = 192;
const MAIN_IMAGES_DIR = 'images/video main/ezgif-frame-';

const ALLURE_FRAME_COUNT = 165;
const ALLURE_IMAGES_DIR = 'images/video/ezgif-frame-';

let imagesLoaded = 0;
const totalFrames = MAIN_FRAME_COUNT + ALLURE_FRAME_COUNT;

const mainImages = [];
const allureImages = [];

const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loadingPct = document.getElementById('loading-pct');
const manifestoImg = document.getElementById('manifesto-img');
const horizontalScroll = document.getElementById('horizontal-scroll');

function drawFrame(img, canvas, ctx) {
  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.width / img.height;
  let renderWidth, renderHeight, x, y;

  if (canvasRatio > imgRatio) {
    renderWidth = canvas.width;
    renderHeight = canvas.width / imgRatio;
    x = 0; y = (canvas.height - renderHeight) / 2;
  } else {
    renderWidth = canvas.height * imgRatio;
    renderHeight = canvas.height;
    x = (canvas.width - renderWidth) / 2; y = 0;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, renderWidth, renderHeight);
}

const handleLoad = () => {
  imagesLoaded++;
  if (loadingPct) {
    loadingPct.innerText = Math.round((imagesLoaded / totalFrames) * 100);
  }
  
  if (imagesLoaded === totalFrames) {
    // Hide preloader
    if (preloader) preloader.style.display = 'none';
    initAnimations();
  }
};

// Ensure images are fetched from the local public directory relative to this script
for (let i = 1; i <= MAIN_FRAME_COUNT; i++) {
  const img = new Image();
  const frameNum = i.toString().padStart(3, '0');
  img.src = `${MAIN_IMAGES_DIR}${frameNum}.jpg`;
  img.onload = handleLoad;
  img.onerror = handleLoad; // prevent infinite loading if file doesn't exist
  mainImages.push(img);
}

for (let i = 1; i <= ALLURE_FRAME_COUNT; i++) {
  const img = new Image();
  const frameNum = i.toString().padStart(3, '0');
  img.src = `${ALLURE_IMAGES_DIR}${frameNum}.jpg`;
  img.onload = handleLoad;
  img.onerror = handleLoad; // prevent infinite loading if file doesn't exist
  allureImages.push(img);
}

function initAnimations() {
  // Lenis Setup
  const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Resize canvas
  const handleResize = () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (mainImages[0] && mainImages[0].complete) drawFrame(mainImages[0], canvas, ctx);
    }
  };
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial call

  // 1. Canvas Scrub (Intro)
  ScrollTrigger.create({
    trigger: '.canvas-scroll-area',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: (self) => {
      const frameIndex = Math.floor(self.progress * (MAIN_FRAME_COUNT - 1));
      if (mainImages[frameIndex] && mainImages[frameIndex].complete) {
        requestAnimationFrame(() => drawFrame(mainImages[frameIndex], canvas, ctx));
      }
    }
  });

  // 1b. Hero Text Choreography
  const tlHero = gsap.timeline({
    scrollTrigger: {
      trigger: '.canvas-scroll-area',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    }
  });

  tlHero
    .fromTo('.hero-phrase-1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 })
    .to('.hero-phrase-1', { opacity: 0, y: -50, duration: 1 })
    .fromTo('.hero-phrase-2', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 })
    .to('.hero-phrase-2', { opacity: 0, y: -50, duration: 1 })
    .fromTo('.hero-cta-wrapper', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });

  // 2. Manifesto Section Pinning and Frame Scrubbing
  if (manifestoImg) {
    ScrollTrigger.create({
      trigger: '.manifesto-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        const frameIndex = Math.floor(self.progress * (ALLURE_FRAME_COUNT - 1));
        if (allureImages[frameIndex] && allureImages[frameIndex].complete) {
          manifestoImg.src = allureImages[frameIndex].src;
        }
      }
    });
  }

  // 3. Horizontal Scroll
  if (horizontalScroll) {
    const scrollAmount = horizontalScroll.scrollWidth - window.innerWidth;
    
    gsap.to(horizontalScroll, {
      x: -scrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: '.horizontal-scroll-section',
        start: 'top top',
        end: () => `+=${scrollAmount}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  // 4. Fade Reveals
  gsap.utils.toArray('.gsap-reveal').forEach((el) => {
    gsap.fromTo(el, { y: 100, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.5, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // FAQ Setup
  const faqRows = document.querySelectorAll('.faq-row');
  faqRows.forEach((row) => {
    const question = row.querySelector('.faq-q');
    const answer = row.querySelector('.faq-a');
    
    question.addEventListener('click', () => {
      const isActive = row.classList.contains('active');
      
      // Close all
      faqRows.forEach(r => {
        r.classList.remove('active');
        r.querySelector('.faq-a').style.maxHeight = '0px';
      });

      // Open if it wasn't active
      if (!isActive) {
        row.classList.add('active');
        answer.style.maxHeight = '300px';
      }
    });
  });
}
