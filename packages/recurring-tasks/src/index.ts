import dotenv from "dotenv";

dotenv.config();

import { notion, deleteDatabasePage } from "./utils/notion";
import { Database } from "@notionhq/client/build/src/api-types";
import { extractMainTaskProperties, convertMainTaskToActiveTasks } from "./utils/main-task";
import {
  createActiveTask,
  updateActiveTask,
  buildActiveTaskProperties,
  compareDates,
} from "./utils/active-task";

class TaskRecurrer {
  private mainTaskUpdateDates: Record<string, Date> = {};
  private existingActiveTasks: Record<string, ActiveTaskProperties[]> = {};
  private mainDatabase: string;
  private activeDatabase: string;
  public lock = false;

  constructor() {
    if (!this.mainDatabase || !this.activeDatabase) {
      this.findDatabasesToUse();
    }
  }

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

  findTasksToUpdate = async () => {
    const tasks = await notion.databases.query({
      database_id: this.mainDatabase,
    });

    return tasks.results.filter((task) => {
      const existingTask = this.mainTaskUpdateDates?.[task.id];
      if (!existingTask) {
        this.mainTaskUpdateDates[task.id] = new Date(task.last_edited_time);
        this.existingActiveTasks[task.id] = [];
        return true;
      }
      return new Date(task.last_edited_time) > this.mainTaskUpdateDates[task.id];
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
          const match = this.existingActiveTasks[task.id].find((existing) =>
            compareDates(activeTask, existing)
          );
          if (match) {
            return { id: match.id, index, properties: buildActiveTaskProperties(activeTask) };
          }
        })
        .filter((task) => Boolean(task)) as { id: string; index: number; properties: any }[];

      const tasksToUpdate = this.existingActiveTasks[task.id]
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
        this.existingActiveTasks[task.id].length < activeTasks.length
          ? activeTasks.filter(
              (_, index) =>
                tasksToKeep.every(({ index: taskIndex }) => index !== taskIndex) &&
                tasksToUpdate.every(({ index: taskIndex }) => index !== taskIndex)
            )
          : [];

      const tasksToDelete =
        this.existingActiveTasks[task.id].length > activeTasks.length
          ? this.existingActiveTasks[task.id].filter(
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
          this.existingActiveTasks[task.id].find((existing) => existing.id === id)
        ) as Promise<ActiveTaskProperties>[]),
      ];

      const settledPages = await Promise.allSettled(promisedPages);

      const pages = (
        settledPages.filter(
          (page) => page.status === "fulfilled"
        ) as PromiseFulfilledResult<ActiveTaskProperties>[]
      ).map(({ value }) => value);

      this.existingActiveTasks[task.id] = pages;

      this.mainTaskUpdateDates[task.id] = new Date(task.last_edited_time);
    }

    this.lock = false;
  };
}

const app = new TaskRecurrer();

setInterval(() => {
  if (!app.lock) {
    app.updateTasks();
  }
}, Number(process.env.INTERVAL) || 5000);
