import { CircleCheck } from "lucide-react";

export function SavedNotice({ message }: { message: string }) {
  return (
    <p role="status" className="flex items-center gap-2 rounded-md bg-success-soft px-3 py-2 text-sm font-medium text-success">
      <CircleCheck className="size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
