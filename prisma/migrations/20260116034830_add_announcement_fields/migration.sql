-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_announcements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT,
    "pinned" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "authorId" INTEGER DEFAULT 1,
    "department" TEXT,
    "media_url" TEXT,
    "media_type" TEXT,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_announcements" ("content", "created_at", "id", "pinned", "type", "updated_at") SELECT "content", "created_at", "id", "pinned", "type", "updated_at" FROM "announcements";
DROP TABLE "announcements";
ALTER TABLE "new_announcements" RENAME TO "announcements";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
