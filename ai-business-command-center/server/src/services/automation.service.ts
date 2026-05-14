import { prisma } from "../lib/prisma.js";
          type: skill,
          title: automation.name,
          content: generation.content,
          inputSnapshot: (automation.config as object) ?? {},
        },
      });

      await prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          outputId: output.id,
          creditsSpent: 1,
          completedAt: new Date(),
          result: { outputId: output.id } as object,
        },
      });
    }

    await prisma.automation.update({
      where: { id: automation.id },
      data: {
        lastRunAt: new Date(),
        lastStatus: "completed",
        lastError: null,
        failureCount: 0,
        lockedUntil: null,
        nextRunAt: computeNextRunAt({
          cadence: automation.cadence as "weekly" | "monthly",
          timezone: automation.timezone,
          dayOfWeek: automation.dayOfWeek,
          dayOfMonth: automation.dayOfMonth,
          hour: automation.hour,
          minute: automation.minute,
        }),
      },
    });
  } catch (err) {
    logger.error({ err, automationId: automation.id }, "Automation execution failed");

    await Promise.all([
      prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          errorMsg: "Automation execution failed.",
          completedAt: new Date(),
        },
      }),
      prisma.automation.update({
        where: { id: automation.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: "failed",
          lastError: "Automation execution failed",
          failureCount: { increment: 1 },
          lockedUntil: null,
          nextRunAt: computeNextRunAt({
            cadence: automation.cadence as "weekly" | "monthly",
            timezone: automation.timezone,
            dayOfWeek: automation.dayOfWeek,
            dayOfMonth: automation.dayOfMonth,
            hour: automation.hour,
            minute: automation.minute,
          }),
        },
      }),
    ]);
  }
}

export async function runDueAutomations(limit = 10) {
  const claimed = await claimDueAutomations(limit);

  for (const id of claimed) {
    await executeAutomation(id, "scheduled");
  }

  return {
    claimed: claimed.length,
    automationIds: claimed,
  };
}
