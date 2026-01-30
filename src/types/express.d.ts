declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone: string | null;
        createdAt: Date;
      };
      /** Set by validate() middleware; use instead of body when validation ran on body */
      validatedBody?: unknown;
      /** Set by validate() middleware; use instead of query when validation ran on query */
      validatedQuery?: unknown;
      /** Set by validate() middleware; use instead of params when validation ran on params */
      validatedParams?: unknown;
    }
  }
}

export {};
