import dotenv from "dotenv";

dotenv.config();

import TaskRecurrer from "./task-recurrer";

(async () => {
  const app = new TaskRecurrer();

  await app.initialize();

  setInterval(() => {
    if (!app.lock) {
      app.updateTasks();
    }
  }, Number(process.env.INTERVAL) || 5000);
})();
