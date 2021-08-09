import dotenv from "dotenv";

dotenv.config();

import TaskRecurrer from "./task-recurrer";

(async () => {
  const app = new TaskRecurrer();

  await app.initialize();

  setInterval(async () => {
    if (!app.lock) {
      try {
        await app.updateTasks();
      } catch (error) {
        console.log("Error occurred during an update:", error);
      }
    }
  }, Number(process.env.INTERVAL) || 10_000);
})();
