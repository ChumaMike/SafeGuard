/** RFC 9457 problem details, used by server actions and route handlers alike. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export class Problem extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, title: string, detail?: string, errors?: Record<string, string[]>) {
    super(title);
    this.name = "Problem";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }

  toJSON(): ProblemDetails {
    return {
      type: "about:blank",
      title: this.title,
      status: this.status,
      ...(this.detail ? { detail: this.detail } : {}),
      ...(this.errors ? { errors: this.errors } : {}),
    };
  }
}

export const problem = (status: number, title: string, detail?: string) => new Problem(status, title, detail);

export function isProblem(e: unknown): e is Problem {
  return e instanceof Problem || (typeof e === "object" && e !== null && (e as { name?: string }).name === "Problem");
}

export function toProblemDetails(e: unknown): ProblemDetails {
  if (isProblem(e)) return (e as Problem).toJSON();
  return { type: "about:blank", title: "Something went wrong", status: 500 };
}
