/**
 * ==========================================================================
 * 20/10 OCEAN OF WISHES - AUDIO ENGINE & 5-TRACK PLAYLIST (js/audio.js)
 * High-fidelity HTML5 Ocean Playlist Player & Web Audio Synthesizer SFX
 * ==========================================================================
 */

class OceanAudioEngine {
    constructor() {
        // Web Audio Context for Interactive Sound Effects
        this.ctx = null;
        this.enabled = true;

        // 5 Selected Tracks (Only Clean Song Titles)
        this.playlist = [
            {
                id: 0,
                title: 'Có Chút Ngọt Ngào',
                src: './audio/co-chut-ngot-ngao.mp3'
            },
            {
                id: 1,
                title: 'Off My Face',
                src: './audio/off-my-face.mp3'
            },
            {
                id: 2,
                title: 'Chờ Chút...',
                src: './audio/cho-chut.mp3'
            },
            {
                id: 3,
                title: '好きだから (Suki Dakara)',
                src: './audio/suki-dakara.mp3'
            },
            {
                id: 4,
                title: 'Đoạn Kết Cuối',
                src: './audio/doan-ket-cuoi.mp3'
            }
        ];

        this.currentIndex = 0;
        this.audio = new Audio();
        this.audio.preload = 'auto';
        this.audio.volume = 0.65;
        this.isPlaying = false;
        this.autoplayPending = true;
        this.hasInteracted = false;
        this.listeners = [];

        this.setupAudioListeners();
        this.setupAutoplaySystem();
    }

    /* ----------------------------------------------------------------------
       HTML5 AUDIO PLAYLIST ENGINE
       ---------------------------------------------------------------------- */
    setupAudioListeners() {
        // Auto-advance to next song when current track finishes
        this.audio.addEventListener('ended', () => {
            console.log('[OceanAudio] Track completed. Auto-advancing to next song...');
            this.nextTrack(true);
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.notify('play', {
                index: this.currentIndex,
                track: this.getCurrentTrack()
            });
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.notify('pause', {
                index: this.currentIndex,
                track: this.getCurrentTrack()
            });
        });

        this.audio.addEventListener('timeupdate', () => {
            this.notify('timeupdate', {
                currentTime: this.audio.currentTime,
                duration: this.audio.duration || 0,
                progress: this.audio.duration ? this.audio.currentTime / this.audio.duration : 0
            });
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.notify('loadedmetadata', {
                duration: this.audio.duration || 0,
                track: this.getCurrentTrack()
            });
        });

        this.audio.addEventListener('error', (e) => {
            console.warn('[OceanAudio] Audio playback error:', e);
            this.notify('error', e);
        });

        // Preload first track source
        if (this.playlist.length > 0) {
            this.audio.src = this.playlist[0].src;
        }
    }

    setupAutoplaySystem() {
        // Attempt autoplay on page load
        const startAutoplay = () => {
            if (this.isPlaying) return;
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        this.autoplayPending = false;
                        this.hasInteracted = true;
                        this.isPlaying = true;
                        console.log('[OceanAudio] Autoplay successfully initiated.');
                    })
                    .catch(() => {
                        // Browser autoplay policy prevented unmuted audio
                        this.autoplayPending = true;
                        console.log('[OceanAudio] Autoplay waiting for initial user interaction.');
                    });
            }
        };

        // Try immediately when script runs or DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startAutoplay, { once: true });
        } else {
            setTimeout(startAutoplay, 150);
        }

        // Seamless fallback: trigger play on first user tap/click/keypress anywhere on page
        const unlockUserGesture = (evt) => {
            if (this.hasInteracted) return;
            this.hasInteracted = true;
            this.initContext();

            // If the user tapped/clicked directly on the music widget,
            // let the button's own click handler handle play/toggle explicitly.
            // Do NOT auto-trigger play here to prevent race conditions or double-toggles.
            const isMusicWidgetClick = evt && evt.target && evt.target.closest && evt.target.closest('#ocean-music-widget');

            if (!isMusicWidgetClick && (!this.isPlaying || this.audio.paused)) {
                this.play()
                    .then(() => {
                        this.autoplayPending = false;
                    })
                    .catch((err) => {
                        console.warn('[OceanAudio] Gesture unlock play attempt:', err);
                    });
            } else if (isMusicWidgetClick) {
                this.autoplayPending = false;
            }

            // Remove global unlock listeners once triggered
            ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evtName) => {
                window.removeEventListener(evtName, unlockUserGesture, true);
            });
        };

        ['pointerdown', 'click', 'keydown', 'touchstart'].forEach((evt) => {
            window.addEventListener(evt, unlockUserGesture, { capture: true, once: true });
        });
    }

    on(event, callback) {
        if (typeof callback === 'function') {
            this.listeners.push({ event, callback });
        }
    }

    notify(event, data) {
        this.listeners.forEach((l) => {
            if (l.event === event || l.event === '*') {
                try {
                    l.callback(data);
                } catch (err) {
                    console.error('[OceanAudio] Error in listener callback:', err);
                }
            }
        });
    }

    getCurrentTrack() {
        return this.playlist[this.currentIndex] || null;
    }

    loadTrack(index, autoPlay = false) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentIndex = index;
        const track = this.playlist[this.currentIndex];
        const isCurrentSrc = this.audio.src && this.audio.src.includes(encodeURI(track.src).replace(/^\.\//, ''));

        if (!isCurrentSrc) {
            this.audio.src = track.src;
            this.audio.currentTime = 0;
        }

        this.notify('trackchange', {
            index: this.currentIndex,
            track: track
        });

        if (autoPlay) {
            this.play();
        }
    }

    play() {
        this.initContext();
        if (this.audio.src === '' && this.playlist.length > 0) {
            this.loadTrack(this.currentIndex);
        }
        const promise = this.audio.play();
        if (promise !== undefined) {
            return promise
                .then(() => {
                    this.isPlaying = true;
                    this.autoplayPending = false;
                    return true;
                })
                .catch((err) => {
                    console.warn('[OceanAudio] play() blocked or interrupted:', err);
                    this.isPlaying = false;
                    return false;
                });
        }
        return Promise.resolve(false);
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    togglePlay() {
        if (!this.audio.paused && this.isPlaying) {
            this.pause();
            return false;
        } else {
            this.play();
            return true;
        }
    }

    playTrack(index) {
        this.loadTrack(index, true);
    }

    nextTrack(isAuto = false) {
        const nextIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadTrack(nextIndex, true);
        this.notify('next', {
            index: nextIndex,
            track: this.getCurrentTrack(),
            isAuto
        });
    }

    prevTrack() {
        // If track has been playing for more than 3 seconds, replay it from beginning
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            if (!this.isPlaying) this.play();
            return;
        }
        const prevIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(prevIndex, true);
        this.notify('prev', {
            index: prevIndex,
            track: this.getCurrentTrack()
        });
    }

    seek(progressRatio) {
        if (this.audio.duration && !isNaN(this.audio.duration)) {
            const targetTime = Math.max(0, Math.min(this.audio.duration, progressRatio * this.audio.duration));
            this.audio.currentTime = targetTime;
        }
    }

    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    // Compatibility getters & methods for existing app.js calls
    get bgmPlaying() {
        return this.isPlaying;
    }

    set bgmPlaying(val) {
        if (val) this.play();
        else this.pause();
    }

    startMusicBox() {
        this.play();
    }

    stopMusicBox() {
        this.pause();
    }

    toggleMusicBox() {
        return this.togglePlay();
    }

    /* ----------------------------------------------------------------------
       WEB AUDIO SYNTHESIZER SFX (CLAMSHELL, WARP, BUTTONS, CARDS)
       ---------------------------------------------------------------------- */
    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration = 0.35, type = 'sine', volume = 0.12, delay = 0) {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    playClick() {
        this.playTone(660, 0.12, 'sine', 0.09);
        this.playTone(880, 0.16, 'triangle', 0.06, 0.03);
    }

    playSealTap(step = 1) {
        const base = 440 + step * 140;
        this.playTone(base, 0.28, 'sine', 0.14);
        this.playTone(base * 1.5, 0.35, 'triangle', 0.1, 0.05);
    }

    playGiftOpenFanfare() {
        const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        chord.forEach((freq, idx) => {
            this.playTone(freq, 0.75, 'sine', 0.13, idx * 0.08);
            this.playTone(freq * 0.5, 0.85, 'triangle', 0.07, idx * 0.08);
        });
    }

    playRuneBloom(step = 1) {
        if (!this.enabled) return;
        this.initContext();
        if (step === 1) {
            [440, 554.37, 659.25, 880, 1108.73].forEach((f, idx) => {
                this.playTone(f, 0.45, 'sine', 0.1, idx * 0.07);
            });
        } else if (step === 2) {
            [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093].forEach((f, idx) => {
                this.playTone(f, 0.65, 'sine', 0.09, idx * 0.08);
                this.playTone(f * 0.5, 0.55, 'triangle', 0.05, idx * 0.08);
            });
        }
    }

    playPortalVoyage() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;

        // 1. Deep Oceanic Sub-Bass Rumble
        const now = this.ctx.currentTime;
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(65, now);
        subOsc.frequency.exponentialRampToValueAtTime(130, now + 1.8);
        subOsc.frequency.exponentialRampToValueAtTime(45, now + 3.8);

        subGain.gain.setValueAtTime(0.001, now);
        subGain.gain.exponentialRampToValueAtTime(0.22, now + 0.6);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 4.2);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 4.4);

        // 2. Crystal Harp Cascade Arpeggio
        const cascade = [
            523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98,
            1760.00, 2093.00, 1567.98, 1318.51, 1046.50, 783.99
        ];
        cascade.forEach((freq, i) => {
            this.playTone(freq, 0.8, 'sine', 0.08, i * 0.14);
        });

        // 3. Arrival Chime
        setTimeout(() => {
            [523.25, 783.99, 1046.5, 1567.98].forEach((f) => {
                this.playTone(f, 1.8, 'sine', 0.12);
            });
        }, 3400);
    }

    playWarpCharge() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(85, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.85);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.16, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
    }

    playHyperWarpJump() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Sub-bass sonic boom punch
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(26, now + 0.65);

        subGain.gain.setValueAtTime(0.38, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.75);

        // 2. High-speed laser dispersal zip
        const zipOsc = this.ctx.createOscillator();
        const zipGain = this.ctx.createGain();
        zipOsc.type = 'triangle';
        zipOsc.frequency.setValueAtTime(2200, now);
        zipOsc.frequency.exponentialRampToValueAtTime(110, now + 0.42);

        zipGain.gain.setValueAtTime(0.22, now);
        zipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        zipOsc.connect(zipGain);
        zipGain.connect(this.ctx.destination);
        zipOsc.start(now);
        zipOsc.stop(now + 0.52);
    }

    playLaserHeartDraw() {
        if (!this.enabled) return;
        this.initContext();
        [880, 1174.66, 1396.91, 1760, 2093].forEach((f, idx) => {
            this.playTone(f, 0.45, 'sine', 0.08, idx * 0.09);
        });
    }

    playCardFlip() {
        this.playTone(587.33, 0.18, 'sine', 0.1);
        this.playTone(880.00, 0.35, 'triangle', 0.1, 0.06);
        this.playTone(1174.66, 0.45, 'sine', 0.08, 0.12);
    }

    playReactionPop() {
        const randomFreq = [659.25, 783.99, 880, 987.77, 1046.5][Math.floor(Math.random() * 5)];
        this.playTone(randomFreq, 0.18, 'sine', 0.12);
        this.playTone(randomFreq * 1.25, 0.22, 'triangle', 0.08, 0.04);
    }
}

window.oceanAudio = new OceanAudioEngine();
