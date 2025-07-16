import React, {Component} from "react";

export interface ErrorContentProps {
  errorClass: string;
  errorMessage: string;
  onClear: () => void;
}

interface State {
  errorClass: string;
  errorMessage: string;
}

interface Props {
  children: React.ReactNode;
  ErrorContent: React.ComponentType<ErrorContentProps>;
}

export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return {errorMessage: error.message, errorClass: error.name};
  }

  state = {
    errorClass: "",
    errorMessage: "",
  };

  clearError = () => this.setState({errorMessage: "", errorClass: ""});

  render() {
    const {errorMessage, errorClass} = this.state;

    if (!errorMessage) return this.props.children;

    const {ErrorContent} = this.props;
    return (
      <ErrorContent
        errorClass={errorClass}
        errorMessage={errorMessage}
        onClear={this.clearError}
      />
    );
  }
}
