import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export async function ensureBusinessScheduleCompatibility() {
  try {
    const columns = await db.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Business'
        AND column_name IN ('schedule', 'hours')
    `;

    const names = columns.map((column) => column.column_name);

    if (!names.includes("schedule") && names.includes("hours")) {
      await db.$executeRaw`ALTER TABLE "Business" RENAME COLUMN "hours" TO "schedule";`;
      await db.$executeRaw`ALTER TABLE "Business" ALTER COLUMN "published" SET DEFAULT true;`;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("Can't reach database server") || message.includes("database server")) {
      return;
    }

    console.warn("Legacy Business schema check skipped:", error);
  }
}
