/* Leaderboard client script
   - Attempts to use auth.getTopLearners() if available
   - Falls back to localStorage 'leaderboard' data or generates a sample
   - Provides search, friends-only filter, and limit selection
*/
(async function(){
    const loading = document.getElementById('leaderLoading');
    const listEl = document.getElementById('leaderList');
    const emptyEl = document.getElementById('leaderEmpty');
    const searchInput = document.getElementById('searchInput');
    const friendsOnly = document.getElementById('friendsOnly');
    const limitSelect = document.getElementById('limitSelect');

    function showLoading() { loading.style.display = 'block'; listEl.style.display='none'; emptyEl.style.display='none'; }
    function showList() { loading.style.display='none'; listEl.style.display='grid'; emptyEl.style.display='none'; }
    function showEmpty() { loading.style.display='none'; listEl.style.display='none'; emptyEl.style.display='block'; }

    function normalizeUser(u){
        return {
            username: u.username || u.user || u.name || 'Learner',
            xp: Number(u.xp || u.points || 0),
            avatar: u.avatar || u.photo || '',
            country: u.country || '',
            id: u.id || u.username || Math.random().toString(36).slice(2,9)
        };
    }

    function generateMock(){
        const sample = [
            {username:'Amelie', xp:3420},{username:'Carlos', xp:2980},{username:'Fatima', xp:2750},
            {username:'Liam', xp:2500},{username:'Noah', xp:2400},{username:'Maya', xp:2200},
            {username:'Sofia', xp:2100},{username:'Jean', xp:1950},{username:'Lea', xp:1800},
            {username:'Oliver', xp:1700}
        ];
        // ensure current user present
        if (window.auth && auth.currentUser) sample.push({username: auth.currentUser.username, xp: auth.currentUser.xp || 0});
        return sample.map(normalizeUser);
    }

    async function fetchLeaderboard(){
        // Preferred: auth API
        if (window.auth && typeof auth.getTopLearners === 'function') {
            try { const res = await auth.getTopLearners(); return (res||[]).map(normalizeUser); } catch(e){ console.warn('auth.getTopLearners failed', e); }
        }
        // Fallback: global auth.users
        if (window.auth && Array.isArray(auth.users) && auth.users.length) {
            return auth.users.map(normalizeUser);
        }
        // localStorage fallback: 'leaderboard'
        try {
            const raw = localStorage.getItem('leaderboard');
            if (raw) return JSON.parse(raw).map(normalizeUser);
        } catch(e) { /* ignore */ }
        // final fallback: generate sample
        return generateMock();
    }

    function render(learners){
        listEl.innerHTML = '';
        if (!learners || learners.length === 0) { showEmpty(); return; }
        learners.forEach((u, idx) => {
            const item = document.createElement('div'); item.className = 'leader-item';
            item.innerHTML = `
                <div class="leader-rank">${idx+1}</div>
                <div class="leader-avatar">${u.avatar ? `<img src="${u.avatar}" alt="${u.username}" style="width:100%;height:100%;object-fit:cover">` : ''}</div>
                <div class="leader-meta">
                    <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="font-weight:700">${u.username}</div>
                        <div style="font-size:.85rem;color:#666">${u.country ? u.country : ''}</div>
                    </div>
                    <div style="font-size:.85rem;color:#666">ID: ${u.id}</div>
                </div>
                <div class="leader-xp">${u.xp} XP</div>
            `;
            listEl.appendChild(item);
        });
        showList();
    }

    function applyFilters(all){
        const q = (searchInput.value||'').toLowerCase().trim();
        const limit = Number(limitSelect.value) || 10;
        let filtered = all.slice();
        if (friendsOnly.checked && window.auth && auth.currentUser && Array.isArray(auth.currentUser.friends)){
            const friends = new Set(auth.currentUser.friends.map(f => (typeof f === 'string' ? f : f.username)));
            filtered = filtered.filter(u => friends.has(u.username));
        }
        if (q) filtered = filtered.filter(u => u.username.toLowerCase().includes(q));
        // sort by xp desc
        filtered.sort((a,b) => b.xp - a.xp);
        return filtered.slice(0, limit);
    }

    // wire controls
    let cached = [];
    searchInput.addEventListener('input', () => render(applyFilters(cached)));
    friendsOnly.addEventListener('change', () => render(applyFilters(cached)));
    limitSelect.addEventListener('change', () => render(applyFilters(cached)));

    // show logged-in username if available
    if (window.auth && auth.currentUser) {
        const un = document.getElementById('userName'); if (un) un.textContent = `👤 ${auth.currentUser.username}`;
    }

    // initial load
    try {
        showLoading();
        let learners = await fetchLeaderboard();
        // ensure items are normalized and unique by username
        const map = new Map();
        learners.forEach(u => map.set(u.username, u));
        cached = Array.from(map.values());
        // sort desc
        cached.sort((a,b) => b.xp - a.xp);
        render(applyFilters(cached));
    } catch (err) {
        console.error('Leaderboard error', err);
        loading.textContent = 'Failed to load leaderboard.';
    }

})();
