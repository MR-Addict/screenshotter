export type Message<T = undefined> = {
  action: "toggle" | "screenshot";
  data?: T;
};

export type NodeDimension = {
  x: number;
  y: number;
  width: number;
  height: number;
};
