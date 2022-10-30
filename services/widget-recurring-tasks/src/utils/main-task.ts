import { ActiveTaskProperties, MainTaskProperties } from "../types";

import { getOccurrences } from "./cron";

/**
 * Creates a list of tasks based on the given parameters
 * The generated list depends on:
 * - The period in which the task occurs in. (recurrence start and end)
 * - How often the task occurs according to the "occurrence cron".
 *
 * @param properties - The properties of the "main task".
 * @returns The properties of the recurring "active tasks".
 */
export const generateTasks = (properties: MainTaskProperties): ActiveTaskProperties[] => {
  const { name, recurrenceStart, recurrenceEnd, occurrenceCrons, duration } = properties;

  const occurrenceDates = getOccurrences(recurrenceStart, recurrenceEnd, occurrenceCrons);

  return occurrenceDates.map((occurrence) => ({
    name,
    start: occurrence,
    // If a task duration is given, then set the end date & time for the task, otherwise leave it undefined
    end: duration ? new Date(occurrence.getTime() + duration * 60_000) : undefined,
  }));
};
