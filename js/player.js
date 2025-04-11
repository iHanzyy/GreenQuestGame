// Player class for handling player movement, animations, collisions, double jump and power-ups
class Player {
    constructor(game) {
        this.game = game;
        this.width = 60;
        this.height = 80;
        this.x = 100;
        this.y = game.canvas.height - this.height - 40;
        this.speedX = 0;
        this.speedY = 0;
        this.gravity = 0.5;
        this.jumpPower = -15;
        this.isJumping = false;
        this.isMoving = false;
        this.direction = 'right';
        
        // Animation properties
        this.frames = {
            idle: new Image(),
            walk: new Image(),
            jump: new Image()
        };
        
        this.frames.idle.src = 'assets/images/hero_green.png';
        this.frames.walk.src = 'assets/images/player_walk2.png';
        this.frames.jump.src = 'assets/images/player_jump.png';
        
        this.currentFrame = this.frames.idle;
        this.animationSpeed = 0.15;
        this.frameCounter = 0;
        
        // Controls
        this.keys = {
            right: false,
            left: false,
            jump: false
        };
        
        this.setupControls();

        // Double jump properties
        this.jumpCount = 0;
        this.maxJumpCount = 2; // allow double jump
        
        // Horizontal speed and power-up properties
        this.originalSpeed = 5;
        this.speed = this.originalSpeed;
        this.hasPowerUp = false;
        this.powerUpType = null;
        this.powerUpTimer = 0;
    }
    
    setupControls() {
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && this.game.gameState === 'playing') {
                this.keys.right = true;
            }
            if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && this.game.gameState === 'playing') {
                this.keys.left = true;
            }
            if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') && this.game.gameState === 'playing') {
                this.keys.jump = true;
            }
            
            // Pause game with Escape key
            if (e.key === 'Escape') {
                this.game.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = false;
            }
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = false;
            }
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
                this.keys.jump = false;
            }
        });
        
        // Touch Controls for mobile
        document.getElementById('left-btn').addEventListener('touchstart', () => {
            this.keys.left = true;
        });
        document.getElementById('left-btn').addEventListener('touchend', () => {
            this.keys.left = false;
        });
        
        document.getElementById('right-btn').addEventListener('touchstart', () => {
            this.keys.right = true;
        });
        document.getElementById('right-btn').addEventListener('touchend', () => {
            this.keys.right = false;
        });
        
        document.getElementById('jump-btn').addEventListener('touchstart', () => {
            this.keys.jump = true;
        });
        document.getElementById('jump-btn').addEventListener('touchend', () => {
            this.keys.jump = false;
        });
    }
    
    // Jump method with double jump enabled
    jump() {
        if (this.jumpCount < this.maxJumpCount) {
            this.speedY = this.jumpPower;
            this.isJumping = true;
            this.jumpCount++;
            this.game.playSound('whoosh');
        }
    }
    
    update(deltaTime) {
        // Handle horizontal movement using the current speed (can be modified by power-ups)
        if (this.keys.right) {
            this.speedX = this.speed;
            this.direction = 'right';
            this.isMoving = true;
        } else if (this.keys.left) {
            this.speedX = -this.speed;
            this.direction = 'left';
            this.isMoving = true;
        } else {
            this.speedX = 0;
            this.isMoving = false;
        }
        
        // Handle jumping using double jump
        if (this.keys.jump) {
            this.jump();
            // Reset jump key so jump is only triggered once per key press
            this.keys.jump = false;
        }
        
        // Apply gravity
        this.speedY += this.gravity;
        
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Canvas boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.canvas.width - this.width) {
            this.x = this.game.canvas.width - this.width;
        }
        
        // Ground collision
        const groundLevel = this.game.canvas.height - this.height - 40;
        if (this.y > groundLevel) {
            this.y = groundLevel;
            this.speedY = 0;
            this.isJumping = false;
            this.jumpCount = 0;  // Reset jump count when on ground
        }
        
        // Platform collisions
        this.game.platforms.forEach(platform => {
            if (this.isCollidingWithPlatform(platform)) {
                // Only collide if falling and above the platform
                if (this.speedY > 0 && this.y + this.height - this.speedY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.speedY = 0;
                    this.isJumping = false;
                    this.jumpCount = 0;  // Reset jump count when landing on a platform
                }
            }
        });
        
        // Collectibles collision
        this.game.collectibles.forEach((collectible, index) => {
            if (this.isCollidingWithCollectible(collectible)) {
                this.game.collectibles.splice(index, 1);
                this.game.updateScore(10);
                this.game.playSound('ding');
            }
        });
        
        // Obstacles collision
        this.game.obstacles.forEach(obstacle => {
            if (this.isCollidingWithObstacle(obstacle)) {
                this.game.gameOver();
            }
        });
        
        // Update power-up timer if active
        if (this.hasPowerUp) {
            this.powerUpTimer -= deltaTime;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }
        
        // Update animation frame
        this.updateAnimation(deltaTime);
    }
    
    updateAnimation(deltaTime) {
        this.frameCounter += this.animationSpeed * deltaTime;
        
        // Choose correct frame based on player state
        if (this.isJumping) {
            this.currentFrame = this.frames.jump;
        } else if (this.isMoving) {
            this.currentFrame = this.frames.walk;
        } else {
            this.currentFrame = this.frames.idle;
        }
    }
    
    draw(ctx) {
        // Flip horizontally if moving left
        ctx.save();
        if (this.direction === 'left') {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this.currentFrame, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(this.currentFrame, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
    
    isCollidingWithPlatform(platform) {
        return (
            this.x < platform.x + platform.width &&
            this.x + this.width > platform.x &&
            this.y < platform.y + platform.height &&
            this.y + this.height > platform.y
        );
    }
    
    isCollidingWithCollectible(collectible) {
        return (
            this.x < collectible.x + collectible.width &&
            this.x + this.width > collectible.x &&
            this.y < collectible.y + collectible.height &&
            this.y + this.height > collectible.y
        );
    }
    
    isCollidingWithObstacle(obstacle) {
        return (
            this.x < obstacle.x + obstacle.width &&
            this.x + this.width > obstacle.x &&
            this.y < obstacle.y + obstacle.height &&
            this.y + this.height > obstacle.y
        );
    }
    
    // Activate a power-up (example: speed boost)
    activatePowerUp(type, duration) {
        this.hasPowerUp = true;
        this.powerUpType = type;
        this.powerUpTimer = duration;
        if (type === "speed") {
            this.speed = this.originalSpeed * 1.5;
        }
        // Extend this for other power-up types if needed
    }
    
    // Deactivate the active power-up and reset to normal
    deactivatePowerUp() {
        this.hasPowerUp = false;
        this.powerUpType = null;
        this.powerUpTimer = 0;
        this.speed = this.originalSpeed;
    }
    
    reset() {
        this.x = 100;
        this.y = this.game.canvas.height - this.height - 40;
        this.speedX = 0;
        this.speedY = 0;
        this.isJumping = false;
        this.isMoving = false;
        this.direction = 'right';
        this.keys.right = false;
        this.keys.left = false;
        this.keys.jump = false;
        this.jumpCount = 0;
        // Optionally, reset power-up related properties if needed
        this.hasPowerUp = false;
        this.powerUpType = null;
        this.powerUpTimer = 0;
        this.speed = this.originalSpeed;
    }
}