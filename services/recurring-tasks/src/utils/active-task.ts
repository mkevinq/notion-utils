import { ActiveTaskProperties, CreateActiveTaskProperties } from "../types";

import { createDatabasePage, updateDatabasePage } from "./notion";

/**
 * Creates an "active task", and converts the API response to a clean object
 * containing the properties of the new "active task".
 *
 * @param {string} database - ID of the database to create the page in.
 * @param {any} properties - Notion API compliant object containing all the properties of the page to create.
 * @returns {Promise<ActiveTaskProperties>} - Properties of the created "active task".
 */
export const createActiveTask = async (
  database: string,
  properties: any
): Promise<ActiveTaskProperties> => {
  const response = await createDatabasePage(database, properties);
  return extractActiveTaskProperties(response);
};

/**
 * Updates an "active task", and converts the API response to a clean object
 * containing the properties of the updated "active task".
 *
 * @param {string} id - Page ID of the "active task".
 * @param {any} properties - Notion API compliant object containing page properties to update.
 * @returns {Promise<ActiveTaskProperties>} - Properties of the "active task".
 */
export const updateActiveTask = async (
  id: string,
  properties: any
): Promise<ActiveTaskProperties> => {
  const response = await updateDatabasePage(id, properties);
  return extractActiveTaskProperties(response);
};

/**
 * Converts the properties of an "active task" back into a format acceptable by
 * the Notion API for page updates or creation.
 *
 * @param {CreateActiveTaskProperties} activeTask - Object containing the properties.
 * @param {string} activeTask.mainTask - ID of the "main task" associated with this "active task".
 * @param {string} activeTask.name - Name of the "active task", coming from the name of the "main task".
 * @param {boolean} activeTask.time - Whether the "active task" uses a specific time in the start and end dates.
 * @param {string} activeTask.status - Progress of the task. (e.g. In progress or completed).
 * @param {Date} activeTask.start - Start date of the "active task".
 * @param {Date} activeTask.end - End date of the "active task".
 * @returns {any} - Notion API compliant object containing the properties of the "active task".
 */
export const buildActiveTaskProperties = ({
  mainTask,
  name,
  time,
  status,
  start,
  end,
}: CreateActiveTaskProperties): any => {
  const useTime = time || false;

  const startISOString = start?.toISOString();
  const startDate = useTime
    ? startISOString
    : startISOString?.slice(0, Math.max(0, startISOString.indexOf("T")));

  const endISOString = end?.toISOString();
  const endDate = useTime
    ? endISOString
    : endISOString?.slice(0, Math.max(0, endISOString.indexOf("T")));

  const date = start
    ? {
        ["When"]: {
          date: {
            start: startDate,
            end: endDate,
          },
        },
      }
    : {};

  return {
    ["Name"]: {
      title: [
        {
          text: {
            content: name,
          },
        },
      ],
    },
    ["Associated Task"]: {
      relation: [
        {
          id: mainTask,
        },
      ],
    },
    ["Status"]: {
      select: {
        name: status || "Not Started",
      },
    },
    ...date,
  };
};

/**
 * Converts the raw page data of the "active task" from the Notion API into a
 * cleaner, usuable object.
 *
 * @param {any} task - The raw page data of the "active task" from the Notion API.
 * @returns {ActiveTaskProperties} - An object containing the properties of the "main task".
 */
export const extractActiveTaskProperties = (task: any): ActiveTaskProperties => {
  const {
    id: task_id,
    properties: {
      ["Name"]: {
        title: [
          {
            text: { content: name },
          },
        ],
      } = {
        title: [
          {
            text: { content: undefined },
          },
        ],
      },
      ["When"]: { date: { start, end } } = {
        date: {
          start: undefined,
          end: undefined,
        },
      },
      ["Status"]: {
        select: { name: status },
      },
      ["Associated Task"]: { relation },
      ["Tags"]: { multi_select } = { multi_select: undefined },
    },
  } = task;

  return {
    id: task_id,
    name,
    mainTask: relation[0].id,
    status,
    time: start ? start.includes("T") : false,
    tags: multi_select?.map((tag: any) => tag.name),
    start,
    end,
  };
};

/**
 * Compares the start and end dates of two "active tasks".
 *
 * @param {Pick<ActiveTaskProperties, "start" | "end">} task - An "active task".
 * @param {Pick<ActiveTaskProperties, "start" | "end">} other - Another "active task" to compare against.
 * @returns {boolean} - True if the start and end dates are the same, false otherwise.
 */
export const compareDates = (
  task: Pick<ActiveTaskProperties, "start" | "end">,
  other: Pick<ActiveTaskProperties, "start" | "end">
): boolean => {
  const taskStart = task.start ? new Date(task.start).getTime() : undefined;
  const taskEnd = task.end ? new Date(task.end).getTime() : undefined;
  const otherStart = other.start ? new Date(other.start).getTime() : undefined;
  const otherEnd = other.end ? new Date(other.end).getTime() : undefined;

  return taskStart === otherStart && taskEnd === otherEnd;
};

/**
 * Compares the tags in two "active tasks".
 *
 * @param {Pick<ActiveTaskProperties, "tags">} task - An "active task".
 * @param {Pick<ActiveTaskProperties, "tags">} other - Another "active task" to compare against.
 * @returns {boolean} - True if the tags are exactly the same, false otherwise.
 */
export const compareTags = (
  task: Pick<ActiveTaskProperties, "tags">,
  other: Pick<ActiveTaskProperties, "tags">
): boolean => task.tags?.sort().toString() === other.tags?.sort().toString();
