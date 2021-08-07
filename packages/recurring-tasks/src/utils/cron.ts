import cron from "cron-parser";

/**
 * Checks to see if the given string is a valid crontab.
 *
 * @param {string} cronString - Any string.
 * @returns {boolean} - True if the string is a crontab, false otherwise.
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
 * @param {Date} start - The start time of the recurring period.
 * @param {Date} end - The ending time of the recurring period.
 * @param {string} cronStrings - A list of crontabs.
 * @returns {Date[]} - A list of dates.
 */
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

/**
 * Fetches the list of crontabs by splitting a given piece of text into it's lines,
 * then checking to see if each line is a valid crontab.
 *
 * @param {string} text - The text containing a list of crontabs.
 * @returns {string[]} - A list of crontabs.
 */
export const getCrons = (text: string): string[] => {
  const unvalidatedCrons = text.split("\n").map((cron: string) => cron.trim());
  return unvalidatedCrons.filter((cron: string) => validateCron(cron));
};
