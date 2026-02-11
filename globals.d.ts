declare var global: any;

declare module "d3plus-common" {
  export const RESET: string;

  export function assign<T extends {}, U>(
    target: T,
    ...obj: Partial<U>[]
  ): target is T & U;
}
