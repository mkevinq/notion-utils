import dotenv from "dotenv";

dotenv.config();

import TaskRecurrer from "./task-recurrer";

const app = new TaskRecurrer();

(async () => {
  setInterval(() => {
    if (!app.lock) {
      app.updateTasks();
    }
  }, Number(process.env.INTERVAL) || 5000);
})();
