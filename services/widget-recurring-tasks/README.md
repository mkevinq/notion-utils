# recurring-tasks

Easily create recurring tasks using a cron schedule expression.

## Example

![image](https://user-images.githubusercontent.com/33074023/198890762-5acb5ed0-44fb-4ec1-b269-0496a986b475.png)

This creates a 90-minute lecture that will occur every Monday and Tuesday at
5:30PM, starting on June 1st and ending on June 29th.

## Usage: Preparation

- This service requires a database with at least one date property.
- You need to set up a proxy for the Notion API (Notion API doesn't accept
  API calls from the browser directly). After setting one up, copy the link
  to [.env.sample](./.env.sample), and rename it to `.env`.

To open the widget, you need to add your integration token as a query param.
If you're running this locally, this may look like:

```
https://localhost:8080/?token=secret_iJIjdivjJUIOWE23498
```

Note: Ideally we'd just do OAuth instead of this, but I don't plan on making
this a public integration yet. For now, I'm keeping it as an integration for
you to self-host.

## Options

- Target Database: the database where your pages will be created
- Target Proeprty: the date property that will be used for each occurrence
- Recurrence Period: the period in which the tasks will occur
- Include Time: Includes the specific time that each task occurs. When
  unchecked, the tasks won't have a time associated with it (like Notion's
  "Include time" option on the date property).
- Duration: How long each task is. (only effective if "Include Time" is
  checked)
- Occurrences: cron that defines how often a task occurs within the recurrence
  period. Multiple can be entered.

## Usage: Creating a reoccuring task

To create a reoccuring task, you need to choose a "Target Database". After
choosing the target database, you need to choose the "Target Property". This
is the property where the date will be set for each occurence.

Then, you need to define the "Recurrence Period", which is the period in which
the tasks will occur.

After that, you need to define the cron, which defines how often the task
occurs within the recurrence period.

Example: `30 13 * * 1` means that the task occurs every Monday at 1:30PM.
`30 13 * * 2` means that the task occurs every Tuesday at 1:30PM. With a
recurrence period of June 1st to June 30th, this will create these pages in
your database (calendar view shown):

![image](https://user-images.githubusercontent.com/33074023/128648286-69debce9-3305-475c-b95d-0439a78f9d09.png)
