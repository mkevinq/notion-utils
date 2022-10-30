import cron from "cron-parser";

/**
 * Checks to see if the given string is a valid crontab.
 *
 * @param cronString - Any string.
 * @returns True if the string is a crontab, false otherwise.
 */
export const validateCron = (cronString: string): boolean => {
  try {
    cron.parseExpression(cronString);
    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a list of dates that occur between a given start and end date, based
 * on the occurrences specified by the crontab.
 *
 * @param start - The start time of the recurring period.
 * @param end - The ending time of the recurring period.
 * @param cronStrings - A list of crontabs.
 * @returns A list of dates.
 */
export const getOccurrences = (start: Date, end: Date, cronStrings: string[]): Date[] => {
  const occurrences: Date[] = [];

  for (const cronString of cronStrings) {
    const iterator = cron.parseExpression(cronString, {
      currentDate: start,
      endDate: end,
      iterator: true,
      utc: true,
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
