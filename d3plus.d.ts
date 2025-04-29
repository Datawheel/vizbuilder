declare module "d3plus-common" {
  export function assign<T extends {}, U>(target: T, ...obj: Partial<U>[]): target is T & U;
}
