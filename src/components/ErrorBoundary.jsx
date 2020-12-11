import React, {Component} from "react";
import {TranslationConsumer} from "../toolbox/useTranslation";
import {Button} from "./Button";
import {IssueButton} from "./IssueButton";

export class ErrorBoundary extends Component {
  static getDerivedStateFromError(error) {
    return {error: error.message};
  }

  state = {
    message: "",
    name: ""
  };

  clearError = () => this.setState({error: undefined});

  render() {
    const {message, name} = this.state;

    if (!message) {
      return this.props.children;
    }

    return (
      <TranslationConsumer>
        {({translate: t}) =>
          <div className="chart-card error">
            <div className="wrapper">
              <h3>{t("error.title")}</h3>
              <p>{t("error.detail")}</p>
              <p>{t("error.message", {message})}</p>
              <p className="actions">
                <Button
                  onClick={this.clearError}
                  primary
                  text={t("action_retry")}
                />
                <IssueButton error={name} message={message} />
              </p>
            </div>
          </div>
        }
      </TranslationConsumer>
    );
  }
}
