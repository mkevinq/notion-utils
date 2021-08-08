# recurring-tasks

Easily create recurring tasks using a cron schedule expression.

## Example

![image](https://user-images.githubusercontent.com/33074023/128647956-064ee59d-65b2-4b61-85ed-bf97c99fa370.png)

This creates a 90-minute lecture that will occur every Monday and Tuesday at
5:30PM, starting on June 1st and ending on June 29th.

## Usage: Preparation

This service requires two databases to function. It needs a "Main Tasks"
database, and an "Active Tasks" database.

### Main Tasks Database

This is where you will define the tasks that need to re-occur. You can also
create non-reoccuring tasks by omitting a value from "Occurrence Crons" and
simply setting the "Recurrence Period" as if it were a normal task.

This database needs the following properties:

- Recurrence Period (Date)
- Occurrence Crons (Text)
- Reset Crons (Text)
- Duration (Minutes) (Number)
- Related Active Tasks (Relation)

### Active Tasks Database

This is where the re-occuring tasks will appear. Every occurrence of a task
will appear as it's own page.

This database needs the following properties:

- When (Date)
- Associated Task (Relation)

## Usage: Creating a reoccuring task

To create a reoccuring task, you need to set the Occurrence Crons, and the
Recurrence Period.

Occurrence Crons defines when the task occurs. This should be clear if you
know how to read a cron.

Example: `30 17 * * 1` means that the task occurs every Monday at 5:30PM.

Recurrence Period defines the period in which all the occurrences will fall
under.

Example: A recurrence period of June 1st to June 30th with the above cron will
show these occurrences in a calendar:

![image](https://user-images.githubusercontent.com/33074023/128648286-69debce9-3305-475c-b95d-0439a78f9d09.png)

## Usage: Creating a one-time task

You can simply omit the "Occurrence Crons" to create a one-time task.

This will treat the "Recurrence Period" as the time allocated for the task.

For example: A recurrence period of June 1st @ 4:30PM to June 1st @ 5:30PM
will create an hour-long task on June 1st starting at 4:30PM.
