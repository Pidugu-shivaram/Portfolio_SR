import gsap from 'gsap'

export function initCursor() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return

  // ── Build DOM ────────────────────────────────────────────
  const techCursor = document.createElement('div')
  techCursor.className = 'tech-cursor'
  techCursor.innerHTML = '<span>&lt;</span><span>/&gt;</span>'
  document.body.appendChild(techCursor)

  // ── GSAP quickTo setters ─────────────────────────────────
  // Center the cursor exactly on the mouse pointer
  gsap.set(techCursor, { xPercent: -50, yPercent: -50 })
  
  const setCursorX = gsap.quickTo(techCursor, 'x', { duration: 0.15, ease: 'power3.out' })
  const setCursorY = gsap.quickTo(techCursor, 'y', { duration: 0.15, ease: 'power3.out' })

  // ── Mouse tracking ────────────────────────────────────────
  window.addEventListener('mousemove', (e) => {
    setCursorX(e.clientX)
    setCursorY(e.clientY)
  })

  // Hide when mouse leaves window
  document.addEventListener('mouseleave', () => {
    gsap.to(techCursor, { opacity: 0, duration: 0.3 })
  })
  document.addEventListener('mouseenter', () => {
    gsap.to(techCursor, { opacity: 1, duration: 0.3 })
  })

  // ── Hover States: Expand brackets on interaction ──────────
  const clickables = 'a, button, [data-magnetic], .project-card'
  
  // [BUG FIX]: Swapped 'mouseenter/mouseleave' with capture phase to 'mouseover/mouseout'. 
  // These events bubble natively, which stops the cursor from rapidly flickering 
  // when you hover over text or spans inside of your buttons.
  document.body.addEventListener('mouseover', (e) => {
    if (e.target.closest(clickables)) {
      techCursor.classList.add('is-hovering')
    }
  })
  
  document.body.addEventListener('mouseout', (e) => {
    if (e.target.closest(clickables)) {
      techCursor.classList.remove('is-hovering')
    }
  })

  // ── Magnetic pull on [data-magnetic] elements ─────────────
  
  // [BUG FIX]: Added a flag to prevent duplicate event listeners from attaching 
  // if this function gets called multiple times by the router or main.js.
  let isMagneticSetup = false;

  function setupMagnetic() {
    if (isMagneticSetup) return;
    isMagneticSetup = true;

    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35
      
      // [BUG FIX]: Variables to cache the center coordinates.
      let centerX = 0;
      let centerY = 0;

      el.addEventListener('mouseenter', () => {
        // [BUG FIX]: We only calculate the bounding box ONCE when the mouse enters.
        // This stops the massive layout thrashing (CPU spikes) that was happening 
        // when this was calculated on every single mousemove pixel.
        const rect = el.getBoundingClientRect()
        
        // We subtract the current GSAP x/y transforms so the center point is based 
        // on the element's actual static layout position, not its animated position.
        const xOffset = gsap.getProperty(el, "x") || 0;
        const yOffset = gsap.getProperty(el, "y") || 0;
        
        centerX = (rect.left + rect.width / 2) - xOffset;
        centerY = (rect.top + rect.height / 2) - yOffset;
      })

      el.addEventListener('mousemove', (e) => {
        // [BUG FIX]: Because we are using the static cached center, the element will 
        // no longer "slip" out from under the cursor and cause that violent infinite jitter loop.
        const dx = e.clientX - centerX
        const dy = e.clientY - centerY

        gsap.to(el, {
          x: dx * strength,
          y: dy * strength,
          duration: 0.4,
          ease: 'power2.out',
        })
      })

      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
      })
    })
  }

  // [BUG FIX]: Removed the internal `setupMagnetic()` call here. 
  // We rely entirely on `main.js` to initialize it so we don't accidentally run it twice.
  
  return { setupMagnetic }
}
