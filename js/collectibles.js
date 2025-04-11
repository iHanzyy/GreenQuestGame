// Fungsi collision detection (dapat digunakan ulang)
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Kelas Collectible untuk item yang bisa dikumpulkan
class Collectible {
    constructor(x, y, width = 40, height = 40, type, game = null) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // Misalnya: "coin" atau "powerup"
        this.collected = false;
        
        // Load image (gunakan image yang sesuai, contoh menggunakan trash_can.png)
        this.image = new Image();
        this.image.src = 'assets/images/trash_can.png';
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        };
        
        // Animation properties
        this.floatOffset = 0;
        this.floatSpeed = 0.005;
        this.originalY = y;
        this.floatAmplitude = 10;
        
        
        // Activation delay: collectible tidak aktif selama 500ms pertama
        this.activationDelay = 500; // dalam milidetik
    }

    // Proses pengumpulan objek oleh pemain
    collect(player) {
        this.collected = true;
        // Jika collectible adalah power-up, aktifkan power-up pada pemain
        if (this.type === "powerup" && player && typeof player.activatePowerUp === 'function') {
            player.activatePowerUp("speed", 5000); // Durasi power-up dalam milidetik
        }
        // Jika collectible adalah coin, tambahkan skor, dsb.
        // Contoh: player.updateScore(10);
    }

    // Update collectible: animasi, gerak bersama kamera, dan cek tabrakan dengan pemain
    update(deltaTime, playerSpeed, player) {
        // Pastikan deltaTime bernilai numerik
        if (typeof deltaTime !== 'number') deltaTime = 16;
        
        // Floating animation
        this.floatOffset += this.floatSpeed * deltaTime;
        this.y = this.originalY + Math.sin(this.floatOffset) * this.floatAmplitude;
        
        // Rotation animation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Shine effect
        this.shine += 0.02 * this.shineDirection * deltaTime;
        if (this.shine >= 1) {
            this.shine = 1;
            this.shineDirection = -1;
        } else if (this.shine <= 0) {
            this.shine = 0;
            this.shineDirection = 1;
        }
        
        // Gerak collectible mengikuti kecepatan kamera
        this.x -= playerSpeed;
        
        // Pengurangan delay sebelum collectible aktif
        if (this.activationDelay > 0) {
            this.activationDelay -= deltaTime;
        } else {
            // Cek collision dengan pemain hanya jika collectible sudah aktif
            if (player && !this.collected && checkCollision(player, this)) {
                this.collect(player);
            }
        }
        
        // Hapus collectible jika sudah keluar layar
        if (this.x + this.width < 0) {
            return true; // Collectible harus dihapus
        }
        return false;
    }

    // Gambar collectible pada kanvas
    draw(ctx) {
        if (!this.collected) {
            ctx.save();
            // Set titik rotasi pada tengah collectible
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.rotation);
            if (this.loaded) {
                ctx.drawImage(
                    this.image,
                    -this.width / 2,
                    -this.height / 2,
                    this.width,
                    this.height
                );
            } else {
                // Jika gambar belum dimuat, gambar kotak sebagai fallback
                ctx.fillStyle = "#FFD700";
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
            // Gambar efek shine
            if (this.shine > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.shine * 0.5})`;
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

// Background class for parallax scrolling effect
class Background {
    constructor(game) {
        this.game = game;
        this.width = game.canvas.width;
        this.height = game.canvas.height;
        
        // Load background image
        this.image = new Image();
        this.image.src = 'assets/images/background_forest.png';
        
        // Parallax layers
        this.layers = [
            { image: this.image, x: 0, speed: 0.2 },
            { image: this.image, x: this.width, speed: 0.2 }
        ];
    }
    
    update(playerSpeed) {
        // Gerak tiap layer berdasarkan kecepatan pemain dan faktor parallax
        this.layers.forEach(layer => {
            layer.x -= playerSpeed * layer.speed;
            
            // Reset posisi layer ketika sudah keluar layar
            if (layer.x <= -this.width) {
                layer.x = this.width - Math.abs(layer.x + this.width);
            }
        });
    }
    
    draw(ctx) {
        // Gambar tiap layer background
        this.layers.forEach(layer => {
            ctx.drawImage(layer.image, layer.x, 0, this.width, this.height);
        });
    }
}
