/* Flashcards SRS using IndexedDB
   - stores cards with fields: id, front, back, box (0..n), nextReview (ISO), bookmarked (bool)
   - simple Leitner-like boxes: intervals in days
*/
(function(){
    const DB_NAME = 'lenox_flashcards_db';
    const STORE = 'cards';
    const VERSION = 1;
    const BOX_INTERVALS = [0,1,3,7,14,30]; // days; box 0 = new

    // --- IndexedDB wrapper ---
    function openDB(){
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const os = db.createObjectStore(STORE, { keyPath: 'id' });
                    os.createIndex('nextReview','nextReview',{unique:false});
                    os.createIndex('bookmarked','bookmarked',{unique:false});
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    function id() { return 'c_' + Math.random().toString(36).slice(2,9); }

    async function put(card){
        const db = await openDB();
        return new Promise((res,rej)=>{
            const tx = db.transaction(STORE,'readwrite');
            tx.objectStore(STORE).put(card);
            tx.oncomplete = () => res(card);
            tx.onerror = (e)=> rej(e.target.error);
        });
    }

    async function getAll(){
        const db = await openDB();
        return new Promise((res,rej)=>{
            const tx = db.transaction(STORE,'readonly');
            const req = tx.objectStore(STORE).getAll();
            req.onsuccess = ()=> res(req.result || []);
            req.onerror = (e)=> rej(e.target.error);
        });
    }

    async function getDueCards(){
        const all = await getAll();
        const now = new Date();
        return all.filter(c => !c.nextReview || new Date(c.nextReview) <= now).sort((a,b)=> (a.box||0)-(b.box||0));
    }

    async function getCard(idKey){
        const db = await openDB();
        return new Promise((res,rej)=>{
            const tx = db.transaction(STORE,'readonly');
            const req = tx.objectStore(STORE).get(idKey);
            req.onsuccess = ()=> res(req.result);
            req.onerror = (e)=> rej(e.target.error);
        });
    }

    async function clearAll(){
        const db = await openDB();
        return new Promise((res,rej)=>{
            const tx = db.transaction(STORE,'readwrite');
            tx.objectStore(STORE).clear();
            tx.oncomplete = ()=> res();
            tx.onerror = (e)=> rej(e.target.error);
        });
    }

    // --- SRS logic ---
    function daysFromNow(days){
        const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString();
    }

    async function markCorrect(cardId){
        const card = await getCard(cardId);
        if (!card) return;
        card.box = Math.min((card.box||0)+1, BOX_INTERVALS.length-1);
        card.nextReview = daysFromNow(BOX_INTERVALS[card.box]);
        card.lastReviewed = new Date().toISOString();
        await put(card);
        if (window.lenoxSounds) lenoxSounds.playSound('correct');
        if (window.lenoxGamification) lenoxGamification.addXp(5);
    }

    async function markIncorrect(cardId){
        const card = await getCard(cardId);
        if (!card) return;
        card.box = Math.max((card.box||0)-1, 0);
        card.nextReview = daysFromNow(BOX_INTERVALS[card.box]);
        card.lastReviewed = new Date().toISOString();
        await put(card);
        if (window.lenoxSounds) lenoxSounds.playSound('incorrect');
    }

    async function toggleBookmark(cardId){
        const card = await getCard(cardId);
        if (!card) return;
        card.bookmarked = !card.bookmarked;
        await put(card);
        return card.bookmarked;
    }

    // --- UI wiring ---
    async function initUI(){
        const dueCountEl = document.getElementById('dueCount');
        const frontEl = document.getElementById('cardFront');
        const backEl = document.getElementById('cardBack');
        const flipBtn = document.getElementById('flipBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const cardBoxEl = document.getElementById('cardBox');
        const bookmarkBtn = document.getElementById('bookmarkBtn');

        let due = await getDueCards();
        let index = 0;
        let shownCard = null;

        function refreshDue(){ getDueCards().then(list=>{ due = list; dueCountEl.textContent = due.length; if (index >= due.length) index = Math.max(0, due.length-1); renderCard(); }); }

        function renderCard(){
            if (!due || due.length === 0) { frontEl.textContent = 'No cards due — good job!'; backEl.style.display='none'; cardBoxEl.textContent='—'; bookmarkBtn.style.display='none'; return; }
            const c = due[index]; shownCard = c;
            frontEl.textContent = c.front || '(no front)';
            backEl.textContent = c.back || '';
            backEl.style.display = 'none';
            cardBoxEl.textContent = c.box || 0;
            bookmarkBtn.style.display = 'inline-block';
            bookmarkBtn.textContent = (c.bookmarked ? '★ Bookmarked' : '☆ Bookmark');
        }

        flipBtn.addEventListener('click', ()=>{ if (!shownCard) return; backEl.style.display = backEl.style.display === 'none' ? 'block' : 'none'; });
        prevBtn.addEventListener('click', ()=>{ if (!due || due.length===0) return; index = (index - 1 + due.length) % due.length; renderCard(); });
        nextBtn.addEventListener('click', ()=>{ if (!due || due.length===0) return; index = (index + 1) % due.length; renderCard(); });

        // keyboard shortcuts: space flips, arrow nav, c = correct, x = incorrect
        document.addEventListener('keydown', (e)=>{
            if (e.code === 'Space') { e.preventDefault(); flipBtn.click(); }
            if (e.key === 'ArrowRight') nextBtn.click();
            if (e.key === 'ArrowLeft') prevBtn.click();
            if (e.key === 'c') { if (shownCard) { markCorrect(shownCard.id).then(()=>{ refreshDue(); }); } }
            if (e.key === 'x') { if (shownCard) { markIncorrect(shownCard.id).then(()=>{ refreshDue(); }); } }
        });

        // Add manual correct/incorrect UI via contextual buttons (re-use flipBtn area)
        const controls = document.querySelector('.controls');
        const correctBtn = document.createElement('button'); correctBtn.className='btn btn-primary'; correctBtn.textContent='Correct (C)';
        const incorrectBtn = document.createElement('button'); incorrectBtn.className='btn btn-outline'; incorrectBtn.textContent='Incorrect (X)';
        correctBtn.addEventListener('click', ()=>{ if (shownCard) markCorrect(shownCard.id).then(()=> refreshDue()); });
        incorrectBtn.addEventListener('click', ()=>{ if (shownCard) markIncorrect(shownCard.id).then(()=> refreshDue()); });
        controls.insertBefore(correctBtn, bookmarkBtn);
        controls.insertBefore(incorrectBtn, bookmarkBtn);

        bookmarkBtn.addEventListener('click', async ()=>{
            if (!shownCard) return;
            const newVal = await toggleBookmark(shownCard.id);
            bookmarkBtn.textContent = (newVal ? '★ Bookmarked' : '☆ Bookmark');
            if (window.lenoxGamification && newVal) lenoxGamification.addXp(2);
        });

        // Sample data helper
        document.getElementById('addSample').addEventListener('click', async ()=>{
            const samples = [
                { front:'Bonjour', back:'Hello', box:0, nextReview:null, bookmarked:false },
                { front:'Merci', back:'Thank you', box:0, nextReview:null, bookmarked:false },
                { front:'Au revoir', back:'Goodbye', box:0, nextReview:null, bookmarked:false },
                { front:'S\'il vous plaît', back:'Please', box:0, nextReview:null, bookmarked:false }
            ];
            for (const s of samples) { s.id = id(); await put(s); }
            refreshDue();
        });

        document.getElementById('resetBtn').addEventListener('click', async ()=>{ if (!confirm('Reset all flashcards?')) return; await clearAll(); refreshDue(); });

        // initial render
        refreshDue();
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI); else initUI();

    // Export for debugging
    window.lenoxFlashcards = { markCorrect, markIncorrect, put, getAll, getDueCards, toggleBookmark };

})();
