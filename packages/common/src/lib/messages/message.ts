export interface IMessage {
  topic: string;
  value: string;
  offset: number;
  partition: number;
  highWaterOffset: number;
  key: number;
}
