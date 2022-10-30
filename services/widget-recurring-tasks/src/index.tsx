import { Client } from "@notionhq/client/build/src";
import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import TaskUI from "./TaskUI";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const params = new URLSearchParams(window.location.search);
const token = params.get("token") ?? undefined;

const client = new Client({
  auth: token,
  baseUrl: process.env.API_PROXY_URL,
});

root.render(
  <React.StrictMode>
    <TaskUI client={client} />
  </React.StrictMode>
);
