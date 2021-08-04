import cron from "cron-parser";

export const validateCron = (cronString: string): boolean => {
  try {
    cron.parseExpression(cronString);
    return true;
  } catch {
    return false;
  }
};

export const getOccurrences = (start: Date, end: Date, cronStrings: string[]): Date[] => {
  const occurrences: Date[] = [];

  for (const cronString of cronStrings) {
    const iterator = cron.parseExpression(cronString, {
      currentDate: start,
      endDate: end,
      iterator: true,
    });

    while (iterator.hasNext()) {
      const { value } = iterator.next();
      occurrences.push(value.toDate());
    }
  }

  // User might also select an invalid recurrence period, causing an empty array
  // Example: Cron specifies every monday, but monday isn't included in the period
  return occurrences;
};

export const getCrons = (text: string): string[] => {
  const unvalidatedCrons = text.split("\n").map((cron: string) => cron.trim());
  return unvalidatedCrons.filter((cron: string) => validateCron(cron));
};
