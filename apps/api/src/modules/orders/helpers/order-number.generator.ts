import { Prisma, PrismaClient } from "@prisma/client";

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Generate an order number in the format ENZ-{YYYYMMDD}-{4-digit sequence}.
 * Example: ENZ-20260208-0001
 *
 * Finds today's highest order number and increments the sequence by 1.
 * Must be called within a Prisma transaction to ensure uniqueness.
 */
export async function generateOrderNumber(
  tx: PrismaTransactionClient,
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const prefix = `ENZ-${dateStr}-`;

  const lastOrder = await tx.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(
      lastOrder.orderNumber.substring(prefix.length),
      10,
    );
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  const sequenceStr = String(sequence).padStart(4, "0");
  return `${prefix}${sequenceStr}`;
}
