export interface ActiveTaskProperties {
  name: string;
  start: Date;
  end?: Date;
}

export interface MainTaskProperties {
  name: string;
  recurrenceStart: Date;
  recurrenceEnd: Date;
  occurrenceCrons: string[];
  duration?: number;
}
