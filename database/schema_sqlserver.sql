-- ==========================================================================
-- MICROSOFT SQL SERVER DATABASE SCRIPT (T-SQL)
-- Dự án: Chúc mừng 20/10 — Bức Tường Lời Chúc & Bảng Xếp Hạng React
-- Cách chạy: Mở file này trong SQL Server Management Studio (SSMS) và nhấn F5 (Execute)
-- Thiết kế tối ưu: Chỉ dùng DUY NHẤT 1 bảng (dbo.Comments) kèm cột tính toán
-- tự động (TotalReacts) để vừa lưu tên, nhận xét, 5 loại react vừa xếp hạng BXH.
-- ==========================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'OceanWishes2010')
BEGIN
    CREATE DATABASE [OceanWishes2010];
END
GO

USE [OceanWishes2010];
GO

-- Xoá bảng cũ nếu muốn tạo lại từ đầu
IF OBJECT_ID(N'dbo.Comments', N'U') IS NOT NULL
    DROP TABLE dbo.Comments;
GO

-- ==========================================================================
-- BẢNG DUY NHẤT: dbo.Comments
-- Lưu tên người dùng (nhập ở trang đầu), nội dung nhận xét (giới hạn 120 ký tự),
-- màu sắc thẻ, icon, số lượng 5 loại React và tổng điểm xếp hạng (TotalReacts)
-- ==========================================================================
CREATE TABLE dbo.Comments (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    AuthorName      NVARCHAR(40)  NOT NULL,                      -- Tên người dùng nhập lúc mới vào
    Avatar          NVARCHAR(10)  NOT NULL DEFAULT N'🌸',        -- Icon đại diện
    Theme           VARCHAR(25)   NOT NULL DEFAULT 'theme-ocean',-- Màu sắc thẻ trên tường
    Content         NVARCHAR(120) NOT NULL,                      -- Nội dung nhận xét (Giới hạn tối đa 120 ký tự)
    ReactHeart      INT           NOT NULL DEFAULT 0,            -- Lượt thả ❤️
    ReactWave       INT           NOT NULL DEFAULT 0,            -- Lượt thả 🌊
    ReactFlower     INT           NOT NULL DEFAULT 0,            -- Lượt thả 🌸
    ReactSparkle    INT           NOT NULL DEFAULT 0,            -- Lượt thả ✨
    ReactLaugh      INT           NOT NULL DEFAULT 0,            -- Lượt thả 😂
    
    -- Cột tự động tính tổng React để truy vấn Bảng Xếp Hạng (không cần tạo bảng phụ)
    TotalReacts     AS (ReactHeart + ReactWave + ReactFlower + ReactSparkle + ReactLaugh) PERSISTED,
    
    CreatedAt       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    -- Ràng buộc kiểm tra giới hạn độ dài và dữ liệu hợp lệ
    CONSTRAINT CK_Comments_Content_Length CHECK (LEN(LTRIM(RTRIM(Content))) BETWEEN 1 AND 120),
    CONSTRAINT CK_Comments_Reacts_Positive CHECK (
        ReactHeart >= 0 AND ReactWave >= 0 AND ReactFlower >= 0 AND ReactSparkle >= 0 AND ReactLaugh >= 0
    )
);
GO

-- Index tăng tốc cho Bảng Xếp Hạng (Sắp xếp theo TotalReacts giảm dần)
CREATE NONCLUSTERED INDEX IX_Comments_Leaderboard
ON dbo.Comments (TotalReacts DESC, CreatedAt DESC);
GO

-- Index tăng tốc khi bấm lọc xem comment theo Tên người dùng
CREATE NONCLUSTERED INDEX IX_Comments_AuthorName
ON dbo.Comments (AuthorName ASC, CreatedAt DESC);
GO
