/**
 * ==========================================================================
 * OCEAN SURPRISE 20/10 - MAIN APPLICATION CONTROLLER (js/app.js)
 * - Luồng đi 1 chiều: Nếu ấn quay về mục cũ sẽ bắt buộc nhập lại tên từ đầu
 * - Không có Admin: Chỉ xoá được comment của chính mình khi chưa reload trang
 * - Giới hạn comment tối đa 120 ký tự
 * - Có thanh bấm chọn tên người dùng để lọc xem comment của từng người
 * ==========================================================================
 */

const MAX_NAME_LENGTH = 30;
const MAX_COMMENT_LENGTH = 120;

const FUNNY_NICKNAME_POOL = [
    'Nàng Tiên Cá Hệ Tư Bản',
    'Cá Heo Hay Quạo 🐬',
    'Sứa Biển Overthinking',
    'Công Chúa Thủy Tề 👑',
    'Bạch Tuộc Đa Nhiệm',
    'Sao Biển Mê Trà Sữa 🧋',
    'Nữ Hoàng Lướt Deadline',
    'Ngọc Trai Không Tì Vết',
    'Cua Hoàng Đế Thích Ngủ',
    'Cá Voi Xanh Mộng Mơ 🐋',
    'Rái Cá Biển Hay Cười',
    'Nàng Thơ Vịnh Xanh 🌸',
    'Thuyền Trưởng Săn Sale',
    'San Hô Hồng Đáng Yêu',
    'Tiên Nữ Đại Dương ✨'
];

const NICKNAME_PREFIXES = [
    'Cá Heo', 'Sứa Nhỏ', 'Sao Biển', 'Nàng Tiên Cá', 'Rái Cá',
    'Ngọc Trai', 'Bạch Tuộc', 'Cá Voi', 'Cua Nhỏ', 'San Hô'
];

const NICKNAME_TRAITS = [
    'Mê Trà Sữa', 'Hay Cười', 'Hệ Chữa Lành', 'Thích Đi Chơi',
    'Siêu Cấp Đáng Yêu', 'Không Sợ Deadline', 'Hệ Ngoan Xinh Yêu',
    'Mộng Mơ', 'Thích Ngủ Nướng', 'Tỏa Sáng ✨'
];

const REACTION_META = [
    { key: 'heart', emoji: '❤️', label: 'Yêu thích' },
    { key: 'wave', emoji: '🌊', label: 'Sâu sắc' },
    { key: 'flower', emoji: '🌸', label: 'Tuyệt vời' },
    { key: 'sparkle', emoji: '✨', label: 'Đỉnh chóp' },
    { key: 'laugh', emoji: '😂', label: 'Hài hước' }
];

class OceanApp {
    constructor() {
        this.currentStage = 1;
        this.userName = '';
        this.giftTapCount = 0;
        this.giftOpened = false;
        this.lastNickname = '';

        // Form selections
        this.selectedAvatar = '🌸';
        this.selectedTheme = 'theme-ocean';

        // Wall filters
        this.wallFilter = 'newest';
        this.wallSearch = '';
        this.selectedAuthorFilter = '';

        this.init();
    }

    init() {
        this.bindHUD();
        this.bindMusicPlayer();
        this.bindStage1();
        this.bindStage2();
        this.bindStage3();
        this.bindStage4();
        this.bindStage5();
        this.bindModals();
    }

    /* ----------------------------------------------------------------------
       TOP HUD & SEQUENTIAL FLOW
       ---------------------------------------------------------------------- */
    bindHUD() {
        const soundBtn = document.getElementById('btn-toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const playing = window.oceanAudio.togglePlay();
                soundBtn.classList.toggle('active-sound', playing);
                soundBtn.innerHTML = playing
                    ? '<i class="fa-solid fa-music"></i>'
                    : '<i class="fa-solid fa-volume-xmark"></i>';
                this.showToast(playing ? `🎵 Đang phát: ${window.oceanAudio.getCurrentTrack()?.title}` : '🔇 Đã tạm tắt nhạc nền');
            });
        }

        const themeBtn = document.getElementById('btn-toggle-theme');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                document.body.classList.toggle('theme-crystal');
                window.oceanAudio?.playClick();
                const isCrystal = document.body.classList.contains('theme-crystal');
                this.showToast(isCrystal ? '🌊 Đã đổi sang tông Xanh Biển Sáng' : '🌌 Đã đổi sang tông Xanh Biển Đêm');
            });
        }
    }

    /* ----------------------------------------------------------------------
       OCEAN MUSIC PLAYER CONTROLLER (5-TRACK PLAYLIST & HOVER/CLICK POPOVER)
       ---------------------------------------------------------------------- */
    bindMusicPlayer() {
        const audio = window.oceanAudio;
        if (!audio) return;

        const widget = document.getElementById('ocean-music-widget');
        const pillBtn = document.getElementById('music-pill-btn');
        const quickPlayBtn = document.getElementById('music-quick-playpause');
        const quickIcon = document.getElementById('music-quick-icon');
        const popover = document.getElementById('music-playlist-popover');
        const currentTitleEl = document.getElementById('music-current-title');
        const trackBadgeEl = document.getElementById('playlist-track-badge');
        const prevBtn = document.getElementById('btn-music-prev');
        const playBtn = document.getElementById('btn-music-play');
        const playIcon = document.getElementById('popover-play-icon');
        const nextBtn = document.getElementById('btn-music-next');
        const progressBar = document.getElementById('music-progress-bar');
        const progressFill = document.getElementById('music-progress-fill');
        const currTimeEl = document.getElementById('music-curr-time');
        const totalTimeEl = document.getElementById('music-total-time');
        const tracksListEl = document.getElementById('playlist-tracks-list');

        const formatTime = (secs) => {
            if (isNaN(secs) || secs < 0) return '0:00';
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        const renderPlaylist = () => {
            if (!tracksListEl) return;
            const current = audio.currentIndex;
            const isPlaying = audio.isPlaying;

            tracksListEl.innerHTML = audio.playlist
                .map((track, idx) => {
                    const isActive = idx === current;
                    const activeClass = isActive ? 'active' : '';
                    const playingClass = isActive && isPlaying ? 'playing' : '';
                    const num = (idx + 1).toString().padStart(2, '0');

                    return `
                        <div class="playlist-track-item ${activeClass} ${playingClass}" data-index="${idx}" role="button" tabindex="0">
                            <div class="track-left">
                                <span class="track-number">${num}</span>
                                <span class="track-equalizer-mini" aria-hidden="true"><span></span><span></span><span></span></span>
                                <div class="track-info">
                                    <div class="track-title">${track.title}</div>
                                </div>
                            </div>
                            <div class="track-right">
                                ${isActive 
                                    ? `<span class="track-status-pill">${isPlaying ? 'Đang phát' : 'Tạm dừng'}</span>`
                                    : `<i class="fa-solid fa-play track-icon-play" title="Phát bài này"></i>`
                                }
                            </div>
                        </div>
                    `;
                })
                .join('');

            // Bind click to each track item
            tracksListEl.querySelectorAll('.playlist-track-item').forEach((item) => {
                item.addEventListener('click', () => {
                    const idx = parseInt(item.getAttribute('data-index'), 10);
                    if (idx === audio.currentIndex) {
                        const playing = audio.togglePlay();
                        this.showToast(playing ? `🎵 Đang phát: ${audio.playlist[idx].title}` : '⏸️ Đã tạm dừng nhạc');
                    } else {
                        audio.playTrack(idx);
                        this.showToast(`🎵 Đang phát: ${audio.playlist[idx].title}`);
                    }
                });
            });
        };

        const updatePlayerUI = () => {
            const currentTrack = audio.getCurrentTrack();
            const isPlaying = audio.isPlaying;

            if (currentTitleEl && currentTrack) {
                currentTitleEl.textContent = currentTrack.title;
            }
            if (trackBadgeEl) {
                trackBadgeEl.textContent = `${audio.currentIndex + 1} / ${audio.playlist.length}`;
            }
            if (pillBtn) {
                pillBtn.classList.toggle('playing', isPlaying);
            }
            if (quickIcon) {
                quickIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
            }
            if (playIcon) {
                playIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
            }
            renderPlaylist();
        };

        // Render initial playlist & UI
        renderPlaylist();
        updatePlayerUI();

        // Audio Engine Event Subscriptions
        audio.on('play', updatePlayerUI);
        audio.on('pause', updatePlayerUI);
        audio.on('next', () => {
            updatePlayerUI();
        });
        audio.on('prev', updatePlayerUI);

        audio.on('timeupdate', (data) => {
            if (progressFill && data.progress !== undefined) {
                progressFill.style.width = `${data.progress * 100}%`;
            }
            if (currTimeEl && data.currentTime !== undefined) {
                currTimeEl.textContent = formatTime(data.currentTime);
            }
            if (totalTimeEl && data.duration) {
                totalTimeEl.textContent = formatTime(data.duration);
            }
        });

        audio.on('loadedmetadata', (data) => {
            if (totalTimeEl && data.duration) {
                totalTimeEl.textContent = formatTime(data.duration);
            }
        });

        // Hover & Click Behavior for Pill & Popover
        let closeTimer = null;
        let isPinnedOpen = false;

        if (widget) {
            // Hover in: clear pending close timer
            widget.addEventListener('mouseenter', () => {
                if (closeTimer) {
                    clearTimeout(closeTimer);
                    closeTimer = null;
                }
            });

            // Hover out: if not pinned open by click, close after a gentle 350ms buffer
            widget.addEventListener('mouseleave', () => {
                if (!isPinnedOpen) {
                    closeTimer = setTimeout(() => {
                        widget.classList.remove('is-open');
                    }, 350);
                }
            });
        }

        // Pill Button Click: Toggle Pinned Dropdown Open / Closed
        if (pillBtn) {
            pillBtn.addEventListener('click', (e) => {
                // If clicked directly on the quick play button inside pill, handled separately
                if (e.target.closest('#music-quick-playpause')) return;

                const willOpen = !widget?.classList.contains('is-open');
                isPinnedOpen = willOpen;
                widget?.classList.toggle('is-open', willOpen);
                audio.playClick?.();

                // If music has not started yet, begin playing first track
                if (audio.audio.paused) {
                    audio.play();
                }
            });
        }

        // Quick Play/Pause on Pill
        if (quickPlayBtn) {
            quickPlayBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playing = audio.togglePlay();
                this.showToast(playing ? `🎵 Đang phát: ${audio.getCurrentTrack()?.title}` : '⏸️ Đã tạm dừng nhạc');
            });
        }

        // Popover Control Buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                audio.prevTrack();
                audio.playClick?.();
                this.showToast(`⏮️ Bài trước: ${audio.getCurrentTrack()?.title}`);
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playing = audio.togglePlay();
                this.showToast(playing ? `🎵 Đang phát: ${audio.getCurrentTrack()?.title}` : '⏸️ Đã tạm dừng nhạc');
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                audio.nextTrack(false);
                audio.playClick?.();
                this.showToast(`⏭️ Bài kế tiếp: ${audio.getCurrentTrack()?.title}`);
            });
        }

        // Progress Bar Click to Seek
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                audio.seek(ratio);
            });
        }

        // Click Outside or Press Escape to Close Dropdown
        document.addEventListener('click', (e) => {
            if (widget && !widget.contains(e.target)) {
                widget.classList.remove('is-open');
                isPinnedOpen = false;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && widget?.classList.contains('is-open')) {
                widget.classList.remove('is-open');
                isPinnedOpen = false;
            }
        });
    }

    resetToStart() {
        this.currentStage = 1;
        this.userName = '';
        this.giftTapCount = 0;
        this.giftOpened = false;
        document.title = 'Một Điều Nhỏ Dành Cho Cậu 🌊';

        // Reset ô nhập tên + bộ đếm 0 / 30
        const nameInput = document.getElementById('input-user-name');
        if (nameInput) nameInput.value = '';
        this.updateNameCharCounter();

        // Reset trạng thái Vỏ Sò Đại Dương ở bước 2
        const boxEl = document.getElementById('ocean-gift-box');
        if (boxEl) {
            boxEl.classList.remove('opened', 'shaking', 'tap-1', 'tap-2');
        }
        const pedestal = document.getElementById('gift-pedestal-trigger');
        pedestal?.classList.remove('shell-opening-flare');

        const hintEl = document.getElementById('gift-hint-status');
        if (hintEl) {
            hintEl.innerHTML = 'Chạm nhẹ vào <strong>Chiếc Vỏ Sò</strong> để đánh thức món quà từ đại dương nhé...';
        }

        window.oceanGames?.resetRandomWish();
        window.oceanFX?.setDeepSeaMode(false);

        document.querySelectorAll('.stage-section').forEach((sec) => {
            const s = parseInt(sec.getAttribute('data-stage'), 10);
            sec.classList.toggle('active', s === 1);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    goToStage(stageNum) {
        this.currentStage = stageNum;

        document.querySelectorAll('.stage-section').forEach((sec) => {
            const s = parseInt(sec.getAttribute('data-stage'), 10);
            sec.classList.toggle('active', s === stageNum);
        });

        window.oceanFX?.setDeepSeaMode(stageNum === 3);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (stageNum === 2) {
            this.prepareStage2Greeting();
        } else if (stageNum === 3) {
            document.title = `Chúc Mừng 20/10 — Dành Tặng ${this.userName}`;
            window.oceanGames?.initHubForUser(this.userName);
            // Kích hoạt nét vẽ trái tim laser quang học trên màn hình hologram
            const heartWrap = document.getElementById('holo-laser-heart-wrap');
            if (heartWrap) {
                heartWrap.classList.remove('draw-heart-active');
                void heartWrap.offsetWidth;
                heartWrap.classList.add('draw-heart-active');
                window.oceanAudio?.playLaserHeartDraw();
            }
        } else if (stageNum === 4) {
            this.prepareStage4Form();
        } else if (stageNum === 5) {
            window.oceanStorage?.fetchFromDatabase();
            this.renderWall();
        }
    }

    /* ----------------------------------------------------------------------
       STAGE 1: NAME ENTRY, LIVE 0/30 COUNTER & DICE NICKNAME MIXER
       ---------------------------------------------------------------------- */
    updateNameCharCounter() {
        const input = document.getElementById('input-user-name');
        const counter = document.getElementById('name-char-counter');
        if (!input || !counter) return;
        const len = input.value.length;
        counter.textContent = `${len} / ${MAX_NAME_LENGTH}`;
        counter.style.color = len >= MAX_NAME_LENGTH ? '#fda4af' : 'rgba(186, 230, 253, 0.75)';
    }

    rollRandomNickname() {
        let candidate = '';
        // 50% lấy biệt danh có sẵn cực mặn, 50% trộn ngẫu nhiên từ linh tinh
        for (let attempt = 0; attempt < 8; attempt++) {
            if (Math.random() < 0.55) {
                candidate = FUNNY_NICKNAME_POOL[Math.floor(Math.random() * FUNNY_NICKNAME_POOL.length)];
            } else {
                const p = NICKNAME_PREFIXES[Math.floor(Math.random() * NICKNAME_PREFIXES.length)];
                const t = NICKNAME_TRAITS[Math.floor(Math.random() * NICKNAME_TRAITS.length)];
                candidate = `${p} ${t}`;
            }
            if (candidate.length <= MAX_NAME_LENGTH && candidate !== this.lastNickname) {
                break;
            }
        }
        candidate = candidate.slice(0, MAX_NAME_LENGTH);
        this.lastNickname = candidate;
        return candidate;
    }

    bindStage1() {
        const form = document.getElementById('form-enter-name');
        const input = document.getElementById('input-user-name');
        const diceBtn = document.getElementById('btn-dice-nickname');

        if (input) {
            input.addEventListener('input', () => {
                if (input.value.length > MAX_NAME_LENGTH) {
                    input.value = input.value.slice(0, MAX_NAME_LENGTH);
                }
                this.updateNameCharCounter();
            });
        }

        if (diceBtn && input) {
            diceBtn.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                diceBtn.classList.remove('rolling');
                void diceBtn.offsetWidth;
                diceBtn.classList.add('rolling');

                const mixedName = this.rollRandomNickname();
                input.value = mixedName;
                this.updateNameCharCounter();
                input.focus();

                const rect = diceBtn.getBoundingClientRect();
                window.oceanFX?.triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const val = input ? input.value.trim().slice(0, MAX_NAME_LENGTH) : '';
                if (!val) {
                    this.showToast('🌸 Cậu ơi, nhập tên hoặc bấm xúc xắc chọn biệt danh trước nhé!');
                    input?.focus();
                    return;
                }

                this.userName = val;
                window.oceanAudio?.playClick();
                if (window.oceanAudio && !window.oceanAudio.bgmPlaying) {
                    window.oceanAudio.startMusicBox();
                    const soundBtn = document.getElementById('btn-toggle-sound');
                    if (soundBtn) {
                        soundBtn.classList.add('active-sound');
                        soundBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
                    }
                }

                window.oceanFX?.triggerBurst(window.innerWidth / 2, window.innerHeight / 2, 40);
                this.goToStage(2);
            });
        }
    }

    /* ----------------------------------------------------------------------
       STAGE 2: PERSONALIZED WELCOME & CLAMSHELL OPENING (3 TAPS, NO BAR)
       ---------------------------------------------------------------------- */
    prepareStage2Greeting() {
        document.querySelectorAll('.dynamic-user-name').forEach((el) => {
            el.textContent = this.userName;
        });

        const storyEl = document.getElementById('stage2-story-text');
        const fullStory =
            `Cảm ơn ${this.userName} vì đã ghé qua đây hôm nay nha! ` +
            `Giữa làn nước xanh thẳm có một chiếc vỏ sò ngọc trai đang cất giữ món quà nhỏ dành riêng cho cậu đấy. ` +
            `Cậu thử chạm vào chiếc vỏ sò bên dưới để mở ra xem điều gì đang đợi cậu bên trong nhé!`;

        if (storyEl) {
            storyEl.textContent = '';
            let i = 0;
            if (this.stage2Timer) clearInterval(this.stage2Timer);
            this.stage2Timer = setInterval(() => {
                if (i < fullStory.length) {
                    storyEl.textContent += fullStory[i];
                    i++;
                } else {
                    clearInterval(this.stage2Timer);
                }
            }, 18);
        }
    }

    bindStage2() {
        const pedestal = document.getElementById('gift-pedestal-trigger');
        const boxEl = document.getElementById('ocean-gift-box');
        const hintEl = document.getElementById('gift-hint-status');
        const skipOpenBtn = document.getElementById('btn-instant-open-gift');

        const handleTapGift = (instant = false) => {
            if (this.giftOpened) {
                this.goToStage(3);
                return;
            }

            this.giftTapCount = instant ? 3 : this.giftTapCount + 1;
            const rect = pedestal?.getBoundingClientRect();
            const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
            const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

            if (this.giftTapCount === 1) {
                window.oceanAudio?.playSealTap(1);
                window.oceanFX?.triggerBurst(cx, cy, 34);
                if (boxEl) {
                    boxEl.classList.remove('shaking');
                    void boxEl.offsetWidth;
                    boxEl.classList.add('shaking', 'tap-1');
                }
                if (hintEl) {
                    hintEl.innerHTML = '✨ <strong>Chiếc vỏ sò vừa khẽ rung rinh...</strong> Cậu chạm tiếp để đánh thức món quà nhé!';
                }
            } else if (this.giftTapCount === 2) {
                window.oceanAudio?.playSealTap(2);
                window.oceanFX?.triggerBurst(cx, cy, 60);
                if (boxEl) {
                    boxEl.classList.remove('shaking');
                    void boxEl.offsetWidth;
                    boxEl.classList.add('shaking', 'tap-2');
                }
                if (hintEl) {
                    hintEl.innerHTML = '🌸 <strong>Ánh sáng ngọc trai đang bừng sáng rực rỡ!</strong> Chạm lần nữa để mở hẳn ra nào!';
                }
            } else {
                this.giftOpened = true;
                window.oceanAudio?.playGiftOpenFanfare();
                window.oceanFX?.triggerBurst(cx, cy, 110);
                window.oceanFX?.triggerDiveBubbles();

                if (boxEl) {
                    boxEl.classList.remove('shaking', 'tap-1', 'tap-2');
                    boxEl.classList.add('opened');
                }
                pedestal?.classList.add('shell-opening-flare');

                if (hintEl) {
                    hintEl.innerHTML = `🌊 Vỏ sò đã mở! Con tàu vũ trụ đang khởi hành đưa <strong>${this.escapeHTML(this.userName)}</strong> đến vùng đất mới...`;
                }

                // Chờ hiệu ứng vỏ sò hé mở rồi khởi động chuyến du hành ngân hà
                setTimeout(() => {
                    this.startCinematicVoyage();
                }, 520);
            }
        };

        if (pedestal) {
            pedestal.addEventListener('click', () => handleTapGift(false));
            pedestal.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTapGift(false);
                }
            });
        }
        if (skipOpenBtn) {
            skipOpenBtn.addEventListener('click', () => handleTapGift(true));
        }
    }

    /* ----------------------------------------------------------------------
       CINEMATIC OCEAN VOYAGE: TÀU VŨ TRỤ DU HÀNH NGÂN HÀ ĐẾN THẾ GIỚI 20/10
       ---------------------------------------------------------------------- */
    startCinematicVoyage() {
        const cinemaContainer = document.getElementById('deep-sea-voyage-cinema');
        const warpCanvas = document.getElementById('cinema-warp-canvas');
        const captionEl = document.getElementById('cinema-caption-text');
        const depthTicker = document.getElementById('cinema-depth-ticker');
        const flashEl = document.getElementById('cinema-flash-burst');
        const skipBtn = document.getElementById('btn-skip-cinema');
        const shipRig = document.getElementById('cinema-spaceship-rig');
        const warpRing = document.getElementById('cinema-warp-ring');
        const teleportBeam = document.getElementById('cinema-teleport-beam');

        if (!cinemaContainer || !warpCanvas) {
            this.goToStage(3);
            return;
        }

        // Kích hoạt dải phim và âm thanh
        cinemaContainer.classList.add('cinema-active');
        if (shipRig) {
            shipRig.classList.remove('ship-active-voyage', 'ship-skip-teleport');
            void shipRig.offsetWidth;
            shipRig.classList.add('ship-active-voyage');
        }
        if (warpRing) warpRing.classList.remove('warp-pulse-active');
        if (teleportBeam) teleportBeam.classList.remove('beam-active');

        window.oceanAudio?.playPortalVoyage();

        const ctx = warpCanvas.getContext('2d');
        let width = (warpCanvas.width = window.innerWidth);
        let height = (warpCanvas.height = window.innerHeight);

        const onResize = () => {
            if (!warpCanvas) return;
            width = warpCanvas.width = window.innerWidth;
            height = warpCanvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);

        // Khởi tạo hàng trăm hạt sao và laser dải ngân hà 3D (Dense Galaxy Warp Tunnel)
        const numParticles = Math.min(420, Math.floor((width * height) / 2800));
        const particles = [];
        const colors = [
            '#ffffff', // Sao trắng sáng
            '#ffffff', 
            '#38bdf8', // Laser photon xanh cyan
            '#7dd3fc', 
            '#67e8f9', 
            '#f472b6', // Vệt bụi hồng ngân hà
            '#c084fc', // Ánh sáng tím ion
            '#fbbf24'  // Điểm sáng vàng kim
        ];

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: (Math.random() - 0.5) * width * 3.2,
                y: (Math.random() - 0.5) * height * 3.2,
                z: Math.random() * 1200 + 1,
                speed: Math.random() * 26 + 18,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 2.5 + 1.1,
                sparkle: Math.random() > 0.8
            });
        }

        let animFrameId = null;
        let isEnded = false;
        let chargeTriggered = false;
        let teleportTriggered = false;
        const startTime = performance.now();
        const duration = 4200; // 4.2 giây du hành điện ảnh

        const finishVoyage = () => {
            if (isEnded) return;
            isEnded = true;

            window.removeEventListener('resize', onResize);
            if (animFrameId) cancelAnimationFrame(animFrameId);

            // Bùng nổ chớp sáng chuyển cảnh
            if (flashEl) {
                flashEl.classList.remove('flash-active');
                void flashEl.offsetWidth;
                flashEl.classList.add('flash-active');
            }

            setTimeout(() => {
                cinemaContainer.classList.remove('cinema-active');
                if (shipRig) {
                    shipRig.classList.remove('ship-active-voyage', 'ship-skip-teleport');
                }
                this.goToStage(3);
            }, 360);
        };

        if (skipBtn) {
            skipBtn.onclick = () => {
                window.oceanAudio?.playClick();
                if (shipRig) {
                    shipRig.classList.remove('ship-active-voyage');
                    void shipRig.offsetWidth;
                    shipRig.classList.add('ship-skip-teleport');
                }
                if (teleportBeam) teleportBeam.classList.add('beam-active');
                window.oceanAudio?.playHyperWarpJump();
                finishVoyage();
            };
        }

        // Vòng lặp render canvas 3D warp tunnel & teleport
        const renderWarp = (now) => {
            if (isEnded) return;

            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);

            // Giai đoạn Nạp xung lực bẻ cong không gian (~2.4s)
            if (progress >= 0.56 && progress < 0.74 && !chargeTriggered) {
                chargeTriggered = true;
                window.oceanAudio?.playWarpCharge();
            }

            // Giai đoạn Teleport nhảy vọt tức thời (~3.1s)
            if (progress >= 0.74 && !teleportTriggered) {
                teleportTriggered = true;
                if (teleportBeam) {
                    teleportBeam.classList.remove('beam-active');
                    void teleportBeam.offsetWidth;
                    teleportBeam.classList.add('beam-active');
                }
                if (warpRing) {
                    warpRing.classList.remove('warp-pulse-active');
                    void warpRing.offsetWidth;
                    warpRing.classList.add('warp-pulse-active');
                }
                window.oceanAudio?.playHyperWarpJump();
            }

            // Cập nhật tốc độ Warp hiển thị trên HUD
            let warpSpeedStr = 'WARP 2.4 LY';
            if (teleportTriggered) {
                warpSpeedStr = 'WARP: 9.9 LY [HYPER-JUMP]';
            } else if (chargeTriggered) {
                warpSpeedStr = `WARP: ${(5.8 + (progress - 0.56) * 18).toFixed(1)} LY`;
            } else {
                warpSpeedStr = `WARP: ${(1.8 + progress * 6.5).toFixed(1)} LY`;
            }

            if (depthTicker) {
                depthTicker.textContent = warpSpeedStr;
            }

            // Cập nhật phụ đề điện ảnh du hành
            if (captionEl) {
                if (progress < 0.52) {
                    captionEl.textContent = 'Chiến hạm thám hiểm đang du hành xuyên qua dải ngân hà huyền bí...';
                } else if (progress < 0.74) {
                    captionEl.textContent = 'Động cơ bẻ cong không gian kích hoạt... Tốc độ vượt ngân hà!';
                } else {
                    captionEl.textContent = `Dịch chuyển lượng tử thành công! Chào mừng ${this.userName} đến thế giới mới!`;
                }
            }

            // Xóa nền với hiệu ứng Motion Blur đuôi sáng ngân hà
            ctx.fillStyle = teleportTriggered ? 'rgba(2, 6, 20, 0.2)' : 'rgba(2, 6, 20, 0.3)';
            ctx.fillRect(0, 0, width, height);

            // Tâm điểm hội tụ của các vì sao (ngay phía trước mũi tàu)
            const cx = width / 2;
            const cy = height * 0.46;

            // Hào quang tinh vân ngân hà trung tâm (Galaxy Core Glow)
            const coreRadius = Math.max(width, height) * 0.52;
            const galaxyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
            galaxyGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
            galaxyGrad.addColorStop(0.28, 'rgba(168, 85, 247, 0.09)');
            galaxyGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.04)');
            galaxyGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = galaxyGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
            ctx.fill();

            // Gia tốc hạt: Tăng dần đều rồi bùng nổ khi Teleport
            const speedMultiplier = teleportTriggered
                ? 16 + (progress - 0.74) * 38
                : (1 + Math.pow(progress, 1.8) * 3.8);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.z -= p.speed * speedMultiplier;

                if (p.z <= 1) {
                    p.z = 1200;
                    p.x = (Math.random() - 0.5) * width * 3.2;
                    p.y = (Math.random() - 0.5) * height * 3.2;
                }

                const k = 480 / p.z;
                const px = p.x * k + cx;
                const py = p.y * k + cy;

                const prevZ = p.z + p.speed * speedMultiplier * (teleportTriggered ? 4.8 : 2.6);
                const prevK = 480 / prevZ;
                const prevX = p.x * prevK + cx;
                const prevY = p.y * prevK + cy;

                if (px >= 0 && px <= width && py >= 0 && py <= height) {
                    ctx.save();
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = Math.min(5.2, p.size * (1 - p.z / 1200) * (teleportTriggered ? 3.0 : 2.0));
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(px, py);
                    ctx.stroke();

                    // Điểm sáng lấp lánh ở đầu tia laser
                    ctx.fillStyle = '#ffffff';
                    if (p.sparkle) {
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = p.color;
                    }
                    ctx.beginPath();
                    ctx.arc(px, py, Math.min(3.6, p.size * (1.25 - p.z / 1200)), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            if (progress >= 1) {
                finishVoyage();
            } else {
                animFrameId = requestAnimationFrame(renderWarp);
            }
        };

        animFrameId = requestAnimationFrame(renderWarp);
    }

    /* ----------------------------------------------------------------------
       STAGE 3: 20/10 UNDERWATER WORLD & HOLOGRAPHIC SCREEN
       ---------------------------------------------------------------------- */
    bindStage3() {
        const btnToStage4 = document.getElementById('btn-go-stage-4');
        if (btnToStage4) {
            btnToStage4.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                this.goToStage(4);
            });
        }
    }

    /* ----------------------------------------------------------------------
       STAGE 4: WRITE A MESSAGE / QUOTE (MAX 120 CHARS)
       ---------------------------------------------------------------------- */
    prepareStage4Form() {
        document.querySelectorAll('.dynamic-user-name').forEach((el) => {
            el.textContent = this.userName || 'Bạn';
        });
        this.updateCharCounter();
    }

    updateCharCounter() {
        const textarea = document.getElementById('textarea-public-wish');
        const counterBadge = document.getElementById('char-counter-badge');
        if (!textarea || !counterBadge) return;
        const len = textarea.value.length;
        counterBadge.textContent = `${len} / ${MAX_COMMENT_LENGTH}`;
        counterBadge.style.color = len >= MAX_COMMENT_LENGTH ? '#fda4af' : 'var(--ocean-foam)';
    }

    bindStage4() {
        document.querySelectorAll('.avatar-option').forEach((av) => {
            av.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                document.querySelectorAll('.avatar-option').forEach((el) => el.classList.remove('selected'));
                av.classList.add('selected');
                this.selectedAvatar = av.getAttribute('data-avatar') || '🌸';
            });
        });

        document.querySelectorAll('.color-pill-option').forEach((pill) => {
            pill.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                document.querySelectorAll('.color-pill-option').forEach((el) => el.classList.remove('selected'));
                pill.classList.add('selected');
                this.selectedTheme = pill.getAttribute('data-theme') || 'theme-ocean';
            });
        });

        const textarea = document.getElementById('textarea-public-wish');
        if (textarea) {
            textarea.addEventListener('input', () => {
                if (textarea.value.length > MAX_COMMENT_LENGTH) {
                    textarea.value = textarea.value.slice(0, MAX_COMMENT_LENGTH);
                }
                this.updateCharCounter();
            });
        }

        document.querySelectorAll('.quote-sample-chip').forEach((chip) => {
            chip.addEventListener('click', () => {
                if (textarea) {
                    textarea.value = (chip.getAttribute('data-quote') || '').slice(0, MAX_COMMENT_LENGTH);
                    this.updateCharCounter();
                    textarea.focus();
                    window.oceanAudio?.playClick();
                }
            });
        });

        const wishForm = document.getElementById('form-submit-wish');
        if (wishForm) {
            wishForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const content = textarea ? textarea.value.trim() : '';

                if (!content) {
                    this.showToast('Cậu hãy viết đôi dòng nhận xét trước khi gửi nhé (hoặc bấm qua xem tường chung)!');
                    return;
                }

                if (content.length > MAX_COMMENT_LENGTH) {
                    this.showToast(`Nhận xét chỉ được tối đa ${MAX_COMMENT_LENGTH} ký tự thôi nhé!`);
                    return;
                }

                await window.oceanStorage.addWish({
                    authorName: this.userName || 'Bạn',
                    avatar: this.selectedAvatar,
                    theme: this.selectedTheme,
                    content
                });

                this.showToast(`Đã lưu nhận xét của ${this.userName} lên Tường Chung!`);
                window.oceanAudio?.playGiftOpenFanfare();
                window.oceanFX?.triggerBurst(window.innerWidth / 2, window.innerHeight / 2, 70);

                if (textarea) {
                    textarea.value = '';
                    this.updateCharCounter();
                }

                this.goToStage(5);
            });
        }

        const btnSkipToWall = document.getElementById('btn-skip-to-wall');
        if (btnSkipToWall) {
            btnSkipToWall.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                this.goToStage(5);
            });
        }
    }

    /* ----------------------------------------------------------------------
       STAGE 5: WISH WALL, USER FILTER CHIPS, REACTIONS & SESSION DELETE
       ---------------------------------------------------------------------- */
    bindStage5() {
        document.querySelectorAll('.filter-chip[data-filter]').forEach((chip) => {
            chip.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                document.querySelectorAll('.filter-chip[data-filter]').forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                this.wallFilter = chip.getAttribute('data-filter') || 'newest';
                this.renderWall();
            });
        });

        const searchInput = document.getElementById('input-search-wall');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.wallSearch = searchInput.value;
                this.renderWall();
            });
        }
    }

    renderUserFilterBar() {
        const bar = document.getElementById('user-filter-chips-bar');
        if (!bar) return;

        const authors = window.oceanStorage.getUniqueAuthors();
        if (authors.length === 0) {
            bar.innerHTML = `<span class="wish-time">Chưa có người dùng nào đăng nhận xét.</span>`;
            return;
        }

        const allActive = this.selectedAuthorFilter === '' ? 'active' : '';
        let html = `
            <button type="button" class="filter-chip user-author-chip ${allActive}" data-author="">
                <span>Tất cả (${window.oceanStorage.wishes.length})</span>
            </button>
        `;

        html += authors.map((a) => {
            const isActive = this.selectedAuthorFilter.toLowerCase() === a.name.toLowerCase() ? 'active' : '';
            return `
                <button type="button" class="filter-chip user-author-chip ${isActive}" data-author="${this.escapeHTML(a.name)}">
                    <span>${this.escapeHTML(a.avatar)}</span>
                    <span>${this.escapeHTML(a.name)} (${a.count})</span>
                </button>
            `;
        }).join('');

        bar.innerHTML = html;

        bar.querySelectorAll('.user-author-chip').forEach((btn) => {
            btn.addEventListener('click', () => {
                window.oceanAudio?.playClick();
                this.selectedAuthorFilter = btn.getAttribute('data-author') || '';
                this.renderWall();
            });
        });
    }

    renderWall() {
        this.renderUserFilterBar();

        const grid = document.getElementById('wishes-wall-grid');
        if (!grid) return;

        const allWishes = window.oceanStorage.getAllWishesSorted(
            this.wallFilter,
            this.wallSearch,
            this.selectedAuthorFilter
        );
        const leaderboard = window.oceanStorage.getLeaderboard();
        const rankMap = new Map();
        leaderboard.forEach((item, idx) => rankMap.set(String(item.id), idx + 1));

        const totalPostsEl = document.getElementById('stat-total-posts');
        const totalReactsEl = document.getElementById('stat-total-reacts');
        if (totalPostsEl) totalPostsEl.textContent = window.oceanStorage.wishes.length;
        if (totalReactsEl) {
            const sumReacts = window.oceanStorage.wishes.reduce(
                (acc, w) => acc + window.oceanStorage.getTotalReactions(w),
                0
            );
            totalReactsEl.textContent = sumReacts;
        }

        if (allWishes.length === 0) {
            grid.innerHTML = `
                <div class="wall-empty-state">
                    <p>Chưa có nhận xét nào trong danh mục này.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = allWishes.map((wish) => {
            const displayName = wish.authorName || 'Bạn';
            const canDelete = window.oceanStorage.canDeleteInCurrentSession(wish);
            const totalScore = window.oceanStorage.getTotalReactions(wish);
            const rank = rankMap.get(String(wish.id));
            let rankBadge = '';
            if (rank === 1 && totalScore > 0) rankBadge = '<span class="rank-ribbon-mini">👑 Top 1</span>';
            else if (rank === 2 && totalScore > 0) rankBadge = '<span class="rank-ribbon-mini">🥈 Top 2</span>';
            else if (rank === 3 && totalScore > 0) rankBadge = '<span class="rank-ribbon-mini">🥉 Top 3</span>';

            const reactionBtnsHTML = REACTION_META.map((rm) => {
                const count = (wish.reactions && wish.reactions[rm.key]) || 0;
                const reacted = window.oceanStorage.hasUserReacted(wish.id, rm.key);
                return `
                    <button type="button"
                            class="react-btn ${reacted ? 'reacted' : ''}"
                            data-wish-id="${wish.id}"
                            data-react="${rm.key}"
                            title="${rm.label}">
                        <span>${rm.emoji}</span>
                        <span>${count}</span>
                    </button>
                `;
            }).join('');

            return `
                <article class="wish-card ${this.escapeHTML(wish.theme || 'theme-ocean')}">
                    <div>
                        <div class="wish-card-top">
                            <div class="author-meta">
                                <div class="author-avatar">${this.escapeHTML(wish.avatar || '🌸')}</div>
                                <div>
                                    <div class="author-name" data-click-author="${this.escapeHTML(displayName)}" title="Ấn để xem tất cả nhận xét của ${this.escapeHTML(displayName)}">
                                        <span>${this.escapeHTML(displayName)}</span>
                                        ${canDelete ? '<span class="mine-tag">Vừa đăng</span>' : ''}
                                    </div>
                                    <div class="wish-time">
                                        ${this.formatTimeAgo(wish.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div class="reaction-buttons">
                                ${rankBadge}
                                ${canDelete ? `
                                    <button type="button" class="delete-wish-btn" data-delete-id="${wish.id}" title="Chỉ xoá được khi chưa tải lại trang">
                                        <i class="fa-solid fa-trash-can"></i>
                                        <span>Xoá</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="wish-content-quote">“${this.escapeHTML(wish.content)}”</p>
                    </div>
                    <div class="reaction-bar">
                        <div class="reaction-buttons">
                            ${reactionBtnsHTML}
                        </div>
                        <div class="total-react-pill" title="Tổng số lượt thả cảm xúc">
                            <i class="fa-solid fa-bolt"></i>
                            <span>${totalScore}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Bấm vào tên tác giả trên thẻ để lọc ngay comment của người đó
        grid.querySelectorAll('[data-click-author]').forEach((authorEl) => {
            authorEl.addEventListener('click', () => {
                const name = authorEl.getAttribute('data-click-author') || '';
                window.oceanAudio?.playClick();
                this.selectedAuthorFilter = this.selectedAuthorFilter === name ? '' : name;
                this.renderWall();
            });
        });

        grid.querySelectorAll('.react-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const wishId = btn.getAttribute('data-wish-id');
                const reactKey = btn.getAttribute('data-react');
                const meta = REACTION_META.find((m) => m.key === reactKey);

                window.oceanAudio?.playReactionPop();
                window.oceanFX?.spawnFloatingEmoji(e.clientX, e.clientY, meta ? meta.emoji : '❤️');
                window.oceanFX?.triggerBurst(e.clientX, e.clientY, 14);

                await window.oceanStorage.toggleReaction(wishId, reactKey);
                this.renderWall();
            });
        });

        grid.querySelectorAll('.delete-wish-btn').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const wishId = btn.getAttribute('data-delete-id');
                if (window.confirm('Bạn có chắc muốn xoá nhận xét vừa đăng của mình không?')) {
                    window.oceanAudio?.playClick();
                    const ok = await window.oceanStorage.deleteWish(wishId);
                    if (ok) {
                        this.renderWall();
                        this.showToast('Đã xoá nhận xét của bạn!');
                    }
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       MODAL: LEADERBOARD (BẢNG XẾP HẠNG)
       ---------------------------------------------------------------------- */
    bindModals() {
        const lbModal = document.getElementById('modal-leaderboard');
        const btnOpenLb = document.getElementById('btn-open-leaderboard');
        const btnCloseLb = document.getElementById('btn-close-leaderboard');

        if (btnOpenLb && lbModal) {
            btnOpenLb.addEventListener('click', () => {
                window.oceanAudio?.playGiftOpenFanfare();
                this.renderLeaderboardModal();
                lbModal.classList.add('open');
            });
        }
        if (btnCloseLb && lbModal) {
            btnCloseLb.addEventListener('click', () => lbModal.classList.remove('open'));
        }

        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    backdrop.classList.remove('open');
                }
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lbModal?.classList.contains('open')) {
                lbModal.classList.remove('open');
            }
        });
    }

    renderLeaderboardModal() {
        const ranked = window.oceanStorage.getLeaderboard();
        const podiumContainer = document.getElementById('leaderboard-podium-container');
        const listContainer = document.getElementById('leaderboard-full-list');

        if (podiumContainer) {
            const top1 = ranked[0];
            const top2 = ranked[1];
            const top3 = ranked[2];

            const podiumOrder = [
                { item: top2, rank: 2, crown: '🥈', title: 'Hạng Nhì' },
                { item: top1, rank: 1, crown: '👑', title: 'Quán Quân' },
                { item: top3, rank: 3, crown: '🥉', title: 'Hạng Ba' }
            ];

            podiumContainer.innerHTML = podiumOrder.map(({ item, rank, crown, title }) => {
                if (!item) return `<div class="podium-card rank-${rank}"><p class="wish-time">Chưa có dữ liệu</p></div>`;
                const displayName = item.authorName || 'Bạn';
                const total = window.oceanStorage.getTotalReactions(item);
                return `
                    <div class="podium-card rank-${rank}">
                        <div class="crown-badge">${crown}</div>
                        <div class="eyebrow-kicker">Top ${rank} • ${title}</div>
                        <div class="author-name" style="justify-content: center;">
                            <span>${this.escapeHTML(item.avatar)}</span>
                            <span>${this.escapeHTML(displayName)}</span>
                        </div>
                        <p class="podium-quote">“${this.escapeHTML(item.content)}”</p>
                        <div class="podium-score">
                            <i class="fa-solid fa-bolt"></i>
                            <span>${total} Reacts</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (listContainer) {
            if (ranked.length === 0) {
                listContainer.innerHTML = `<div class="wall-empty-state">Chưa có nhận xét nào trên tường chung.</div>`;
                return;
            }

            listContainer.innerHTML = ranked.map((item, idx) => {
                const rank = idx + 1;
                const displayName = item.authorName || 'Bạn';
                const total = window.oceanStorage.getTotalReactions(item);
                const r = item.reactions || {};
                return `
                    <div class="leaderboard-row">
                        <div class="rank-number">#${rank}</div>
                        <div>
                            <div class="author-name">
                                <span>${this.escapeHTML(item.avatar)}</span>
                                <span>${this.escapeHTML(displayName)}</span>
                            </div>
                            <p class="podium-quote" style="margin: 4px 0 8px; font-style: normal;">
                                “${this.escapeHTML(item.content)}”
                            </p>
                            <div class="reaction-buttons wish-time">
                                <span>❤️ ${r.heart || 0}</span>
                                <span>🌊 ${r.wave || 0}</span>
                                <span>🌸 ${r.flower || 0}</span>
                                <span>✨ ${r.sparkle || 0}</span>
                                <span>😂 ${r.laugh || 0}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div class="podium-score" style="margin-bottom: 6px;">
                                <i class="fa-solid fa-bolt"></i>
                                <span>${total}</span>
                            </div>
                            <div>
                                <button type="button" class="react-btn lb-quick-react" data-wish-id="${item.id}">
                                    <span>❤️</span>
                                    <span>+1 Tim</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            listContainer.querySelectorAll('.lb-quick-react').forEach((btn) => {
                btn.addEventListener('click', async (e) => {
                    const id = btn.getAttribute('data-wish-id');
                    window.oceanAudio?.playReactionPop();
                    window.oceanFX?.spawnFloatingEmoji(e.clientX, e.clientY, '❤️');
                    await window.oceanStorage.toggleReaction(id, 'heart');
                    this.renderLeaderboardModal();
                    this.renderWall();
                });
            });
        }
    }

    /* ----------------------------------------------------------------------
       UTILITIES
       ---------------------------------------------------------------------- */
    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'ocean-toast';
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 320);
        }, 3200);
    }

    formatTimeAgo(isoString) {
        if (!isoString) return 'Vừa xong';
        const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diffSec < 60) return 'Vừa xong';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} phút trước`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} giờ trước`;
        return 'Hôm nay';
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.oceanApp = new OceanApp();
});
