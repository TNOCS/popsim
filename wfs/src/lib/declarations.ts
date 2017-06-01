declare module '*.json' {
  const value: any;
  export default value;
}

interface IMessage {
  topic: string;
  value: string;
  offset: number;
  partition: number;
  highWaterOffset: number;
  key: number;
}
