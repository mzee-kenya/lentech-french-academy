// Gamification utilities: XP, badges, daily challenges integration
(function(){
    const XP_KEY = 'lenox_xp';
    const BADGES_KEY = 'lenox_badges';
    const DAILY_KEY = 'lenox_daily';

    function getState(){
        const state = { xp:0, badges:[], daily:{}};
        try{
            if (window.auth && auth.currentUser) {
                state.xp = Number(auth.currentUser.xp || 0);
                state.badges = Array.isArray(auth.currentUser.badges) ? auth.currentUser.badges.slice() : [];
            } else {
                state.xp = Number(localStorage.getItem(XP_KEY) || 0);
                state.badges = JSON.parse(localStorage.getItem(BADGES_KEY) || '[]');
            }
            state.daily = JSON.parse(localStorage.getItem(DAILY_KEY) || '{}');
        }catch(e){ console.warn('gamification read state failed', e); }
        return state;
    }

    function saveState(state){
        try{
            if (window.auth && auth.currentUser) {
                auth.currentUser.xp = state.xp;
                auth.currentUser.badges = state.badges;
                // if the auth layer supports persistence, call it
                if (typeof auth.saveCurrentUser === 'function') auth.saveCurrentUser();
            } else {
                localStorage.setItem(XP_KEY, String(state.xp));
                localStorage.setItem(BADGES_KEY, JSON.stringify(state.badges));
            }
            localStorage.setItem(DAILY_KEY, JSON.stringify(state.daily || {}));
        }catch(e){ console.warn('gamification save state failed', e); }
    }

    function addXp(amount, opts){
        const s = getState();
        s.xp = Number(s.xp || 0) + Number(amount || 0);
        saveState(s);
        // play sound
        if (window.lenoxSounds) lenoxSounds.playSound('correct');
        // bump leaderboard if auth provides endpoint
        if (window.auth && typeof auth.updateXp === 'function') {
            try { auth.updateXp(s.xp); } catch(e) { console.warn('auth.updateXp failed', e); }
        }
        // check for milestone badges
        checkMilestones(s);
        return s.xp;
    }

    function awardBadge(id, title, description, icon){
        const s = getState();
        if (s.badges.find(b => b.id === id)) return false; // already
        const badge = { id, title, description, icon: icon || '', earnedAt: Date.now() };
        s.badges.push(badge);
        saveState(s);
        // play level complete sound and confetti
        if (window.lenoxSounds) lenoxSounds.playSound('levelComplete');
        if (window.lenoxConfetti) lenoxConfetti.launchConfetti();
        // show share modal if available
        if (typeof window.showShareModal === 'function') window.showShareModal(auth && auth.currentUser ? auth.currentUser.username : 'Learner', title);
        return true;
    }

    function checkMilestones(state){
        try{
            const xp = Number(state.xp || 0);
            if (xp >= 1000) awardBadge('milestone-1000','1000 XP Achiever','Earned 1,000 XP');
            if (xp >= 5000) awardBadge('milestone-5000','5000 XP Achiever','Earned 5,000 XP');
        }catch(e){}
    }

    function getBadges(){ return getState().badges || []; }

    // Daily Challenges: mark task completed and grant bonus XP once per day
    function completeDaily(challengeId, xpBonus){
        const s = getState();
        const today = new Date().toISOString().slice(0,10);
        s.daily = s.daily || {};
        s.daily[challengeId] = s.daily[challengeId] || {};
        if (s.daily[challengeId].lastCompleted === today) return false; // already
        s.daily[challengeId].lastCompleted = today;
        saveState(s);
        addXp(xpBonus || 50);
        return true;
    }

    window.lenoxGamification = { addXp, awardBadge, getBadges, completeDaily };
})();
