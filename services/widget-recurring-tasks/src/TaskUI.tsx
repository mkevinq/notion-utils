import Client from "@notionhq/client/build/src/Client";
import { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { FormEventHandler, useEffect, useRef, useState } from "react";

import { buildPageProperties } from "./utils/active-task";
import { generateTasks } from "./utils/main-task";

interface TaskUIProps {
  client: Client;
}

// i hate this
// https://stackoverflow.com/questions/43242440/javascript-regular-expression-for-unicode-emoji
const emojiRegex =
  /^[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}\u{200d}]*/u;

/**
 * Main component for the task creation UI.
 *
 * @param props - React component props.
 * @param props.client - Instance of a client from the Notion API SDK.
 * @returns Rendered react component.
 */
const TaskUI = ({ client }: TaskUIProps) => {
  const [databasesLoading, setDatabasesLoading] = useState(true);
  const [error, setError] = useState(false);

  const [databaseOptions, setDatabaseOptions] = useState<Array<DatabaseObjectResponse>>([]);
  const databaseMap = useRef<Record<string, DatabaseObjectResponse>>({});

  const [database, setDatabase] = useState<DatabaseObjectResponse>();
  const [datePropertyId, setDatePropertyId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [applyTime, setTimeOption] = useState(false);
  const [recurrenceStart, setRecurrenceStart] = useState("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [occurrences, setOccurrences] = useState<Array<{ id: string; value: string }>>([
    { id: crypto.randomUUID(), value: "" },
  ]);
  const [duration, setDuration] = useState("0");

  const [creationState, setCreationState] = useState<"creating" | "done" | "idle">("idle");

  useEffect(() => {
    setDatabasesLoading(true);

    /**
     * Load databases from the integration.
     */
    const loadDatabases = async () => {
      databaseMap.current = {};

      // Load databases
      try {
        const response = await client.search({
          filter: {
            property: "object",
            value: "database",
          },
        });

        const candidates = response.results.filter(
          (result) =>
            result.object === "database" &&
            Object.values(result.properties).some((property) => {
              const type = property.type;
              if (type === "date") {
                databaseMap.current[result.id] = result as DatabaseObjectResponse;
                return true;
              }
              return false;
            })
        ) as Array<DatabaseObjectResponse>;

        setDatabaseOptions(candidates);
        setDatabase(candidates[0]);
        setDatePropertyId(
          Object.values(candidates[0].properties).find((property) => property.type === "date")
            ?.id ?? ""
        );
        setDatabasesLoading(false);
      } catch (err) {
        setError(true);
      }
    };

    loadDatabases();
  }, [client]);

  // Side effect for when a database changes.
  // Select the first available date property
  // useEffect(() => {
  //   if (database) {
  //     database.properties[0].id;
  //   }
  // }, [database]);

  /**
   * Validate the form inputs, and then create the objects in the database.
   *
   * @param event - Event that occurs when the form is submitted.
   */
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!database) {
      return;
    }

    const tasks = generateTasks({
      name: taskName.trim(),
      recurrenceStart: new Date(recurrenceStart),
      recurrenceEnd: new Date(recurrenceEnd),
      occurrenceCrons: occurrences.map((occurrence) => occurrence.value),
      duration: Math.max(parseInt(duration), 0) || undefined,
    });

    setCreationState("creating");

    for (const task of tasks) {
      // This is really just a crappy solution for now to add emojis to titles
      // Once its possible to copy emojis across rows in the Notion UI, this will be removed.
      const emojiMatches = task.name.match(emojiRegex);
      task.name = task.name.replace(emojiRegex, "").trim();
      await client.pages.create({
        ...(emojiMatches
          ? {
              icon: {
                type: "emoji",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                emoji: emojiMatches[0] as any,
              },
            }
          : {}),
        parent: {
          database_id: database.id,
        },
        properties: buildPageProperties(task, datePropertyId, applyTime),
      });
    }

    setCreationState("done");

    setTimeout(() => {
      setCreationState("idle");
    }, 5000);
  };

  return (
    <div className="w-1/2 mx-auto font-sans text-gray-800">
      <form className="grid grid-cols-2 gap-2 items-center" id="main-form" onSubmit={handleSubmit}>
        {databasesLoading ? (
          <p>
            {!new URLSearchParams(window.location.search).get("token")
              ? "Please enter your integration token as a parameter in the URL."
              : error
              ? "Couldn't get databases from your workspace. Is the token correct?"
              : "Loading..."}
          </p>
        ) : (
          <>
            <label htmlFor="target-db">Target database:</label>
            <select
              className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
              onChange={(event) => {
                setDatabase(() => {
                  const newDatabase = databaseMap.current[event.target.value];
                  setDatePropertyId(
                    Object.values(newDatabase.properties).filter((p) => p.type === "date")[0].id
                  );
                  return newDatabase;
                });
              }}
              value={database?.id}
            >
              {databaseOptions.map((database) => (
                <option key={database.id} value={database.id}>
                  {`${database.icon?.type === "emoji" ? database.icon.emoji : ""} ${database.title
                    .map((text) => text.plain_text)
                    .join(" ")}`}
                </option>
              ))}
            </select>

            {database && (
              <>
                <label htmlFor="target-prop">Target property:</label>
                <select
                  className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                  onChange={(event) => {
                    setDatePropertyId(event.target.value);
                  }}
                  value={datePropertyId}
                >
                  {Object.values(database.properties)
                    .filter((property) => property.type === "date")
                    .map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                </select>

                <label htmlFor="task-name">Task name:</label>
                <input
                  required
                  className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                  id="task-name"
                  name="task-name"
                  type="text"
                  placeholder="Empty"
                  onChange={(event) => {
                    setTaskName(event.target.value);
                  }}
                />

                <label htmlFor="recurrence-start">Recurrence start:</label>
                <input
                  required
                  className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                  id="recurrence-start"
                  name="recurrence-start"
                  type="date"
                  onChange={(event) => {
                    setRecurrenceStart(event.target.value);
                  }}
                />

                <label htmlFor="recurrence-end">Recurrence end:</label>
                <input
                  required
                  className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                  id="recurrence-end"
                  name="recurrence-end"
                  type="date"
                  onChange={(event) => {
                    setRecurrenceEnd(event.target.value);
                  }}
                />

                <label htmlFor="use-time">Include time:</label>
                <input
                  className="w-full px-2 h-8"
                  id="use-time"
                  name="use-time"
                  type="checkbox"
                  checked={applyTime}
                  onChange={() => {
                    setTimeOption(!applyTime);
                  }}
                />

                <label htmlFor="duration">Duration (minutes):</label>
                <input
                  className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="Empty (optional)"
                  onChange={(event) => {
                    setDuration(event.target.value);
                  }}
                />

                <label className="py-0.5 self-start" htmlFor="crons">
                  Occurrences (cron expression)
                </label>
                <div className="w-full">
                  {occurrences.map((occurrence, index) => (
                    <div key={occurrence.id} className="flex flex-row w-full mb-2">
                      <input
                        required
                        className="w-full px-2 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                        id="crons"
                        name="crons"
                        type="text"
                        key={index}
                        onChange={(event) => {
                          const newOccurrences = [...occurrences];
                          newOccurrences[index] = {
                            id: occurrence.id,
                            value: event.target.value,
                          };
                          setOccurrences(newOccurrences);
                        }}
                      />
                      {index !== 0 && (
                        <input
                          className="w-8 ml-1 py-0.5 border-2 focus:rounded-md focus:drop-shadow-xl focus:outline-0"
                          type="button"
                          value="-"
                          onClick={() => {
                            setOccurrences(occurrences.filter((_, i) => i !== index));
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <input
                    className="w-full text-slate-400 hover:bg-gray-100"
                    type="button"
                    value="+"
                    onClick={() => {
                      setOccurrences([...occurrences, { id: crypto.randomUUID(), value: "" }]);
                    }}
                  />
                </div>
              </>
            )}
          </>
        )}
      </form>
      <input
        className="w-full mx-auto mt-8 text-white bg-blue-400 drop-shadow-md rounded-sm py-2"
        id="submit"
        type="submit"
        value={
          creationState === "creating"
            ? "Creating tasks..."
            : creationState === "done"
            ? "Tasks created!"
            : "Create tasks"
        }
        form="main-form"
      />
    </div>
  );
};

export default TaskUI;
