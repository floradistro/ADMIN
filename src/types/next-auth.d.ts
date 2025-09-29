import "next-auth";

declare module "next-auth" {
  interface User {
    username?: string;
    roles?: string[];
    capabilities?: string[];
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      roles?: string[];
      capabilities?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    roles?: string[];
    capabilities?: string[];
  }
}