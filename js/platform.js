// Fungsi collision detection dengan AABB
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Platform class for creating platforms in the game
class Platform {
    constructor(x, y, width, height, game) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.game = game;
        
        // Load platform image
        this.image = new Image();
        this.image.src = 'assets/images/ground_grass.png';
    }
    
    draw(ctx) {
        // Draw tiled platform
        const tileSize = 32; // Assuming the ground_grass.png is 32x32
        const tilesX = Math.ceil(this.width / tileSize);
        
        for (let i = 0; i < tilesX; i++) {
            const drawWidth = (i === tilesX - 1 && this.width % tileSize !== 0) 
                ? this.width % tileSize 
                : tileSize;
                
            // If image has loaded, draw image; otherwise draw a colored rectangle as fallback
            if (this.image.complete) {
                ctx.drawImage(
                    this.image,
                    0, 0, drawWidth, this.height,
                    this.x + (i * tileSize), this.y, drawWidth, this.height
                );
            } else {
                ctx.fillStyle = "#654321"; // fallback color
                ctx.fillRect(this.x + (i * tileSize), this.y, drawWidth, this.height);
            }
        }
    }
    
    update(playerSpeed) {
        // Move platform with camera
        this.x -= playerSpeed;
        
        // Remove platform if it's out of screen
        if (this.x + this.width < 0) {
            return true; // Platform should be removed
        }
        return false;
    }
}

// Obstacle class for creating enemies and hazards
class Obstacle {
    constructor(x, y, width, height, type, game) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // 'pollution', 'waste', etc.
        this.game = game;
        
        // Load obstacle image
        this.image = new Image();
        this.image.src = 'assets/images/obstacle.png';
        
        // Animation properties
        this.frameCounter = 0;
        this.animationSpeed = 0.1;
    }
    
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
    
    update(deltaTime, playerSpeed) {
        // Animate the obstacle
        this.frameCounter += this.animationSpeed * deltaTime;
        
        // Move obstacle with camera
        this.x -= playerSpeed;
        
        // Remove obstacle if it's out of screen
        if (this.x + this.width < 0) {
            return true; // Obstacle should be removed
        }
        return false;
    }
}

// Fungsi updatePlatforms untuk pengecekan collision antara pemain dan platform
function updatePlatforms(platforms, player) {
    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            // Jika pemain sedang jatuh dan mendekati platform, atur posisi agar pemain "mendarat" di atas platform
            if (player.velocityY > 0 && (player.y + player.height - platform.y) < 20) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isOnGround = true;
                player.jumpCount = 0; // Reset jump count saat menyentuh platform
            }
        }
    });
}