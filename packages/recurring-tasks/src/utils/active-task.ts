import { createDatabasePage, updateDatabasePage } from "./notion";

export const createActiveTask = async (
  database: string,
  properties: any
): Promise<ActiveTaskProperties> => {
  const response = await createDatabasePage(database, properties);
  return extractActiveTaskProperties(response);
};

export const updateActiveTask = async (
  id: string,
  properties: any
): Promise<ActiveTaskProperties> => {
  const response = await updateDatabasePage(id, properties);
  return extractActiveTaskProperties(response);
};

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

export const compareTags = (
  task: Pick<ActiveTaskProperties, "tags">,
  other: Pick<ActiveTaskProperties, "tags">
): boolean => task.tags?.sort().toString() === other.tags?.sort().toString();
