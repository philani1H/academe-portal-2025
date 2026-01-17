-- CreateTable
CREATE TABLE IF NOT EXISTS "live_sessions" (
    "id" TEXT NOT NULL,
    "scheduled_id" TEXT,
    "session_id" TEXT NOT NULL,
    "course_id" INTEGER NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "participant_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "live_session_participants" (
    "id" TEXT NOT NULL,
    "live_session_id" TEXT NOT NULL,
    "user_id" INTEGER,
    "socket_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "live_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "live_sessions_scheduled_id_key" ON "live_sessions"("scheduled_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "live_sessions_session_id_key" ON "live_sessions"("session_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "live_sessions_session_id_idx" ON "live_sessions"("session_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "live_sessions_course_id_idx" ON "live_sessions"("course_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "live_session_participants_live_session_id_idx" ON "live_session_participants"("live_session_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "live_session_participants_socket_id_idx" ON "live_session_participants"("socket_id");

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_scheduled_id_fkey" FOREIGN KEY ("scheduled_id") REFERENCES "scheduled_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_participants" ADD CONSTRAINT "live_session_participants_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
