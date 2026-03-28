// French Word Puzzles
const frenchPuzzles = [
    {
        word: "bonjour",
        hint: "What you say when you meet someone in the morning",
        translation: "hello"
    },
    {
        word: "merci",
        hint: "How to say thank you",
        translation: "thanks"
    },
    {
        word: "au revoir",
        hint: "What you say when leaving",
        translation: "goodbye"
    },
    {
        word: "s'il vous plaît",
        hint: "Polite way to ask for something",
        translation: "please"
    },
    {
        word: "comment",
        hint: "How to ask 'how'",
        translation: "how"
    }
];

let currentPuzzle = null;

function loadDailyPuzzle() {
    // Get puzzle of the day based on date
    const today = new Date().toDateString();
    const puzzleIndex = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % frenchPuzzles.length;
    currentPuzzle = frenchPuzzles[puzzleIndex];
    
    const puzzleContainer = document.getElementById('puzzleContainer');
    if (puzzleContainer) {
        puzzleContainer.innerHTML = `
            <div class="word-puzzle">
                ${currentPuzzle.word.split('').map(() => '_').join(' ')}
            </div>
            <p>💡 Hint: ${currentPuzzle.hint}</p>
            <input type="text" id="puzzleAnswer" class="puzzle-input" placeholder="Type your answer...">
            <button class="btn btn-primary" onclick="checkPuzzle()">Check Answer</button>
            <div id="puzzleResult"></div>
        `;
    }
}

function checkPuzzle() {
    const answer = document.getElementById('puzzleAnswer').value.toLowerCase().trim();
    const resultDiv = document.getElementById('puzzleResult');
    
    if (answer === currentPuzzle.word.toLowerCase()) {
        resultDiv.innerHTML = '<p style="color: var(--success);">✅ Correct! +50 XP!</p>';
        // Award XP for solving puzzle
        const puzzleSolved = localStorage.getItem('puzzleSolved');
        const today = new Date().toDateString();
        
        if (puzzleSolved !== today) {
            localStorage.setItem('puzzleSolved', today);
            // Add XP to user
            if (auth.currentUser) {
                auth.showToast('🎉 +50 XP for solving the puzzle!', 'success');
            }
        }
    } else {
        resultDiv.innerHTML = `<p style="color: var(--danger);">❌ Not quite! The correct answer is "${currentPuzzle.word}". Try again tomorrow!</p>`;
    }
}