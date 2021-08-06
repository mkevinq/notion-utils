export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateActiveTaskProperties = Omit<
  Optional<ActiveTaskProperties, "status" | "time">,
  "id"
>;

export interface ActiveTaskProperties {
  id: string;
  name: string;
  mainTask: string;
  status: string;
  time: boolean;
  tags?: string[];
  start?: Date;
  end?: Date;
}

export interface MainTaskProperties {
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
