import { Database } from "@notionhq/client/build/src/api-types";
import { isEqual } from "lodash";

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
  private existingTasks: Record<
    string,
    { mainTask: MainTaskProperties; activeTasks: ActiveTaskProperties[] }
  > = {};
  private mainDatabase: string;
  private activeDatabase: string;
  public lock = false;

  constructor() {
    if (!this.mainDatabase || !this.activeDatabase) {
      this.findDatabasesToUse();
    }
  }

  resyncTasks = async (): Promise<void> => {
    const activeTasks = await notion.databases.query({
      database_id: this.activeDatabase,
    });

    const mainTasks = await notion.databases.query({
      database_id: this.mainDatabase,
    });

    console.log("synced");
    for (const main of mainTasks.results) {
      this.existingTasks[main.id] = {
        mainTask: extractMainTaskProperties(main),
        activeTasks: activeTasks.results
          .map((active) => extractActiveTaskProperties(active))
          .filter(({ mainTask }) => mainTask === main.id),
      };
    }
  };

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

    await this.resyncTasks();
  };

  findTasksToUpdate = async () => {
    const tasks = await notion.databases.query({
      database_id: this.mainDatabase,
    });

    return tasks.results.filter((task) => {
      if (!this.existingTasks[task.id]?.mainTask) {
        this.existingTasks[task.id] = {
          mainTask: extractMainTaskProperties(task),
          activeTasks: [],
        };
        return true;
      }

      // We use a deep equality to check for changes because last edit times from the
      // Notion API are rounded to the nearest minute rather than exact time.
      return !isEqual(task, this.existingTasks[task.id].mainTask);
    });
  };

  updateTasks = async (): Promise<void> => {
    this.lock = true;
    const tasks = await this.findTasksToUpdate();

    // immutability gang
    for (const task of tasks) {
      const properties = extractMainTaskProperties(task);
      const activeTasks = convertMainTaskToActiveTasks(properties);

      const tasksToKeep = activeTasks
        .map((activeTask, index) => {
          const match = this.existingTasks[task.id].activeTasks.find((existing) =>
            compareDates(activeTask, existing)
          );
          if (match) {
            return { id: match.id, index, properties: buildActiveTaskProperties(activeTask) };
          }
        })
        .filter((task) => Boolean(task)) as { id: string; index: number; properties: any }[];

      const tasksToUpdate = this.existingTasks[task.id].activeTasks
        .map((existing) => {
          const nonMatch = activeTasks.findIndex(
            (activeTask, index) =>
              !compareDates(activeTask, existing) &&
              tasksToKeep.some(({ index: taskIndex }) => taskIndex !== index)
          );
          const inTasksToKeep = tasksToKeep.find(({ id }) => existing.id === id);

          // Find an active task that has the doesn't same date as the existing one
          if (nonMatch && !inTasksToKeep) {
            return {
              id: existing.id,
              index: nonMatch,
              properties: buildActiveTaskProperties(activeTasks[nonMatch]),
            };
          }
        })
        .filter((task) => Boolean(task)) as { id: string; index: number; properties: any }[];

      const tasksToCreate =
        this.existingTasks[task.id].activeTasks.length < activeTasks.length
          ? activeTasks.filter(
              (_, index) =>
                tasksToKeep.every(({ index: taskIndex }) => index !== taskIndex) &&
                tasksToUpdate.every(({ index: taskIndex }) => index !== taskIndex)
            )
          : [];

      const tasksToDelete =
        this.existingTasks[task.id].activeTasks.length > activeTasks.length
          ? this.existingTasks[task.id].activeTasks.filter(
              (existing) =>
                tasksToKeep.every(({ id }) => id !== existing.id) &&
                tasksToUpdate.every(({ id }) => id !== existing.id)
            )
          : [];

      for (const existing of tasksToDelete) {
        deleteDatabasePage(existing.id);
      }

      const promisedPages = [
        ...tasksToCreate.map(async (activeTask) => {
          const taskToCreate = buildActiveTaskProperties(activeTask);
          return await createActiveTask(this.activeDatabase, taskToCreate);
        }),
        ...tasksToUpdate.map(async ({ id, properties }) => await updateActiveTask(id, properties)),
        ...(tasksToKeep.map(async ({ id }) =>
          this.existingTasks[task.id].activeTasks.find((existing) => existing.id === id)
        ) as Promise<ActiveTaskProperties>[]),
      ];

      const settledPages = await Promise.allSettled(promisedPages);

      const pages = (
        settledPages.filter(
          (page) => page.status === "fulfilled"
        ) as PromiseFulfilledResult<ActiveTaskProperties>[]
      ).map(({ value }) => value);

      this.existingTasks[task.id].activeTasks = pages;
    }

    this.lock = false;
  };
}
