export type RequestWithUser = {
  user?: {
    userId: string;
    username: string;
  };
  headers: Record<string, string | string[] | undefined>;
};
