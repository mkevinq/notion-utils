import { RichTextBase } from "@notionhq/client/build/src/api-types";

import { CreateActiveTaskProperties, MainTaskProperties } from "../types";

import { getCrons, getOccurrences } from "./cron";

/**
 * Creates a list of active tasks based on the properties of the given "main task".
 * The generated list depends on:
 * - The period in which the task occurs in.
 * - How often the task occurs according to the "occurrence cron".
 *
 * @param {MainTaskProperties} properties - The properties of the "main task".
 * @returns {CreateActiveTaskProperties[]} - The properties of the recurring "active tasks".
 */
export const convertMainTaskToActiveTasks = (
  properties: MainTaskProperties
): CreateActiveTaskProperties[] => {
  const {
    id,
    name,
    time,
    timezoneOffset,
    recurrenceStart,
    recurrenceEnd,
    occurrenceCrons,
    duration,
  } = properties;

  if (recurrenceStart) {
    if (occurrenceCrons) {
      const occurrenceDates = getOccurrences(
        recurrenceStart,
        recurrenceEnd || new Date(recurrenceStart.getTime() + 1000 * 60 * 60 * 24 * 30),
        occurrenceCrons
      );

      return occurrenceDates.map((occurrence) => ({
        mainTask: id,
        name,
        time: true,
        timezoneOffset,
        start: occurrence,
        end: duration ? new Date(occurrence.getTime() + duration * 60_000) : undefined,
      }));
    }

    return [
      {
        mainTask: id,
        name,
        time,
        timezoneOffset,
        start: recurrenceStart,
        end:
          recurrenceEnd ||
          (time
            ? duration
              ? new Date(recurrenceStart.getTime() + duration * 60_000)
              : undefined
            : undefined),
      },
    ];
  }

  return [{ mainTask: id, name, time, timezoneOffset }];
};

/**
 * Converts the raw page data of the "main task" from the Notion API into a
 * cleaner, usuable object.
 *
 * @param {any} task - The raw page data of the "main task" from the Notion API.
 * @returns {MainTaskProperties} - An object containing the properties of the "main task".
 */
export const extractMainTaskProperties = (task: any): MainTaskProperties => {
  const {
    id: task_id,
    properties: {
      ["Name"]: {
        title: [
          {
            text: { content: name },
          },
        ],
      } = { title: [{ text: { content: undefined } }] },
      ["Recurrence Period"]: { date },
      ["Occurrence Crons"]: { rich_text: occurrenceCronsText } = { rich_text: undefined },
      ["Reset Crons"]: { rich_text: resetCronsText } = { rich_text: undefined },
      ["Duration (Minutes)"]: { number } = { number: undefined },
      ["Related Active Tasks"]: { relation: activeTaskRelations } = { relation: undefined },
    },
  } = task;

  const activeTasks = activeTaskRelations
    ? activeTaskRelations.map((relation: any) => relation.id).sort()
    : undefined;

  const occurrenceCrons = occurrenceCronsText.flatMap((textItem: RichTextBase) =>
    getCrons(textItem.plain_text)
  );

  const resetCrons = resetCronsText.flatMap((textItem: RichTextBase) =>
    getCrons(textItem.plain_text)
  );

  const timezoneOffset = date?.start?.includes("T")
    ? date?.start?.includes("+")
      ? date?.start?.slice(date?.start?.lastIndexOf("+"))
      : date?.start?.slice(date?.start?.lastIndexOf("-"))
    : undefined;

  return {
    id: task_id,
    name,
    activeTasks,
    time: date?.start ? date.start.includes("T") : false,
    timezoneOffset,
    recurrenceStart: date?.start ? new Date(date.start) : undefined,
    recurrenceEnd: date?.end ? new Date(date.end) : undefined,
    occurrenceCrons: occurrenceCrons.length > 0 ? occurrenceCrons : undefined,
    resetCrons: resetCrons.length > 0 ? resetCrons : undefined,
    duration: number,
  };
};
