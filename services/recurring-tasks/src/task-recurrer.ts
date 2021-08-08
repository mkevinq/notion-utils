import { Database, Page } from "@notionhq/client/build/src/api-types";
import { isEqual } from "lodash";

import { MainTaskProperties } from "./types";
import {
  buildActiveTaskProperties,
  compareDates,
  createActiveTask,
  extractActiveTaskProperties,
  updateActiveTask,
} from "./utils/active-task";
import { convertMainTaskToActiveTasks, extractMainTaskProperties } from "./utils/main-task";
import { deleteDatabasePage, notion } from "./utils/notion";

export default class TaskRecurrer {
  private existingMainTasks: Record<string, MainTaskProperties> = {};
  private mainDatabase: string;
  private activeDatabase: string;
  public lock = false;

  /**
   * Find databases to read and write to, and pre-loads the "main tasks".
   *
   * Since we'll be pre-loading the "main tasks" on initialization, this will
   * prevent tasks from being created / updated / deleted when the service
   * starts. This means we're being optimistic and assuming that main tasks
   * will not change during service downtime.
   */
  initialize = async (): Promise<void> => {
    console.log("Initializing service, using token:", process.env.NOTION_TOKEN);
    if (!this.mainDatabase || !this.activeDatabase) {
      await this.findDatabasesToUse();
    }

    const tasks = await notion.databases.query({
      database_id: this.mainDatabase,
    });

    for (const task of tasks.results) {
      this.existingMainTasks[task.id] = extractMainTaskProperties(task);
    }
  };

  /**
   * Finds the IDs for the "main tasks" database and the "active tasks" database.
   */
  findDatabasesToUse = async (): Promise<void> => {
    const databases = await notion.search({
      filter: {
        value: "database",
        property: "object",
      },
    });

    for (const database of databases.results) {
      const { id, title } = database as Database;

      this.activeDatabase =
        this.activeDatabase ||
        (title.some((object) => object.plain_text === "Active Tasks") ? id : "");

      this.mainDatabase =
        this.mainDatabase || (title.some((object) => object.plain_text === "Main Tasks") ? id : "");
    }
  };

  /**
   * Finds a list of "main tasks" that have changed since the last read.
   *
   * @returns {Promise<Page[]>} - A list of "main tasks".
   */
  findTasksToUpdate = async (): Promise<Page[]> => {
    const tasks = await notion.databases.query({
      database_id: this.mainDatabase,
    });

    return tasks.results.filter((task) => {
      if (!this.existingMainTasks[task.id]) {
        this.existingMainTasks[task.id] = extractMainTaskProperties(task);
        return true;
      }

      // We ignore changes to the list of associated "active tasks"
      const existingProperties = {
        ...this.existingMainTasks[task.id],
        activeTasks: undefined,
      };

      const currentProperties = {
        ...extractMainTaskProperties(task),
        activeTasks: undefined,
      };

      // We use a deep equality to check for changes because last edit times from the
      // Notion API are rounded to the nearest minute rather than exact time.
      return !isEqual(existingProperties, currentProperties);
    });
  };

  /**
   * Creates new "active tasks" for every "main task" that has been updated on Notion.
   *
   * @todo Use pagination in the event that there are a lot of existing tasks.
   */
  updateTasks = async (): Promise<void> => {
    this.lock = true;
    const tasks = await this.findTasksToUpdate();

    for (const task of tasks) {
      // We're using the information from our Notion as our source of truth
      // This prevents having to sync a ton of tasks when this service restarts
      const existingTasks = (
        await notion.databases.query({
          database_id: this.activeDatabase,
          filter: {
            property: "Associated Task",
            relation: {
              contains: task.id,
            },
          },
        })
      ).results.map((result) => extractActiveTaskProperties(result));

      const properties = extractMainTaskProperties(task);
      const activeTasks = convertMainTaskToActiveTasks(properties);

      const tasksToKeep = activeTasks
        .map((activeTask, index) => {
          const match = existingTasks.find((existing) => compareDates(activeTask, existing));
          if (match) {
            return { id: match.id, index, properties: buildActiveTaskProperties(activeTask) };
          }
        })
        .filter((task) => Boolean(task)) as { id: string; index: number; properties: any }[];

      // eslint-disable-next-line unicorn/no-array-reduce
      const tasksToUpdate = existingTasks.reduce(
        (accumulator: { id: string; index: number; properties: any }[], existing) => {
          const nonMatch = activeTasks.findIndex(
            (activeTask, index) =>
              !compareDates(activeTask, existing) &&
              tasksToKeep.every(({ index: taskIndex }) => taskIndex !== index) &&
              accumulator.every(({ index: taskIndex }) => taskIndex !== index)
          );
          const inTasksToKeep = tasksToKeep.find(({ id }) => existing.id === id);

          // Find an active task that has the doesn't same date as the existing one
          if (nonMatch >= 0 && !inTasksToKeep) {
            return [
              ...accumulator,
              {
                id: existing.id,
                index: nonMatch,
                properties: buildActiveTaskProperties(activeTasks[nonMatch]),
              },
            ];
          }

          return accumulator;
        },
        []
      );

      const tasksToCreate =
        existingTasks.length < activeTasks.length
          ? activeTasks.filter(
              (_, index) =>
                tasksToKeep.every(({ index: taskIndex }) => index !== taskIndex) &&
                tasksToUpdate.every(({ index: taskIndex }) => index !== taskIndex)
            )
          : [];

      const tasksToDelete =
        existingTasks.length > activeTasks.length
          ? existingTasks.filter(
              (existing) =>
                tasksToKeep.every(({ id }) => id !== existing.id) &&
                tasksToUpdate.every(({ id }) => id !== existing.id)
            )
          : [];

      for (const existing of tasksToDelete) {
        deleteDatabasePage(existing.id);
      }

      for (const activeTask of tasksToCreate) {
        const taskToCreate = buildActiveTaskProperties(activeTask);
        createActiveTask(this.activeDatabase, taskToCreate);
      }

      for (const { id, properties } of tasksToUpdate) {
        updateActiveTask(id, properties);
      }

      this.existingMainTasks[task.id] = extractMainTaskProperties(task);
    }

    this.lock = false;
  };
}
