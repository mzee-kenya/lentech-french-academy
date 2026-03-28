// Lightweight confetti launcher using canvas-confetti CDN when available.
(function(){
    let confettiFn = null;
    function loadConfetti(){
        return new Promise((resolve)=>{
            if (confettiFn) return resolve(confettiFn);
            if (window.confetti) { confettiFn = window.confetti; return resolve(confettiFn); }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
            s.onload = () => { confettiFn = window.confetti; resolve(confettiFn); };
            s.onerror = () => { console.warn('Failed to load confetti library'); resolve(null); };
            document.head.appendChild(s);
        });
    }

    async function launchConfetti(opts){
        const fn = await loadConfetti();
        if (!fn) return;
        // simple burst
        fn({
            particleCount: opts && opts.particleCount || 120,
            spread: opts && opts.spread || 60,
            origin: { y: 0.6 }
        });
    }

    window.lenoxConfetti = { launchConfetti, loadConfetti };
})();
