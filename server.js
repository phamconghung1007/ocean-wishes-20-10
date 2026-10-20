/**
 * ==========================================================================
 * OCEAN SURPRISE 20/10 - MICROSOFT SQL SERVER BACKEND (server.js)
 * Kết nối trực tiếp tới bảng dbo.Comments trong SQL Server (OceanWishes2010)
 * Chạy lệnh:
 *   1. npm install
 *   2. node server.js
 * ==========================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// ==========================================================================
// CẤU HÌNH KẾT NỐI MICROSOFT SQL SERVER
// Sửa lại user / password / server phù hợp với máy của bạn
// ==========================================================================
const SQL_CONFIG = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'localhost', // Hoặc 'localhost\\SQLEXPRESS'
    database: process.env.DB_NAME || 'OceanWishes2010',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let sql = null;
let poolPromise = null;

async function getSqlPool() {
    if (poolPromise) return poolPromise;
    try {
        sql = require('mssql');
        poolPromise = new sql.ConnectionPool(SQL_CONFIG)
            .connect()
            .then((pool) => {
                console.log('✅ Đã kết nối thành công tới Microsoft SQL Server (Database: OceanWishes2010)!');
                return pool;
            })
            .catch((err) => {
                console.warn('⚠️ Chưa kết nối được SQL Server (Đang dùng file DB dự phòng data/wishes.json):', err.message);
                poolPromise = null;
                return null;
            });
        return poolPromise;
    } catch (e) {
        console.warn('⚠️ Chưa cài thư viện mssql (Chạy `npm install` để kết nối SQL Server). Đang dùng file DB dự phòng.');
        return null;
    }
}

// ==========================================================================
// FILE DB DỰ PHÒNG (KHI CHƯA BẬT SQL SERVER) — BẮT ĐẦU RỖNG [] KHÔNG TẠO SẴN
// ==========================================================================
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'wishes.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFallbackDB() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
            return [];
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (_) {
        return [];
    }
}

function writeFallbackDB(list) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (_) {}
}

function mapRowToWish(row) {
    return {
        id: String(row.Id),
        authorName: row.AuthorName,
        avatar: row.Avatar || '🌸',
        theme: row.Theme || 'theme-ocean',
        content: row.Content,
        createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
        reactions: {
            heart: Number(row.ReactHeart || 0),
            wave: Number(row.ReactWave || 0),
            flower: Number(row.ReactFlower || 0),
            sparkle: Number(row.ReactSparkle || 0),
            laugh: Number(row.ReactLaugh || 0)
        },
        totalReacts: Number(row.TotalReacts || 0)
    };
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 1. GET /api/wishes — Lấy danh sách comment & react từ SQL Server
    if (pathname === '/api/wishes' && req.method === 'GET') {
        const pool = await getSqlPool();
        if (pool) {
            try {
                const result = await pool.request().query(`
                    SELECT Id, AuthorName, Avatar, Theme, Content,
                           ReactHeart, ReactWave, ReactFlower, ReactSparkle, ReactLaugh,
                           TotalReacts, CreatedAt
                    FROM dbo.Comments
                    ORDER BY CreatedAt DESC
                `);
                const wishes = result.recordset.map(mapRowToWish);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ wishes }));
            } catch (err) {
                console.error('SQL GET Error:', err.message);
            }
        }
        const wishes = readFallbackDB();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ wishes }));
    }

    // 2. POST /api/wishes — Thêm mới comment vào SQL Server (Giới hạn 120 ký tự)
    if (pathname === '/api/wishes' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                const authorName = String(payload.authorName || 'Bạn').trim().slice(0, 40);
                const avatar = String(payload.avatar || '🌸').trim().slice(0, 10);
                const theme = String(payload.theme || 'theme-ocean').trim().slice(0, 25);
                const content = String(payload.content || '').trim().slice(0, 120);

                if (!content) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ error: 'Nội dung không được để trống' }));
                }

                const pool = await getSqlPool();
                if (pool) {
                    const result = await pool
                        .request()
                        .input('AuthorName', sql.NVarChar(40), authorName)
                        .input('Avatar', sql.NVarChar(10), avatar)
                        .input('Theme', sql.VarChar(25), theme)
                        .input('Content', sql.NVarChar(120), content)
                        .query(`
                            INSERT INTO dbo.Comments (AuthorName, Avatar, Theme, Content)
                            OUTPUT INSERTED.*
                            VALUES (@AuthorName, @Avatar, @Theme, @Content)
                        `);
                    const created = mapRowToWish(result.recordset[0]);
                    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ ok: true, wish: created }));
                }

                // Fallback DB file
                const list = readFallbackDB();
                const newItem = {
                    id: String(Date.now()),
                    authorName,
                    avatar,
                    theme,
                    content,
                    createdAt: new Date().toISOString(),
                    reactions: { heart: 0, wave: 0, flower: 0, sparkle: 0, laugh: 0 }
                };
                list.unshift(newItem);
                writeFallbackDB(list);
                res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true, wish: newItem }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 3. POST /api/wishes/react — Cập nhật lượt thả React vào SQL Server
    if (pathname === '/api/wishes/react' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
            try {
                const { wishId, reactions } = JSON.parse(body);
                const r = reactions || {};
                const pool = await getSqlPool();
                if (pool && !isNaN(Number(wishId))) {
                    await pool
                        .request()
                        .input('Id', sql.Int, Number(wishId))
                        .input('ReactHeart', sql.Int, Math.max(0, Number(r.heart || 0)))
                        .input('ReactWave', sql.Int, Math.max(0, Number(r.wave || 0)))
                        .input('ReactFlower', sql.Int, Math.max(0, Number(r.flower || 0)))
                        .input('ReactSparkle', sql.Int, Math.max(0, Number(r.sparkle || 0)))
                        .input('ReactLaugh', sql.Int, Math.max(0, Number(r.laugh || 0)))
                        .query(`
                            UPDATE dbo.Comments
                            SET ReactHeart = @ReactHeart,
                                ReactWave = @ReactWave,
                                ReactFlower = @ReactFlower,
                                ReactSparkle = @ReactSparkle,
                                ReactLaugh = @ReactLaugh
                            WHERE Id = @Id
                        `);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ ok: true }));
                }

                const list = readFallbackDB();
                const target = list.find((w) => String(w.id) === String(wishId));
                if (target && reactions) {
                    target.reactions = reactions;
                    writeFallbackDB(list);
                }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 4. POST /api/wishes/delete — Xoá comment trong SQL Server
    if (pathname === '/api/wishes/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
            try {
                const { wishId } = JSON.parse(body);
                const pool = await getSqlPool();
                if (pool && !isNaN(Number(wishId))) {
                    await pool
                        .request()
                        .input('Id', sql.Int, Number(wishId))
                        .query(`DELETE FROM dbo.Comments WHERE Id = @Id`);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ ok: true }));
                }

                const list = readFallbackDB().filter((w) => String(w.id) !== String(wishId));
                writeFallbackDB(list);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Phục vụ file tĩnh (HTML, CSS, JS)
    let safePath = path.normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`🌊 Server 20/10 đang chạy tại: http://localhost:${PORT}`);
    getSqlPool();
});
