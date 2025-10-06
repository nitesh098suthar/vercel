import type { SegmentParams } from "next/dist/server/app-render/types";

declare module "next" {
  // Align with Next.js 15 RouteContext typing
  export interface RouteContext {
    params: Promise<SegmentParams>;
  }

  // If you rely on these elsewhere, align them too
  export interface PageProps {
    params: Promise<SegmentParams>;
  }

  export interface LayoutProps {
    params: Promise<SegmentParams>;
    children: React.ReactNode;
  }
}
