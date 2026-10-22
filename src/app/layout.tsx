import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workstory — 项目与任务进度管理",
  description: "为自己的工作流设计阶段、任务与进度视图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
