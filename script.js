
// Game constants
const BOARD_SIZE = 8;
const LEVELS = [
    { level: 1, queens: 25, time: 120 },
    { level: 2, queens: 27, time: 100 },
    { level: 3, queens: 29, time: 90 },
    { level: 4, queens: 31, time: 80 },
    { level: 5, queens: 33, time: 75 },
    { level: 6, queens: 35, time: 70 },
    { level: 7, queens: 36, time: 65 },
    { level: 8, queens: 37, time: 60 },
    { level: 9, queens: 38, time: 55 },
    { level: 10, queens: 39, time: 50 }
];

// Scoring constants
const SCORE_PER_QUEEN = 100;
const TIME_BONUS_FACTOR = 5;
const LEVEL_COMPLETION_BONUS = 500;

// Game state
let gameStarted = false;
let gamePaused = false;
let currentLevel = 0;
let knightPosition = null;
let queenPositions = [];
let timeRemaining = 120;
let timerInterval = null;
let possibleMoves = [];
let score = 0;
let levelScore = 0;

// DOM elements
const chessboard = document.getElementById('chessboard');
const levelDisplay = document.getElementById('level');
const queensLeftDisplay = document.getElementById('queens-left');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const gameOverModal = document.getElementById('game-over');
const levelCompleteModal = document.getElementById('level-complete');
const gamePausedModal = document.getElementById('game-paused');
const completedLevelDisplay = document.getElementById('completed-level');
const restartButton = document.getElementById('restart-button');
const nextLevelButton = document.getElementById('next-level-button');
const resumeButton = document.getElementById('resume-button');
const finalScoreDisplay = document.getElementById('final-score');
const levelScoreDisplay = document.getElementById('level-score');
const totalScoreDisplay = document.getElementById('total-score');

// Initialize the chessboard
function initializeBoard() {
    chessboard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 === 0 ? 'black' : 'white'}`;
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', handleCellClick);
            chessboard.appendChild(cell);
        }
    }
}

// Get a cell element by row and column
function getCell(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

// Start the game
function startGame() {
    gameStarted = true;
    gamePaused = false;
    currentLevel = 1;
    score = 0;
    scoreDisplay.textContent = score;
    startLevel(currentLevel);
    startButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
}

// Start a level
function startLevel(level) {
    // Clear the board
    clearBoard();
    
    // Set level info
    const levelInfo = LEVELS[level - 1];
    levelDisplay.textContent = levelInfo.level;
    queensLeftDisplay.textContent = levelInfo.queens;
    timeRemaining = levelInfo.time;
    timerDisplay.textContent = timeRemaining;
    
    // Place the knight randomly in one of the traditional knight starting positions
    if (knightPosition === null) {
        const knightStartPositions = [
            {row: 0, col: 1}, {row: 0, col: 6},
            {row: 7, col: 1}, {row: 7, col: 6}
        ];
        knightPosition = knightStartPositions[Math.floor(Math.random() * knightStartPositions.length)];
    }
    
    // Place the knight
    const knightCell = getCell(knightPosition.row, knightPosition.col);
    if (knightCell) {
        knightCell.innerHTML = '♞';
        knightCell.classList.add('selected');
    }
    
    // Place queens randomly
    placeQueens(levelInfo.queens);
    
    // Calculate possible moves
    calculatePossibleMoves();
    
    // Start the timer
    startTimer();
}

// Place queens randomly on the board
function placeQueens(count) {
    queenPositions = [];
    
    while (queenPositions.length < count) {
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        
        // Make sure we don't place a queen on the knight
        if (row === knightPosition.row && col === knightPosition.col) {
            continue;
        }
        
        // Make sure we don't place a queen on another queen
        if (queenPositions.some(queen => queen.row === row && queen.col === col)) {
            continue;
        }
        
        queenPositions.push({row, col});
        const cell = getCell(row, col);
        if (cell) {
            cell.innerHTML = '♛';
        }
    }
    
    queensLeftDisplay.textContent = queenPositions.length;
}

// Calculate possible knight moves
function calculatePossibleMoves() {
    possibleMoves = [];
    const knightMoves = [
        {rowDiff: -2, colDiff: -1}, {rowDiff: -2, colDiff: 1},
        {rowDiff: -1, colDiff: -2}, {rowDiff: -1, colDiff: 2},
        {rowDiff: 1, colDiff: -2}, {rowDiff: 1, colDiff: 2},
        {rowDiff: 2, colDiff: -1}, {rowDiff: 2, colDiff: 1},
    ];
    
    // Clear previous highlights
    document.querySelectorAll('.cell.highlight').forEach(cell => {
        cell.classList.remove('highlight');
    });
    
    // Calculate new moves
    knightMoves.forEach(move => {
        const newRow = knightPosition.row + move.rowDiff;
        const newCol = knightPosition.col + move.colDiff;
        
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            possibleMoves.push({row: newRow, col: newCol});
            
            // Highlight the cell
            const cell = getCell(newRow, newCol);
            if (cell) {
                cell.classList.add('highlight');
            }
        }
    });
}

// Handle cell click
function handleCellClick(event) {
    if (!gameStarted || gamePaused) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // Check if this is a valid move
    const isValidMove = possibleMoves.some(move => move.row === row && move.col === col);
    
    if (isValidMove) {
        // Remove knight from previous position
        const prevCell = getCell(knightPosition.row, knightPosition.col);
        if (prevCell) {
            prevCell.innerHTML = '';
            prevCell.classList.remove('selected');
        }
        
        // Move knight to new position
        knightPosition = {row, col};
        const newCell = getCell(row, col);
        if (newCell) {
            newCell.innerHTML = '♞';
            newCell.classList.add('selected');
        }
        
        // Check if there was a queen
        const queenIndex = queenPositions.findIndex(queen => queen.row === row && queen.col === col);
        if (queenIndex !== -1) {
            // Add capture animation
            newCell.classList.add('capture-animation');
            setTimeout(() => {
                newCell.classList.remove('capture-animation');
            }, 500);
            
            // Update game state
            queenPositions.splice(queenIndex, 1);
            queensLeftDisplay.textContent = queenPositions.length;
            
            // Update score
            updateScore(SCORE_PER_QUEEN);
            
            // Check if level is complete
            if (queenPositions.length === 0) {
                completeLevel();
            }
        }
        
        // Recalculate possible moves
        calculatePossibleMoves();
    }
}

// Start the timer
function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!gamePaused) {
            timeRemaining--;
            timerDisplay.textContent = timeRemaining;
            
            if (timeRemaining <= 0) {
                gameOver();
            }
        }
    }, 1000);
}

// Update score
function updateScore(points) {
    score += points;
    levelScore += points;
    scoreDisplay.textContent = score;
}

// Pause game
function pauseGame() {
    if (!gameStarted) return;
    
    gamePaused = true;
    pauseButton.textContent = 'Resume';
    gamePausedModal.style.display = 'block';
}

// Resume game
function resumeGame() {
    gamePaused = false;
    pauseButton.textContent = 'Pause';
    gamePausedModal.style.display = 'none';
}

// Complete level
function completeLevel() {
    clearInterval(timerInterval);
    
    // Calculate time bonus
    const timeBonus = timeRemaining * TIME_BONUS_FACTOR;
    const totalLevelScore = levelScore + timeBonus + LEVEL_COMPLETION_BONUS;
    
    // Update score
    score += timeBonus + LEVEL_COMPLETION_BONUS;
    scoreDisplay.textContent = score;
    
    // Display level score
    levelScoreDisplay.textContent = totalLevelScore;
    totalScoreDisplay.textContent = score;
    
    if (currentLevel < LEVELS.length) {
        completedLevelDisplay.textContent = currentLevel;
        levelCompleteModal.style.display = 'block';
    } else {
        // Game completed
        gameOverModal.querySelector('h2').textContent = 'Congratulations!';
        gameOverModal.querySelector('p').textContent = 'You have completed all levels!';
        finalScoreDisplay.textContent = score;
        gameOverModal.style.display = 'block';
    }
}

// Go to next level
function nextLevel() {
    levelCompleteModal.style.display = 'none';
    currentLevel++;
    levelScore = 0;
    startLevel(currentLevel);
}

// Game over
function gameOver() {
    clearInterval(timerInterval);
    gameStarted = false;
    gamePaused = false;
    pauseButton.style.display = 'none';
    finalScoreDisplay.textContent = score;
    gameOverModal.style.display = 'block';
}

// Restart game
function restartGame() {
    gameOverModal.style.display = 'none';
    knightPosition = null;
    gameStarted = true;
    gamePaused = false;
    currentLevel = 1;
    score = 0;
    levelScore = 0;
    scoreDisplay.textContent = score;
    pauseButton.style.display = 'inline-block';
    startLevel(currentLevel);
}

// Clear the board
function clearBoard() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('selected');
        cell.classList.remove('highlight');
    });
}

// Event listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', () => {
    if (gamePaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});
restartButton.addEventListener('click', restartGame);
nextLevelButton.addEventListener('click', nextLevel);
resumeButton.addEventListener('click', resumeGame);

// Handle keyboard controls for accessibility
document.addEventListener('keydown', (e) => {
    if (!gameStarted || gamePaused) return;
    
    if (e.key === 'p' || e.key === 'P') {
        // Pause/resume with 'p' key
        if (gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});

// Initialize the game
initializeBoard();