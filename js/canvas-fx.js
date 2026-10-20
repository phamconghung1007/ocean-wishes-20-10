/**
 * ==========================================================================
 * 20/10 OCEAN OF WISHES - INTERACTIVE CANVAS & MARINE ECOSYSTEM (js/canvas-fx.js)
 * - Bioluminescent sea bubbles, aurora sparkles, and celebration bursts
 * - Deep-Sea Marine Ecosystem Mode: Swimming schools of glowing fish,
 *   caustic underwater sunbeams, and dive bubble curtains
 * ==========================================================================
 */

class OceanCanvasFX {
    constructor(canvasId = 'ocean-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.burstParticles = [];
        this.fishSchool = [];
        this.deepSeaActive = false;
        this.time = 0;

        this.colors = [
            '#38bdf8', // Ocean Bright
            '#7dd3fc', // Sky Blue
            '#2dd4bf', // Aqua Glow
            '#ff6b9d', // Coral Pink
            '#f472b6', // Soft Rose
            '#fbbf24', // Pearl Gold
            '#a78bfa'  // Aurora Violet
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.initAmbientParticles();
        this.initMarineFish();
        this.animate();
    }

    resize() {
        if (!this.canvas) return;
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    initAmbientParticles() {
        const count = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 20000));
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createAmbientParticle());
        }
    }

    initMarineFish() {
        const fishCount = Math.min(32, Math.max(18, Math.floor(window.innerWidth / 58)));
        this.fishSchool = [];
        for (let i = 0; i < fishCount; i++) {
            this.fishSchool.push(this.createFish());
        }
    }

    createFish() {
        const dir = Math.random() > 0.5 ? 1 : -1;
        const speciesList = [
            'angelfish',
            'clownfish',
            'bluetang',
            'butterfly',
            'ribbon_anthias',
            'mandarinfish',
            'flyingfish'
        ];
        const species = speciesList[Math.floor(Math.random() * speciesList.length)];
        const size = species === 'angelfish' || species === 'flyingfish'
            ? Math.random() * 8 + 11
            : Math.random() * 7 + 8.5;
        const palette = ['#38bdf8', '#2dd4bf', '#7dd3fc', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185'];
        return {
            species,
            x: Math.random() * this.width,
            y: Math.random() * (this.height * 0.84) + this.height * 0.06,
            dir,
            size,
            speedX: (Math.random() * 1.15 + 0.45) * dir,
            speedY: (Math.random() - 0.5) * 0.32,
            phase: Math.random() * Math.PI * 2,
            tailSpeed: Math.random() * 0.16 + 0.08,
            waveAmp: Math.random() * 18 + 7,
            waveFreq: Math.random() * 0.38 + 0.28,
            color: palette[Math.floor(Math.random() * palette.length)],
            alpha: Math.random() * 0.42 + 0.34
        };
    }

    setDeepSeaMode(active) {
        this.deepSeaActive = Boolean(active);
    }

    triggerDiveBubbles() {
        // Tạo màn bọt biển dâng trào khi lặn xuống thế giới đại dương
        for (let i = 0; i < 95; i++) {
            this.burstParticles.push({
                x: Math.random() * this.width,
                y: this.height + Math.random() * 160,
                vx: (Math.random() - 0.5) * 1.6,
                vy: -(Math.random() * 7 + 4.5),
                radius: Math.random() * 6 + 2,
                alpha: Math.random() * 0.75 + 0.25,
                decay: 0.008,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                isDiveBubble: true
            });
        }
    }

    createAmbientParticle(fromBottom = false) {
        return {
            x: Math.random() * this.width,
            y: fromBottom ? this.height + 10 : Math.random() * this.height,
            radius: Math.random() * 3.8 + 1.2,
            speedY: -(Math.random() * 0.65 + 0.2),
            speedX: (Math.random() - 0.5) * 0.45,
            alpha: Math.random() * 0.65 + 0.2,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            isBubble: Math.random() > 0.35,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.03 + 0.01
        };
    }

    onMouseMove(e) {
        if (Math.random() > 0.45) return;
        this.burstParticles.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 1.8,
            vy: (Math.random() - 0.5) * 1.8 - 0.5,
            radius: Math.random() * 2.8 + 1,
            alpha: 0.85,
            decay: 0.025,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        });
    }

    triggerBurst(x = this.width / 2, y = this.height / 2, amount = 55) {
        for (let i = 0; i < amount; i++) {
            const angle = (Math.PI * 2 * i) / amount + (Math.random() - 0.5) * 0.3;
            const speed = Math.random() * 7 + 2.2;
            this.burstParticles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                radius: Math.random() * 4.5 + 2,
                alpha: 1,
                decay: Math.random() * 0.015 + 0.01,
                color: this.colors[Math.floor(Math.random() * this.colors.length)]
            });
        }
    }

    spawnFloatingEmoji(x, y, emoji = '❤️') {
        const el = document.createElement('div');
        el.className = 'floating-reaction-particle';
        el.textContent = emoji;
        el.style.left = `${x - 12 + (Math.random() * 24 - 12)}px`;
        el.style.top = `${y - 12}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    }

    drawGodRays() {
        if (!this.deepSeaActive) return;
        this.ctx.save();
        const rayCount = 4;
        for (let i = 0; i < rayCount; i++) {
            const sway = Math.sin(this.time * 0.008 + i * 1.4) * 55;
            const topX = (this.width / (rayCount + 1)) * (i + 1) + sway * 0.3;
            const bottomX = topX + sway * 1.6;
            const grad = this.ctx.createLinearGradient(topX, 0, bottomX, this.height * 0.85);
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
            grad.addColorStop(0.5, 'rgba(45, 212, 191, 0.04)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.moveTo(topX - 45, 0);
            this.ctx.lineTo(topX + 45, 0);
            this.ctx.lineTo(bottomX + 160, this.height * 0.85);
            this.ctx.lineTo(bottomX - 160, this.height * 0.85);
            this.ctx.closePath();
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawFishSchool() {
        const visibilityBoost = this.deepSeaActive ? 1.45 : 0.48;
        for (let i = 0; i < this.fishSchool.length; i++) {
            const f = this.fishSchool[i];
            const speedScale = this.deepSeaActive ? 1.3 : 0.82;
            f.x += f.speedX * speedScale;
            f.y += f.speedY * speedScale;
            f.phase += f.tailSpeed;

            const offsetY = Math.sin(f.phase * f.waveFreq) * f.waveAmp;
            const pitchAngle = Math.cos(f.phase * f.waveFreq) * 0.14;
            const drawY = f.y + offsetY;

            // Keep vertical drift within ocean bounds
            if (f.y < this.height * 0.06 || f.y > this.height * 0.9) {
                f.speedY = -f.speedY;
            }

            // Wrap around screen edges
            if (f.dir === 1 && f.x > this.width + 65) {
                f.x = -65;
                f.y = Math.random() * (this.height * 0.82) + this.height * 0.08;
            } else if (f.dir === -1 && f.x < -65) {
                f.x = this.width + 65;
                f.y = Math.random() * (this.height * 0.82) + this.height * 0.08;
            }

            const s = f.size;
            const tailSwing = Math.sin(f.phase * 1.4) * (s * 0.36);

            this.ctx.save();
            this.ctx.translate(f.x, drawY);
            this.ctx.scale(f.dir, 1);
            this.ctx.rotate(pitchAngle);
            this.ctx.globalAlpha = Math.min(0.9, f.alpha * visibilityBoost);
            this.ctx.shadowBlur = this.deepSeaActive ? 14 : 6;
            this.ctx.shadowColor = f.color;

            if (f.species === 'angelfish') {
                // Cá Thiên Thần: Vây lưng & vây bụng kéo dài thướt tha
                this.ctx.fillStyle = '#fde047';
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.2, -s * 0.45);
                this.ctx.quadraticCurveTo(-s * 0.6, -s * 1.45, -s * 1.7, -s * 1.15 + tailSwing * 0.3);
                this.ctx.quadraticCurveTo(-s * 0.7, -s * 0.65, -s * 0.35, -s * 0.35);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.1, s * 0.45);
                this.ctx.quadraticCurveTo(-s * 0.5, s * 1.35, -s * 1.45, s * 1.05 + tailSwing * 0.25);
                this.ctx.quadraticCurveTo(-s * 0.6, s * 0.6, -s * 0.3, s * 0.35);
                this.ctx.closePath();
                this.ctx.fill();

                // Đuôi cá
                this.ctx.fillStyle = '#f472b6';
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.75, 0);
                this.ctx.lineTo(-s * 1.45, -s * 0.42 + tailSwing * 0.4);
                this.ctx.lineTo(-s * 1.25, tailSwing * 0.2);
                this.ctx.lineTo(-s * 1.45, s * 0.42 + tailSwing * 0.4);
                this.ctx.closePath();
                this.ctx.fill();

                // Thân cá hình thoi
                this.ctx.fillStyle = f.color;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s * 0.92, s * 0.62, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Sọc trắng sáng
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = Math.max(1.4, s * 0.14);
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.15, -s * 0.56);
                this.ctx.quadraticCurveTo(-s * 0.05, 0, s * 0.15, s * 0.56);
                this.ctx.stroke();
            } else if (f.species === 'clownfish') {
                // Cá Hề cam sọc trắng
                this.ctx.fillStyle = '#fb923c';
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.8, 0);
                this.ctx.quadraticCurveTo(-s * 1.45, -s * 0.5 + tailSwing * 0.4, -s * 1.5, -s * 0.2 + tailSwing * 0.35);
                this.ctx.quadraticCurveTo(-s * 1.45, s * 0.5 + tailSwing * 0.4, -s * 0.8, 0);
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s, s * 0.48, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = Math.max(1.5, s * 0.18);
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.35, -s * 0.42);
                this.ctx.lineTo(s * 0.35, s * 0.42);
                this.ctx.moveTo(-s * 0.2, -s * 0.45);
                this.ctx.lineTo(-s * 0.2, s * 0.45);
                this.ctx.stroke();
            } else if (f.species === 'bluetang') {
                // Cá Blue Tang xanh biển đuôi vàng
                this.ctx.fillStyle = '#fde047';
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.78, 0);
                this.ctx.lineTo(-s * 1.5, -s * 0.46 + tailSwing * 0.4);
                this.ctx.lineTo(-s * 1.5, s * 0.46 + tailSwing * 0.4);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#0ea5e9';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s * 0.96, s * 0.55, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (f.species === 'ribbon_anthias') {
                // Cá Phượng Hoàng Vây Lụa: Thân thon hồng tím, đuôi lụa 2 dải dài thướt tha
                this.ctx.fillStyle = '#fbcfe8';
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.7, -s * 0.1);
                this.ctx.quadraticCurveTo(-s * 1.5, -s * 0.6 + tailSwing * 0.5, -s * 2.2, -s * 0.8 + tailSwing * 0.6);
                this.ctx.quadraticCurveTo(-s * 1.3, -s * 0.2, -s * 0.7, 0);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#f472b6';
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.7, s * 0.1);
                this.ctx.quadraticCurveTo(-s * 1.5, s * 0.6 + tailSwing * 0.5, -s * 2.2, s * 0.8 + tailSwing * 0.6);
                this.ctx.quadraticCurveTo(-s * 1.3, s * 0.2, -s * 0.7, 0);
                this.ctx.closePath();
                this.ctx.fill();

                // Vây lưng cao
                this.ctx.fillStyle = '#fcd34d';
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.25, -s * 0.35);
                this.ctx.lineTo(-s * 0.5, -s * 0.85);
                this.ctx.lineTo(-s * 0.6, -s * 0.25);
                this.ctx.closePath();
                this.ctx.fill();

                // Thân cá thon
                this.ctx.fillStyle = '#f43f5e';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s * 1.05, s * 0.4, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (f.species === 'mandarinfish') {
                // Cá Trạng Nguyên Ngũ Sắc: Vây tròn quạt lộng lẫy và hoa văn đại dương
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(s * 0.1, -s * 0.55, s * 0.45, 0, Math.PI, true);
                this.ctx.fill();

                // Đuôi quạt tròn
                this.ctx.fillStyle = '#2dd4bf';
                this.ctx.beginPath();
                this.ctx.arc(-s * 0.9, tailSwing * 0.2, s * 0.55, -Math.PI / 2.2, Math.PI / 2.2);
                this.ctx.lineTo(-s * 0.7, 0);
                this.ctx.closePath();
                this.ctx.fill();

                // Thân cá
                this.ctx.fillStyle = '#0284c7';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s * 0.88, s * 0.52, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Họa tiết vằn sóng ngọc bích
                this.ctx.strokeStyle = '#38bdf8';
                this.ctx.lineWidth = Math.max(1.3, s * 0.12);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, s * 0.35, 0, Math.PI);
                this.ctx.stroke();
            } else if (f.species === 'flyingfish') {
                // Cá Chuồn Cánh Pha Lê: Thân dài thuôn, đôi cánh vây ngực sải rộng như cánh chuồn
                this.ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.35, -s * 0.2);
                this.ctx.quadraticCurveTo(s * 0.2, -s * 1.5, -s * 0.45, -s * 1.35 + tailSwing * 0.3);
                this.ctx.quadraticCurveTo(0, -s * 0.5, -s * 0.1, -s * 0.2);
                this.ctx.closePath();
                this.ctx.fill();

                // Cánh dưới đối xứng nhẹ
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.35, s * 0.2);
                this.ctx.quadraticCurveTo(s * 0.2, s * 1.3, -s * 0.4, s * 1.15 + tailSwing * 0.3);
                this.ctx.quadraticCurveTo(0, s * 0.4, -s * 0.1, s * 0.2);
                this.ctx.closePath();
                this.ctx.fill();

                // Đuôi chẻ dài
                this.ctx.fillStyle = '#7dd3fc';
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.9, 0);
                this.ctx.lineTo(-s * 1.6, -s * 0.4 + tailSwing * 0.35);
                this.ctx.lineTo(-s * 1.35, tailSwing * 0.15);
                this.ctx.lineTo(-s * 1.6, s * 0.4 + tailSwing * 0.35);
                this.ctx.closePath();
                this.ctx.fill();

                // Thân thuôn dài
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s * 1.18, s * 0.32, 0, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Cá Bướm & Cá Ánh Sao Đuôi Chẻ
                this.ctx.fillStyle = f.color;
                // Vây lưng
                this.ctx.beginPath();
                this.ctx.moveTo(s * 0.3, -s * 0.35);
                this.ctx.lineTo(-s * 0.45, -s * 0.75);
                this.ctx.lineTo(-s * 0.55, -s * 0.25);
                this.ctx.closePath();
                this.ctx.fill();

                // Đuôi chẻ đôi uyển chuyển
                this.ctx.beginPath();
                this.ctx.moveTo(-s * 0.75, 0);
                this.ctx.lineTo(-s * 1.6, -s * 0.52 + tailSwing * 0.42);
                this.ctx.lineTo(-s * 1.25, tailSwing * 0.18);
                this.ctx.lineTo(-s * 1.6, s * 0.52 + tailSwing * 0.42);
                this.ctx.closePath();
                this.ctx.fill();

                // Thân cá
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, s, s * 0.44, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Mắt cá phát sáng
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(s * 0.55, -s * 0.1, Math.max(1.4, s * 0.13), 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    animate() {
        if (!this.ctx) return;
        this.time++;
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawGodRays();
        this.drawFishSchool();

        // Draw ambient bioluminescent bubbles & stars
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.wobble += p.wobbleSpeed;
            p.x += p.speedX + Math.sin(p.wobble) * 0.25;
            p.y += p.speedY;

            if (p.y < -15) {
                this.particles[i] = this.createAmbientParticle(true);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

            if (p.isBubble) {
                this.ctx.strokeStyle = p.color;
                this.ctx.lineWidth = 1.2;
                this.ctx.stroke();
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.alpha * 0.25;
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = p.color;
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        // Draw burst, dive bubbles & cursor trail particles
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const b = this.burstParticles[i];
            b.x += b.vx;
            b.y += b.vy;
            if (!b.isDiveBubble) {
                b.vy += 0.08; // gentle gravity for fireworks
            }
            b.alpha -= b.decay;

            if (b.alpha <= 0 || b.y < -40) {
                this.burstParticles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = b.alpha;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            if (b.isDiveBubble) {
                this.ctx.strokeStyle = b.color;
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = b.color;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = b.color;
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.oceanFX = new OceanCanvasFX('ocean-canvas');
});
