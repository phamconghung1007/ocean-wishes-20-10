/**
 * ==========================================================================
 * OCEAN SURPRISE 20/10 - UNDERWATER HOLOGRAPHIC WISH CONTROLLER (js/games.js)
 * Tự động chọn ngẫu nhiên 1 lời chúc 20/10 từ danh sách để phát lên
 * Màn Hình Quang Học Dưới Đáy Đại Dương (không hiển thị nhãn phong cách, không đổi lại)
 * ==========================================================================
 */

const WISH_TEMPLATES = [
    {
        getTitle: (name) => `Chúc mừng 20/10 nhé, ${name}!`,
        getBody: (name) =>
            `Từ giữa lòng biển xanh sâu thẳm, chúc ${name}: Nhan sắc ngày một thăng hạng rực rỡ, cười tươi như ánh nắng rọi qua làn nước trong veo!\n\n` +
            `Công việc và học tập luôn thuận buồm xuôi gió, dự án nào cũng thành công vang dội, tiền đồ rộng mở thênh thang và tài khoản lúc nào cũng rủng rỉnh ting ting nhé!`
    },
    {
        getTitle: (name) => `Chúc ${name} ngày 20/10 vạn sự như ý!`,
        getBody: (name) =>
            `Chúc cậu nhan sắc mãi trẻ trung tươi tắn, thần thái ngút ngàn, ăn ngon ngủ kỹ chẳng lo nghĩ muộn phiền.\n\n` +
            `Công việc thăng tiến vèo vèo, sếp quý đồng nghiệp thương, deadline tự giác né xa. Tiền đồ rực rỡ như ngọc sáng, ví tiền căng tràn và luôn tự do làm điều mình yêu!`
    },
    {
        getTitle: (name) => `Gửi ${name} lời chúc 20/10 rạng ngời nhất!`,
        getBody: (name) =>
            `Phụ nữ hiện đại vừa dịu dàng như nước biển, vừa bản lĩnh kiên cường vươn ra đại dương lớn.\n\n` +
            `Chúc ${name} nhan sắc kiêu kỳ cuốn hút, sự nghiệp bước lên những tầm cao mới, tiền đồ xán lạn và tài chính vững vàng để tha hồ mua sắm mọi món đồ mình thích mà không cần nhìn giá!`
    },
    {
        getTitle: (name) => `Chúc mừng 20/10 — Gửi ngàn ánh sao biển tới ${name}`,
        getBody: (name) =>
            `Đại dương bao la chúc ${name}: Gương mặt luôn rạng ngời không tì vết, năng lượng tích cực lan tỏa muôn nơi!\n\n` +
            `Học tập hay công việc đều xuôi chèo mát mái, mọi mục tiêu đặt ra đều cán đích xuất sắc, đường công danh rộng mở và cuộc sống ngập tràn những niềm vui bất ngờ!`
    },
    {
        getTitle: (name) => `Món quà 20/10 may mắn dành riêng cho ${name}`,
        getBody: (name) =>
            `Khi chiếc vỏ sò dưới đáy biển sâu hé mở, chúc mọi ước mơ của ${name} đều nhanh chóng thành hiện thực:\n\n` +
            `Nhan sắc thăng hoa rạng rỡ, sự nghiệp thăng tiến không ngừng, tiền tài bội thu, tâm hồn an yên và mỗi ngày thức dậy đều có thêm nhiều lý do để tự hào về chính mình!`
    },
    {
        getTitle: (name) => `Chúc ${name} một ngày 20/10 ngọt ngào & thành công!`,
        getBody: (name) =>
            `Chúc cậu có một nhan sắc vạn người mê, nụ cười tỏa nắng đốn tim mọi ánh nhìn!\n\n` +
            `Công việc hanh thông thuận lợi, gặp được quý nhân phù trợ, tiền đồ rạng rỡ thênh thang, số dư tài khoản nhảy số liên tục và luôn được yêu thương, chiều chuộng hết mực nhé!`
    },
    {
        getTitle: (name) => `Tín hiệu đại dương chúc mừng 20/10 tới ${name}`,
        getBody: (name) =>
            `Giữa muôn ngàn con sóng ngoài khơi, chúc ${name} luôn là phiên bản độc nhất vô nhị:\n\n` +
            `Nhan sắc ngày càng nhuận sắc mặn mà, trí tuệ sắc bén, công việc gặt hái ngàn thành tựu rực rỡ. Tiền đồ sáng lạn, hầu bao rủng rỉnh và hạnh phúc viên mãn trọn vẹn!`
    },
    {
        getTitle: (name) => `Chúc mừng 20/10, mong ${name} luôn tỏa sáng kiêu hãnh!`,
        getBody: (name) =>
            `Chúc ${name} giữ vững phong độ đỉnh cao: Đẹp từ diện mạo cho đến phong thái, độc lập và tự tin tỏa sáng theo cách riêng.\n\n` +
            `Sự nghiệp phất lên như diều gặp gió, tiền tài đổ về như thác đổ, mọi dự định ấp ủ đều thuận buồm xuôi gió và chạm tới những đỉnh vinh quang mới!`
    },
    {
        getTitle: (name) => `Lời chúc 20/10 từ rạn san hô ánh sáng gửi ${name}`,
        getBody: (name) =>
            `Dưới làn nước sâu lung linh, chúc ${name}: Da đẹp dáng xinh, nụ cười rạng rỡ cuốn trôi mọi mỏi mệt thường nhật.\n\n` +
            `Học hành điểm mười, công việc thắng lớn, tiền đồ thênh thang rộng mở, bổng lộc dồi dào và luôn có người đồng hành sẻ chia ấm áp bên cạnh!`
    },
    {
        getTitle: (name) => `Chúc ${name} 20/10 hạnh phúc & tài lộc dồi dào!`,
        getBody: (name) =>
            `Mong những điều tốt lành nhất thế gian sẽ luôn đồng hành cùng ${name}:\n\n` +
            `Nhan sắc không tuổi, công việc thăng hoa, tiền đồ rực rỡ, bớt lo toan thêm an nhàn, tiền bạc lúc nào cũng dư dả và mỗi chuyến đi đều mở ra những chân trời tuyệt đẹp!`
    }
];

class OceanGamesController {
    constructor() {
        this.typewriterTimer = null;
        this.assignedWishIndex = null;
    }

    initHubForUser(userName) {
        this.userName = userName || 'Cậu';
        // Random ngẫu nhiên 1 lời chúc duy nhất từ danh sách cho phiên của người dùng
        if (this.assignedWishIndex === null) {
            this.assignedWishIndex = Math.floor(Math.random() * WISH_TEMPLATES.length);
        }
        this.renderRandomHologramWish(this.assignedWishIndex);
    }

    resetRandomWish() {
        this.assignedWishIndex = null;
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
    }

    renderRandomHologramWish(index) {
        const tpl = WISH_TEMPLATES[index % WISH_TEMPLATES.length];
        const titleEl = document.getElementById('symphony-wish-title');
        const bodyEl = document.getElementById('symphony-wish-body');

        if (!titleEl || !bodyEl) return;

        titleEl.textContent = tpl.getTitle(this.userName);

        const fullText = tpl.getBody(this.userName);
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        bodyEl.textContent = '';

        let charIdx = 0;
        this.typewriterTimer = setInterval(() => {
            if (charIdx < fullText.length) {
                bodyEl.textContent += fullText[charIdx];
                charIdx++;
            } else {
                clearInterval(this.typewriterTimer);
            }
        }, 18);
    }
}

window.oceanGames = new OceanGamesController();
