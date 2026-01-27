-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ORGANIZATION', 'SERVICE', 'PRODUCT', 'PERSON', 'LOCATION', 'TOPIC');

-- CreateEnum
CREATE TYPE "EntitySource" AS ENUM ('SCHEMA', 'NLP', 'MANUAL', 'STRUCTURE');

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "aliases" TEXT[],
    "source" "EntitySource" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_mentions" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "chunkId" TEXT,
    "contextSnippet" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relations" (
    "id" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" "EntitySource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_chunks" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "headingPath" TEXT[],
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entities_siteId_idx" ON "entities"("siteId");

-- CreateIndex
CREATE INDEX "entities_type_idx" ON "entities"("type");

-- CreateIndex
CREATE INDEX "entities_name_idx" ON "entities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "entities_siteId_name_type_key" ON "entities"("siteId", "name", "type");

-- CreateIndex
CREATE INDEX "entity_mentions_entityId_idx" ON "entity_mentions"("entityId");

-- CreateIndex
CREATE INDEX "entity_mentions_pageId_idx" ON "entity_mentions"("pageId");

-- CreateIndex
CREATE INDEX "entity_mentions_chunkId_idx" ON "entity_mentions"("chunkId");

-- CreateIndex
CREATE INDEX "entity_relations_fromEntityId_idx" ON "entity_relations"("fromEntityId");

-- CreateIndex
CREATE INDEX "entity_relations_toEntityId_idx" ON "entity_relations"("toEntityId");

-- CreateIndex
CREATE INDEX "entity_relations_relationType_idx" ON "entity_relations"("relationType");

-- CreateIndex
CREATE UNIQUE INDEX "entity_relations_fromEntityId_toEntityId_relationType_key" ON "entity_relations"("fromEntityId", "toEntityId", "relationType");

-- CreateIndex
CREATE INDEX "content_chunks_pageId_idx" ON "content_chunks"("pageId");

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_chunks" ADD CONSTRAINT "content_chunks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
