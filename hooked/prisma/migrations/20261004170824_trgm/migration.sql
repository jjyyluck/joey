-- Trigram similarity for question de-duplication and upload duplicate checks
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Question_title_trgm" ON "Question" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Story_preview_trgm" ON "Story" USING gin ("preview" gin_trgm_ops);
