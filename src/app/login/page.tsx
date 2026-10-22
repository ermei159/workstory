import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "./actions";
import styles from "./login.module.css";

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <Suspense fallback={<LoginForm/>}><LoginContent searchParams={searchParams}/></Suspense>;
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm error={error}/>;
}

function LoginForm({ error }: { error?: string }) {
  return <main className={styles.wrap}><section className={styles.card}><Link className={styles.brand} href="/"> <i>w.</i> workstory</Link><div className={styles.kicker}>WELCOME BACK</div><h1>登录你的工作空间</h1><p>把计划变成进度，把进度变成成果。</p>{error && <div className={styles.error} role="alert">{error}</div>}<form action={signIn}><label>邮箱地址<input name="email" type="email" autoComplete="email" placeholder="name@example.com" required/></label><label>密码<input name="password" type="password" autoComplete="current-password" placeholder="输入密码" required/></label><button type="submit">登录</button></form><small>账号由项目管理员在 Supabase Authentication 中创建。</small></section><footer>WORKSTORY · 项目与任务进度管理</footer></main>;
}
