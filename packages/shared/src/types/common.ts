export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
