/**
 * ==========================================================================
 * OCEAN SURPRISE 20/10 - DATABASE CLIENT & SESSION MANAGER (js/storage.js)
 * - Không tạo sẵn dữ liệu giả trong JS
 * - Chỉ cho phép xoá comment của chính mình khi CHƯA reload trang (lưu trong RAM)
 * - Kết nối trực tiếp tới Database API (/api/wishes -> Microsoft SQL Server)
 * ==========================================================================
 */

const FALLBACK_DB_KEY = 'ocean_20_10_sql_fallback_db_v3';

class OceanStorageManager {
    constructor() {
        this.wishes = [];
        // Lưu trong RAM của phiên hiện tại (Khi F5 reload trang sẽ tự động xoá sạch)
        this.sessionMyWishIds = new Set();
        this.sessionReactions = {};
        this.apiAvailable = false;

        this.fetchFromDatabase();
    }

    async fetchFromDatabase() {
        if (window.location.protocol !== 'file:') {
            try {
                const res = await fetch('/api/wishes', { method: 'GET' });
                if (res.ok) {
                    const data = await res.json();
                    this.apiAvailable = true;
                    this.wishes = Array.isArray(data.wishes) ? data.wishes : [];
                    if (window.oceanApp && typeof window.oceanApp.renderWall === 'function') {
                        window.oceanApp.renderWall();
                    }
                    return;
                }
            } catch (_) {
                this.apiAvailable = false;
            }
        }

        // Dự phòng khi mở trực tiếp file HTML mà chưa bật server Node/SQL
        try {
            const raw = localStorage.getItem(FALLBACK_DB_KEY);
            this.wishes = raw ? JSON.parse(raw) : [];
        } catch (_) {
            this.wishes = [];
        }
    }

    saveFallbackDB() {
        if (this.apiAvailable) return;
        try {
            localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(this.wishes));
        } catch (_) {}
    }

    // Chỉ comment vừa tạo trong phiên hiện tại (chưa reload trang) mới được phép xoá
    canDeleteInCurrentSession(wish) {
        return !!(wish && this.sessionMyWishIds.has(String(wish.id)));
    }

    getTotalReactions(wish) {
        if (!wish || !wish.reactions) return 0;
        const r = wish.reactions;
        return (r.heart || 0) + (r.wave || 0) + (r.flower || 0) + (r.sparkle || 0) + (r.laugh || 0);
    }

    // Lấy danh sách những người dùng đã bình luận để hiển thị nút bấm lọc nhanh
    getUniqueAuthors() {
        const map = new Map();
        this.wishes.forEach((w) => {
            const name = (w.authorName || '').trim();
            if (!name) return;
            if (!map.has(name)) {
                map.set(name, {
                    name,
                    avatar: w.avatar || '🌸',
                    count: 1
                });
            } else {
                map.get(name).count += 1;
            }
        });
        return Array.from(map.values());
    }

    getAllWishesSorted(mode = 'newest', searchQuery = '', selectedAuthor = '') {
        let list = [...this.wishes];

        // Lọc theo người dùng khi bấm vào tên người dùng
        if (selectedAuthor && selectedAuthor.trim() !== '') {
            const target = selectedAuthor.trim().toLowerCase();
            list = list.filter((w) => (w.authorName || '').trim().toLowerCase() === target);
        }

        // Lọc theo ô tìm kiếm
        if (searchQuery && searchQuery.trim() !== '') {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter((w) => {
                const name = (w.authorName || '').toLowerCase();
                return name.includes(q) || (w.content || '').toLowerCase().includes(q);
            });
        }

        if (mode === 'mine') {
            list = list.filter((w) => this.canDeleteInCurrentSession(w));
        } else if (mode === 'popular') {
            list.sort((a, b) => this.getTotalReactions(b) - this.getTotalReactions(a));
        } else {
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return list;
    }

    getLeaderboard() {
        return [...this.wishes].sort((a, b) => this.getTotalReactions(b) - this.getTotalReactions(a));
    }

    async addWish({ authorName, avatar, theme, content }) {
        const cleanContent = String(content || '').trim().slice(0, 120);
        const cleanAuthor = String(authorName || 'Bạn').trim().slice(0, 40);

        if (this.apiAvailable) {
            try {
                const res = await fetch('/api/wishes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        authorName: cleanAuthor,
                        avatar: avatar || '🌸',
                        theme: theme || 'theme-ocean',
                        content: cleanContent
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.wish) {
                        this.sessionMyWishIds.add(String(data.wish.id));
                        this.wishes.unshift(data.wish);
                        return data.wish;
                    }
                }
            } catch (_) {}
        }

        // Dự phòng khi chưa bật server
        const newWish = {
            id: String(Date.now()),
            authorName: cleanAuthor,
            avatar: avatar || '🌸',
            theme: theme || 'theme-ocean',
            content: cleanContent,
            createdAt: new Date().toISOString(),
            reactions: { heart: 0, wave: 0, flower: 0, sparkle: 0, laugh: 0 }
        };

        this.sessionMyWishIds.add(String(newWish.id));
        this.wishes.unshift(newWish);
        this.saveFallbackDB();
        return newWish;
    }

    async deleteWish(wishId) {
        // Chỉ cho phép xoá nếu thuộc phiên hiện tại (chưa reload trang)
        if (!this.sessionMyWishIds.has(String(wishId))) {
            return false;
        }

        this.wishes = this.wishes.filter((w) => String(w.id) !== String(wishId));
        this.sessionMyWishIds.delete(String(wishId));
        delete this.sessionReactions[wishId];
        this.saveFallbackDB();

        if (this.apiAvailable) {
            try {
                await fetch('/api/wishes/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wishId })
                });
            } catch (_) {}
        }
        return true;
    }

    async toggleReaction(wishId, reactionType) {
        const wish = this.wishes.find((w) => String(w.id) === String(wishId));
        if (!wish) return null;

        if (!this.sessionReactions[wishId]) {
            this.sessionReactions[wishId] = {};
        }

        const currentCount = this.sessionReactions[wishId][reactionType] || 0;
        if (currentCount < 5) {
            wish.reactions[reactionType] = (wish.reactions[reactionType] || 0) + 1;
            this.sessionReactions[wishId][reactionType] = currentCount + 1;
        } else {
            wish.reactions[reactionType] = Math.max(0, (wish.reactions[reactionType] || 0) - currentCount);
            this.sessionReactions[wishId][reactionType] = 0;
        }

        this.saveFallbackDB();

        if (this.apiAvailable) {
            try {
                await fetch('/api/wishes/react', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wishId, reactionType, reactions: wish.reactions })
                });
            } catch (_) {}
        }

        return { wish };
    }

    hasUserReacted(wishId, reactionType) {
        return !!(this.sessionReactions[wishId] && this.sessionReactions[wishId][reactionType] > 0);
    }
}

window.oceanStorage = new OceanStorageManager();
