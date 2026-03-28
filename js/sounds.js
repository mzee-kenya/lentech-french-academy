// Simple sound manager: preloads short effects and exposes playSound(name)
(function(){
    const sounds = {
        correct: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
        incorrect: 'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg',
        levelComplete: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing.ogg'
    };
    const audioCache = {};
    const settingsKey = 'lenox_sounds_muted';

    function isMuted(){
        try { return localStorage.getItem(settingsKey) === '1'; } catch(e){ return false; }
    }

    function preload(){
        Object.keys(sounds).forEach(k => {
            try{
                const a = new Audio(sounds[k]); a.preload = 'auto'; audioCache[k]=a;
            }catch(e){ console.warn('sound preload failed', e); }
        });
    }

    function playSound(name){
        if (isMuted()) return;
        const a = audioCache[name];
        if (a) { try { a.currentTime = 0; a.play(); } catch(e){ console.warn('play failed', e); } }
    }

    function toggleMute(val){
        try { localStorage.setItem(settingsKey, val ? '1' : '0'); } catch(e){}
    }

    preload();
    window.lenoxSounds = { playSound, toggleMute, isMuted };
})();
