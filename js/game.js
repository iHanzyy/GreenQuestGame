// Main game class to handle game loop and state
class Game {
    constructor() {
        // Canvas dan konteks
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 900;
        this.canvas.height = 600;
        
        // Game state
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover', 'win'
        this.score = 0;
        this.winScore = 200; // Ubah target score untuk memenangkan game menjadi 200
        this.time = 60; // In seconds
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        
        // Game objects
        this.player = null;
        this.background = null;
        this.platforms = [];
        this.collectibles = [];
        this.obstacles = [];
        
        // Camera scroll speed
        this.cameraSpeed = 0;
        
        // Initialize sound effects
        this.sounds = {
            ding: new Audio('assets/sounds/ding.mp3'),
            whoosh: new Audio('assets/sounds/whoosh.mp3')
        };
        
        // Load eco facts
        this.ecoFacts = [
            "One plastic bottle takes 450 years to decompose in nature.",
            "Every year, 8 million tons of plastic end up in our oceans.",
            "Recycling one aluminum can saves enough energy to run a TV for three hours.",
            "A typical family consumes 182 gallons of soda annually, creating a lot of plastic waste.",
            "50% of the plastic we use, we use just once and throw away.",
            "Over 1 million seabirds die from plastic pollution each year.",
            "Using reusable bags can eliminate an average of 307 plastic bags per person annually.",
            "Plastic bags can take up to 1,000 years to decompose.",
            "More than 40% of our oceans are heavily affected by human activities.",
            "Planting trees helps reduce carbon dioxide and fight climate change."
        ];
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Set up event listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Perbaiki event listener untuk restart button
        const restartBtns = document.querySelectorAll('#restart-btn');
        restartBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('win-screen').classList.add('hidden');
                this.startGame();
            });
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        
        // Perbaiki event listener untuk menu button
        document.getElementById('menu-btn').addEventListener('click', () => {
            document.getElementById('win-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            this.gameState = 'menu';
            this.reset();
        });
        
        // Make mobile control buttons work with mouse too
        const touchButtons = document.querySelectorAll('.control-btn');
        touchButtons.forEach(button => {
            button.addEventListener('mousedown', button.ontouchstart);
            button.addEventListener('mouseup', button.ontouchend);
        });
        
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }
    
    reset() {
        this.score = 0;
        this.time = 60;
        cancelAnimationFrame(this.animationId);
        clearInterval(this.timerInterval);
        this.player = null;
        this.platforms = [];
        this.collectibles = [];
        this.obstacles = [];
    }
    
    handleResize() {
        // Make canvas responsive
        const container = document.querySelector('.game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        
        // If game is already running, update object positions
        if (this.player) {
            this.player.y = this.canvas.height - this.player.height - 40;
        }
    }
    
    startGame() {
        // Hide menu screens and show game screen
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.time = 60;
        this.updateScoreDisplay();
        this.updateTimerDisplay();
        
        // Create game objects
        this.player = new Player(this);
        this.background = new Background(this);
        this.platforms = [];
        this.collectibles = [];
        this.obstacles = [];
        
        // Create initial level
        this.createLevel();
        
        // Start the game loop
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        // Start timer countdown
        this.startTimer();
    }
    
    createLevel() {
        // Create ground platform
        this.platforms.push(new Platform(0, this.canvas.height - 40, this.canvas.width * 2, 40, this));
        
        // Create more elevated platforms with better distribution
        // First screen
        this.platforms.push(new Platform(300, 450, 250, 20, this));
        this.platforms.push(new Platform(650, 350, 250, 20, this));
        
        // Second screen
        this.platforms.push(new Platform(1000, 450, 250, 20, this));
        this.platforms.push(new Platform(1350, 350, 250, 20, this));
        this.platforms.push(new Platform(1700, 450, 250, 20, this));
        
        // Add first screen of collectibles
        this.addCollectibles(5);
        
        // Add obstacles only on the ground
        this.addObstaclesOnGround(3);
    }
    
    // New method to add obstacles only on the ground
    addObstaclesOnGround(count) {
        // Always get the ground platform (first in the array)
        const groundPlatform = this.platforms[0];
        
        for (let i = 0; i < count; i++) {
            // Position obstacles at different locations on the ground
            const obstacleX = groundPlatform.x + 600 + (i * 300) + Math.random() * 100;
            const obstacleY = groundPlatform.y - 40; // Place on top of ground
            const width = 50;
            const height = 40;
            
            this.obstacles.push(new Obstacle(obstacleX, obstacleY, width, height, 'rock', this));
        }
    }
    
    // Replace the original addObstacles method to only add on ground
    addObstacles(count) {
        // Always get the ground platform (first in the array)
        const groundPlatform = this.platforms[0];
        
        for (let i = 0; i < count; i++) {
            // Get the end of the last obstacle, or use the canvas width
            let lastObstacleX = this.canvas.width;
            if (this.obstacles.length > 0) {
                const lastObstacle = this.obstacles[this.obstacles.length - 1];
                lastObstacleX = lastObstacle.x + lastObstacle.width + 300; // Add spacing
            }
            
            const obstacleX = Math.max(lastObstacleX, groundPlatform.x + this.canvas.width);
            const obstacleY = groundPlatform.y - 40;
            const width = 50;
            const height = 40;
            
            this.obstacles.push(new Obstacle(obstacleX, obstacleY, width, height, 'rock', this));
        }
    }
    
    // Update method revised for maintaining obstacles only on ground
    update() {
        // Calculate camera speed based on player movement
        this.cameraSpeed = this.player.speedX > 0 ? 3 : 0;
        
        // Update background
        this.background.update(this.cameraSpeed);
        
        // Update player
        this.player.update(this.deltaTime);
        
        // Update platforms and remove those off screen
        this.platforms = this.platforms.filter(platform => !platform.update(this.cameraSpeed));
        
        // Update collectibles and remove those off screen or collected
        this.collectibles = this.collectibles.filter(collectible => !collectible.update(this.deltaTime, this.cameraSpeed));
        
        // Update obstacles and remove those off screen
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.update(this.deltaTime, this.cameraSpeed));
        
        // Tambahkan platform baru jika diperlukan
        if (this.platforms.length < 5) {
            const lastPlatform = this.platforms[this.platforms.length - 1];
            const x = lastPlatform.x + lastPlatform.width + Math.random() * 200 + 100;
            const y = Math.random() * 200 + 250;
            const width = Math.random() * 100 + 150;
            const height = 20;
            this.platforms.push(new Platform(x, y, width, height, this));
        }
        
        // Tambahkan collectible baru jika diperlukan
        if (this.collectibles.length < 5) {
            this.addCollectibles(1);
        }
        
        // Tambahkan obstacle baru jika diperlukan
        if (this.obstacles.length < 3) {
            this.addObstacles(1);
        }
        
        // Cek kondisi win: jika skor mencapai winScore, langsung panggil winGame() lalu keluar dari update
        if (this.score >= this.winScore) {
            this.winGame();
            return; // Hentikan update lebih lanjut
        }
    }

    addObstaclesOnPlatforms() {
        const types = ['pollution', 'waste'];
        
        // Add obstacles on platforms, not randomly
        this.platforms.forEach((platform, index) => {
            // Skip the ground platform (index 0)
            if (index === 0) return;
            
            // 50% chance to add obstacle on platform
            if (Math.random() > 0.5) {
                const obstacleX = platform.x + Math.random() * (platform.width - 50);
                const obstacleY = platform.y - 40; // Place on top of platform
                const width = 50;
                const height = 40;
                const type = types[Math.floor(Math.random() * types.length)];
                
                this.obstacles.push(new Obstacle(obstacleX, obstacleY, width, height, type, this));
            }
        });
        
        // Add a couple obstacles on the ground too
        const groundPlatform = this.platforms[0];
        for (let i = 0; i < 2; i++) {
            const obstacleX = groundPlatform.x + 800 + Math.random() * 500;
            const obstacleY = groundPlatform.y - 40;
            const width = 50;
            const height = 40;
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.obstacles.push(new Obstacle(obstacleX, obstacleY, width, height, type, this));
        }
    }
    
    // Replace the original addObstacles method with this improved version
    addObstacles(count) {
        const types = ['pollution', 'waste'];
        
        // Find existing platforms to place obstacles on
        for (let i = 0; i < count; i++) {
            // Select a random platform
            const platforms = this.platforms.filter(p => p.width >= 50); // Only platforms with enough width
            if (platforms.length === 0) return;
            
            const platform = platforms[Math.floor(Math.random() * platforms.length)];
            
            // Place obstacle on the platform
            const obstacleX = platform.x + Math.random() * (platform.width - 50);
            const obstacleY = platform.y - 40; // Place on top of platform
            const width = 50;
            const height = 40;
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.obstacles.push(new Obstacle(obstacleX, obstacleY, width, height, type, this));
        }
    }
    
    addCollectibles(count) {
        for (let i = 0; i < count; i++) {
            const x = this.canvas.width + Math.random() * 500;
            const y = Math.random() * (this.canvas.height - 200) + 100;
            // Memastikan parameter sesuai: x, y, width=40, height=40, type, game
            this.collectibles.push(new Collectible(x, y, 40, 40, "coin", this));
        }
    }
    
    addObstacles(count) {
        const types = ['pollution', 'waste'];
        for (let i = 0; i < count; i++) {
            const x = this.canvas.width + Math.random() * 500;
            const y = this.canvas.height - 80 - Math.random() * 50;
            const width = 50;
            const height = 40;
            const type = types[Math.floor(Math.random() * types.length)];
            this.obstacles.push(new Obstacle(x, y, width, height, type, this));
        }
    }
    
    gameLoop(timestamp) {
        // Calculate delta time
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing') {
            // Update game objects
            this.update();
            
            // Draw game objects
            this.draw();
            
            // Continue the game loop
            this.animationId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }
    
    draw() {
        // Draw background
        this.background.draw(this.ctx);
        
        // Draw platforms
        this.platforms.forEach(platform => platform.draw(this.ctx));
        
        // Draw collectibles
        this.collectibles.forEach(collectible => collectible.draw(this.ctx));
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        
        // Draw player
        this.player.draw(this.ctx);
    }
    
    updateScore(points) {
        this.score += points;
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('final-score').textContent = this.score;
    }
    
    updateTimerDisplay() {
        document.getElementById('timer').textContent = Math.ceil(this.time);
        document.getElementById('final-time').textContent = 60 - Math.ceil(this.time);
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing') {
                this.time -= 0.1;
                this.updateTimerDisplay();
                
                if (this.time <= 0) {
                    this.gameOver();
                }
            }
        }, 100);
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pause-menu').classList.remove('hidden');
            clearInterval(this.timerInterval);
            cancelAnimationFrame(this.animationId);
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pause-menu').classList.add('hidden');
            this.startTimer();
            this.lastTime = performance.now();
            this.gameLoop(this.lastTime);
        }
    }
    
    quitGame() {
        this.gameState = 'menu';
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        cancelAnimationFrame(this.animationId);
        clearInterval(this.timerInterval);
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        // Display a random eco fact
        const randomFact = this.ecoFacts[Math.floor(Math.random() * this.ecoFacts.length)];
        document.getElementById('eco-fact').textContent = randomFact;
        
        // Stop the timer
        clearInterval(this.timerInterval);
        
        // Cancel animation frame
        cancelAnimationFrame(this.animationId);
    }
    
    winGame() {
        this.gameState = 'win';
        // Hide game screen and pause menu
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        // Show win screen
        document.getElementById('win-screen').classList.remove('hidden');
        
        // Update win score message
        document.getElementById('win-score').textContent = this.score;
        
        // Stop game loop and timer
        clearInterval(this.timerInterval);
        cancelAnimationFrame(this.animationId);
    }
    
    playSound(soundName) {
        // Create a new audio object from the original to allow overlapping sounds
        const sound = this.sounds[soundName].cloneNode();
        sound.volume = 0.5;
        sound.play();
    }
}

// Initialize the game when the window loads
window.addEventListener('load', () => {
    const game = new Game();
});