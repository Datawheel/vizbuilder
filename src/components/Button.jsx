import cls from "classnames";
import React from "react";

export const Button = props =>
  <button
    className={cls("bp3-button", props.className, {"bp3-intent-primary": props.primary})}
    onClick={props.onClick}
    type="button"
  >
    {props.text || props.children}
  </button>;
