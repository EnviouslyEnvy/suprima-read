import type { Metadata } from "next";
import Workspace from "@/components/workspace";
export const metadata: Metadata = { title: "Suprima - Workspace" };
export default function WorkspacePage() {
  return <Workspace />;
}
