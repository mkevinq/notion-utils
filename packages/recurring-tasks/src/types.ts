type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type CreateActiveTaskProperties = Omit<Optional<ActiveTaskProperties, "status" | "time">, "id">;

interface ActiveTaskProperties {
  id: string;
  name: string;
  mainTask: string;
  status: string;
  time: boolean;
  tags?: string[];
  start?: Date;
  end?: Date;
}

interface MainTaskProperties {
  id: string;
  name: string;
  time: boolean;
  activeTasks: string[];
  recurrenceStart?: Date;
  recurrenceEnd?: Date;
  occurrenceCrons?: string[];
  resetCrons?: string[];
  duration?: number;
  tags?: string[];
  categories?: string[];
}
