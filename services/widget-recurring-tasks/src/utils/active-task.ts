import { ActiveTaskProperties } from "../types";

/**
 * Converts the task properties into a format acceptable by the Notion API for page creation.
 *
 * @param activeTask - Object containing the properties.
 * @param activeTask.name - Name of the "active task", coming from the name of the "main task".
 * @param activeTask.start - Start date of the "active task".
 * @param activeTask.end - End date of the "active task".
 * @param propertyId - ID of the date property to use.
 * @param keepTime - Whether the specific time of the occurrence is contained in the property value.
 * @returns Notion API compliant object containing the properties of the "active task".
 */
export const buildPageProperties = (
  { name, start, end }: ActiveTaskProperties,
  propertyId: string,
  keepTime: boolean
) => {
  const startISOString = start.toISOString();
  const startDate = keepTime
    ? startISOString
    : startISOString?.slice(0, Math.max(0, startISOString.indexOf("T")));

  const endISOString = end?.toISOString();
  const endDate = keepTime
    ? endISOString
    : endISOString?.slice(0, Math.max(0, endISOString.indexOf("T")));

  // Using spread operator here fixes type errors in TaskUI.tsx
  // Unfortunately we can't represent a type here that is "every string except 'title'"
  return {
    ...{
      [propertyId]: {
        date: {
          start: startDate,
          end: endDate,
          time_zone: keepTime ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
        },
      },
    },
    title: {
      title: [
        {
          text: {
            content: name,
          },
        },
      ],
    },
  };
};
