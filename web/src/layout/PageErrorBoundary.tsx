import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { buttonClass } from "../design-system/Button";
import { EmptyState } from "../design-system/Surface";
import { messages } from "../i18n/locale";

interface PageErrorBoundaryProps {
  resetKey: string;
  children: ReactNode;
}

interface PageErrorBoundaryState {
  failedKey: string | null;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { failedKey: null };

  static getDerivedStateFromError(): Partial<PageErrorBoundaryState> {
    return { failedKey: "pending" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Page crashed", error, errorInfo.componentStack);
    this.setState({ failedKey: this.props.resetKey });
  }

  render() {
    const { failedKey } = this.state;
    const failedHere = failedKey === "pending" || failedKey === this.props.resetKey;
    if (!failedHere) return this.props.children;
    const t = messages();
    return (
      <EmptyState
        icon={<TriangleAlert className="size-7" />}
        title={t.pageError.title}
        description={t.pageError.description}
        action={<a href="#/" className={buttonClass("primary", "md", "mt-2")}>{t.common.backHome}</a>}
      />
    );
  }
}
