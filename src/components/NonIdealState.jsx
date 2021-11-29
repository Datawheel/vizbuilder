import React from "react";

const NonIdealState = props => 
<div className="vizbuilder-nonidealstate">
  {props.nonIdealStateImg && <img className="vizbuilder-nonidealstate-img" src={props.nonIdealStateImg}/>}
  <h1 className="vizbuilder-nonidealstate-header">
    {props.nonIdealStateHeaderText || "No results"}
  </h1>
  {props.nonIdealStateSubtitleText && 
    <p className="vizbuilder-nonidealstate-subtitle">
      {props.nonIdealStateSubtitleText}
    </p>
  }
</div>;

export default NonIdealState;
