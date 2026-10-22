"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Task = { id: number | string; title: string; stage: string; date: string; priority: "高" | "中" | "低"; done: boolean; owner: string; tag: string };
type Phase = { id: string; name: string; position: number; start_date?: string | null; due_date?: string | null };
type DbProject = { id: string; name: string; template_id?: string | null; phases?: Phase[]; tasks?: { id: string; title: string; phase_id: string | null; status: string; priority: string; due_date: string | null; assignee: string | null }[] };
function relativeDate(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const initialTasks: Task[] = [
  { id: 1, title: "确定研究方向与核心问题", stage: "选题与资料收集", date: relativeDate(-4), priority: "高", done: true, owner: "我", tag: "研究" },
  { id: 2, title: "整理近五年相关文献", stage: "开题", date: relativeDate(5), priority: "中", done: false, owner: "我", tag: "文献" },
  { id: 3, title: "完成开题报告初稿", stage: "开题", date: relativeDate(17), priority: "高", done: false, owner: "我", tag: "写作" },
  { id: 4, title: "设计研究方案与技术路线", stage: "方案与中期检查", date: relativeDate(28), priority: "中", done: false, owner: "我", tag: "规划" },
  { id: 5, title: "完成中期检查材料", stage: "方案与中期检查", date: relativeDate(45), priority: "低", done: false, owner: "我", tag: "检查" },
  { id: 6, title: "搭建核心功能原型", stage: "核心工作", date: relativeDate(82), priority: "高", done: false, owner: "我", tag: "开发" },
  { id: 7, title: "撰写论文初稿并配图", stage: "论文初稿", date: relativeDate(118), priority: "中", done: false, owner: "我", tag: "写作" },
  { id: 8, title: "根据意见修改并查重", stage: "修改与定稿", date: relativeDate(147), priority: "中", done: false, owner: "我", tag: "修改" },
  { id: 9, title: "制作答辩演示文稿", stage: "答辩准备", date: relativeDate(163), priority: "低", done: false, owner: "我", tag: "答辩" },
  { id: 10, title: "完成答辩与材料归档", stage: "答辩与归档", date: relativeDate(176), priority: "高", done: false, owner: "我", tag: "收尾" },
];
const stages = ["选题与资料收集", "开题", "方案与中期检查", "核心工作", "论文初稿", "修改与定稿", "答辩准备", "答辩与归档"];
const phasePlan = [{ start: -21, end: -4 }, { start: -3, end: 17 }, { start: 18, end: 45 }, { start: 46, end: 82 }, { start: 83, end: 118 }, { start: 119, end: 147 }, { start: 148, end: 163 }, { start: 164, end: 176 }];
const demoPhases: Phase[] = stages.map((name, position) => ({ id: `demo-${position}`, name, position, start_date: relativeDate(phasePlan[position].start), due_date: relativeDate(phasePlan[position].end) }));
const icons = ["◉", "▤", "◷"];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("毕业设计进度管理");
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [projectPhases, setProjectPhases] = useState<Phase[]>(demoPhases);
  const [phaseIds, setPhaseIds] = useState<Record<string, string>>({});
  const [phaseDates, setPhaseDates] = useState<Record<string, { start?: string | null; end?: string | null }>>({});
  const [timelineToday] = useState(() => {
    const [year, month, day] = initialTasks[0].date.split("-").map(Number);
    return new Date(year, month - 1, day + 4, 12);
  });
  const [view, setView] = useState("列表");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTemplate, setNewProjectTemplate] = useState("blank");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [newStage, setNewStage] = useState(stages[0]);
  const [showPhaseManager, setShowPhaseManager] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseStart, setNewPhaseStart] = useState("");
  const [newPhaseEnd, setNewPhaseEnd] = useState("");
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, { name: string; start: string; end: string }>>({});
  const [phaseError, setPhaseError] = useState("");
  const [activeStage, setActiveStage] = useState("全部阶段");
  const [showFilters, setShowFilters] = useState(false);
  const [activePriority, setActivePriority] = useState("全部优先级");
  const [activeStatus, setActiveStatus] = useState("全部状态");
  const [activeDeadline, setActiveDeadline] = useState("全部日期");
  const [today, setToday] = useState<Date | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => { setToday(new Date()); }, []);
  const hydrateProject = useCallback((project: DbProject) => {
    setProjectId(project.id);
    setProjectName(project.name);
    const loadedPhases = [...(project.phases ?? [])].sort((a, b) => a.position - b.position);
    setProjectPhases(loadedPhases);
    setPhaseIds(Object.fromEntries(loadedPhases.map((phase) => [phase.name, phase.id])));
    setPhaseDates(Object.fromEntries((project.phases ?? []).map((phase) => [phase.name, { start: phase.start_date, end: phase.due_date }])));
    setNewStage(loadedPhases[0]?.name ?? "");
    setActiveStage("全部阶段");
    setTasks((project.tasks ?? []).map((task) => ({ id: task.id, title: task.title, stage: loadedPhases.find((phase) => phase.id === task.phase_id)?.name ?? "未分阶段", date: task.due_date ?? "待安排", priority: task.priority === "high" ? "高" : task.priority === "low" ? "低" : "中", done: task.status === "completed", owner: task.assignee ?? "我", tag: "任务" })));
  }, []);
  useEffect(() => {
    fetch("/api/projects").then((response) => response.ok ? response.json() : null).then((payload: { data?: DbProject[] } | null) => {
      if (!payload) return;
      const loadedProjects = payload.data ?? [];
      setProjects(loadedProjects);
      if (loadedProjects[0]) hydrateProject(loadedProjects[0]);
      else {
        setProjectId(null); setProjectName("还没有项目"); setProjectPhases([]); setPhaseIds({}); setPhaseDates({}); setTasks([]); setNewStage("");
      }
    }).catch(() => undefined);
  }, [hydrateProject]);
  const selectProject = async (id: string) => {
    const response = await fetch("/api/projects");
    const payload = await response.json().catch(() => null) as { data?: DbProject[]; error?: string } | null;
    if (!response.ok || !payload) { flash(payload?.error ?? "项目读取失败，请重新登录后重试"); return; }
    const selected = payload?.data?.find((project) => project.id === id);
    if (!selected) { flash(payload.error ?? "找不到这个项目，请刷新页面后重试"); return; }
    setProjects(payload.data ?? []);
    hydrateProject(selected);
  };
  const currentStages = useMemo(() => projectPhases.map((phase) => phase.name), [projectPhases]);
  const completed = tasks.filter((task) => task.done).length;
  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesStage = activeStage === "全部阶段" || task.stage === activeStage;
    const matchesQuery = task.title.toLowerCase().includes(query.trim().toLowerCase());
    const matchesPriority = activePriority === "全部优先级" || task.priority === activePriority;
    const matchesStatus = activeStatus === "全部状态" || (activeStatus === "已完成" ? task.done : !task.done);
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(task.date) ? new Date(`${task.date}T00:00:00`) : null;
    const todayStart = today ? new Date(today) : null;
    todayStart?.setHours(0, 0, 0, 0);
    const nextWeek = todayStart ? new Date(todayStart) : null;
    nextWeek?.setDate(nextWeek.getDate() + 7);
    const matchesDeadline = activeDeadline === "全部日期" || (activeDeadline === "已逾期" ? Boolean(dueDate && !task.done && todayStart && dueDate < todayStart) : activeDeadline === "未来 7 天" ? Boolean(dueDate && todayStart && nextWeek && dueDate >= todayStart && dueDate <= nextWeek) : !dueDate);
    return matchesStage && matchesQuery && matchesPriority && matchesStatus && matchesDeadline;
  }), [tasks, activeStage, query, activePriority, activeStatus, activeDeadline, today]);
  const shortDate = (value: string) => value.match(/^\d{4}-\d{2}-\d{2}$/) ? value.slice(5).replace("-", ".") : value;
  const activeProject = projects.find((project) => project.id === projectId);
  const timeline = useMemo(() => projectPhases.flatMap((phase, index) => {
    const relativePlan = !projectId || Boolean(activeProject?.template_id);
    const start = phase.start_date ? new Date(`${phase.start_date}T12:00:00`) : relativePlan ? new Date(timelineToday) : null;
    const end = phase.due_date ? new Date(`${phase.due_date}T12:00:00`) : relativePlan ? new Date(timelineToday) : null;
    if (!phase.start_date && start) start.setDate(start.getDate() + (phasePlan[index]?.start ?? 0));
    if (!phase.due_date && end) end.setDate(end.getDate() + (phasePlan[index]?.end ?? 30));
    return start && end ? [{ stage: phase.name, start, end }] : [];
  }), [projectPhases, projectId, activeProject?.template_id, timelineToday]);
  const timelineStart = timeline.length ? new Date(Math.min(...timeline.map((phase) => phase.start.getTime()))) : (today ?? new Date(0));
  const timelineEnd = timeline.length ? new Date(Math.max(...timeline.map((phase) => phase.end.getTime()))) : timelineStart;
  const daysToTarget = timeline.length ? Math.max(0, Math.round((timelineEnd.getTime() - (today ?? timelineToday).getTime()) / 86400000)) : 0;
  const timelineSpan = Math.max(1, timelineEnd.getTime() - timelineStart.getTime());
  const formatTimelineDate = (date: Date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  const formatChineseDate = (date: Date) => `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  const monthTicks: { label: string; left: number }[] = timeline.length ? [{ label: `${timelineStart.getFullYear()}年${timelineStart.getMonth() + 1}月`, left: 0 }] : [];
  for (let tick = new Date(timelineStart.getFullYear(), timelineStart.getMonth() + 1, 1, 12); timeline.length && tick < timelineEnd; tick = new Date(tick.getFullYear(), tick.getMonth() + 1, 1, 12)) {
    monthTicks.push({ label: `${tick.getFullYear()}年${tick.getMonth() + 1}月`, left: (tick.getTime() - timelineStart.getTime()) / timelineSpan * 100 });
  }
  const todayPosition = ((today ?? timelineToday).getTime() - timelineStart.getTime()) / timelineSpan * 100;
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const createProject = async () => {
    if (!newProjectName.trim() || creatingProject) return;
    setCreatingProject(true);
    setProjectError("");
    try {
      const templateId = newProjectTemplate === "thesis" ? "10000000-0000-4000-8000-000000000001" : null;
      const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newProjectName.trim(), description: templateId ? "从毕业设计模板创建的项目。" : "", template_id: templateId }) });
      const payload = await response.json().catch(() => null) as { data?: DbProject; error?: string } | null;
      if (!response.ok || !payload?.data) throw new Error(payload?.error ?? (response.status === 401 ? "请先登录后再创建项目。" : "项目创建失败，请稍后重试。"));
      setProjects((all) => [payload.data!, ...all]);
      hydrateProject(payload.data);
      setShowNewProject(false);
      setNewProjectName("");
      flash("项目已创建并保存到 Supabase");
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "项目创建失败，请检查网络后重试。");
    } finally {
      setCreatingProject(false);
    }
  };
  const addTask = async () => {
    if (!newTitle.trim()) return;
    if (projectId) {
      const response = await fetch(`/api/projects/${projectId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle.trim(), phase_id: phaseIds[newStage] ?? null, due_date: newTaskDate || null, priority: "medium" }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { flash(payload?.error ?? "任务保存失败"); return; }
      setTasks((all) => [...all, { id: payload.data.id, title: payload.data.title, stage: newStage || "未分阶段", date: payload.data.due_date ?? "待安排", priority: "中", done: false, owner: "我", tag: "任务" }]);
    } else setTasks((all) => [...all, { id: Date.now(), title: newTitle.trim(), stage: newStage || "未分阶段", date: newTaskDate || "待安排", priority: "中", done: false, owner: "我", tag: "新任务" }]);
    setNewTitle(""); setNewTaskDate(""); setShowNew(false); flash(projectId ? "任务已保存到 Supabase" : "任务已添加到演示工作区");
  };
  const removeProject = async (project: DbProject) => {
    if (!window.confirm(`确定删除项目“${project.name}”吗？项目中的阶段、任务和自定义字段也会一起删除。`)) return;
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) { flash(payload?.error ?? "项目删除失败，请重试"); return; }
    const remaining = projects.filter((item) => item.id !== project.id);
    setProjects(remaining);
    if (project.id === projectId) {
      if (remaining[0]) hydrateProject(remaining[0]);
      else { setProjectId(null); setProjectName("还没有项目"); setProjectPhases([]); setPhaseIds({}); setPhaseDates({}); setTasks([]); setNewStage(""); }
    }
    flash("项目已删除");
  };
  const addPhase = async () => {
    if (!projectId || !newPhaseName.trim()) return;
    setPhaseError("");
    const response = await fetch(`/api/projects/${projectId}/phases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newPhaseName.trim(), position: projectPhases.length, start_date: newPhaseStart || null, due_date: newPhaseEnd || null }) });
    const payload = await response.json().catch(() => null) as { data?: Phase; error?: string } | null;
    if (!response.ok || !payload?.data) { setPhaseError(payload?.error ?? "阶段创建失败，请重试"); return; }
    const phase = payload.data;
    setProjectPhases((all) => [...all, phase]);
    setPhaseIds((all) => ({ ...all, [phase.name]: phase.id }));
    setPhaseDates((all) => ({ ...all, [phase.name]: { start: phase.start_date, end: phase.due_date } }));
    setNewStage(phase.name); setNewPhaseName(""); setNewPhaseStart(""); setNewPhaseEnd("");
  };
  const savePhase = async (phase: Phase) => {
    const draft = phaseDrafts[phase.id];
    if (!draft || !projectId) return;
    const response = await fetch(`/api/phases/${phase.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: draft.name.trim(), start_date: draft.start || null, due_date: draft.end || null }) });
    const payload = await response.json().catch(() => null) as { data?: Phase; error?: string } | null;
    if (!response.ok || !payload?.data) { setPhaseError(payload?.error ?? "阶段保存失败，请重试"); return; }
    const saved = payload.data;
    setProjectPhases((all) => all.map((item) => item.id === phase.id ? saved : item));
    setPhaseIds((all) => { const next = { ...all }; delete next[phase.name]; next[saved.name] = saved.id; return next; });
    setPhaseDates((all) => { const next = { ...all }; delete next[phase.name]; next[saved.name] = { start: saved.start_date, end: saved.due_date }; return next; });
    setTasks((all) => all.map((task) => task.stage === phase.name ? { ...task, stage: saved.name } : task));
    setActiveStage((current) => current === phase.name ? saved.name : current);
    setNewStage((current) => current === phase.name ? saved.name : current);
    setPhaseDrafts((all) => { const next = { ...all }; delete next[phase.id]; return next; });
    setPhaseError("");
  };
  const deletePhase = async (phase: Phase) => {
    if (!projectId || !window.confirm(`删除阶段“${phase.name}”？阶段中的任务会保留，但变为未分阶段。`)) return;
    const response = await fetch(`/api/phases/${phase.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) { setPhaseError(payload?.error ?? "阶段删除失败，请重试"); return; }
    setProjectPhases((all) => all.filter((item) => item.id !== phase.id));
    setPhaseIds((all) => { const next = { ...all }; delete next[phase.name]; return next; });
    setTasks((all) => all.map((task) => task.stage === phase.name ? { ...task, stage: "未分阶段" } : task));
  };
  const movePhase = async (phase: Phase, direction: -1 | 1) => {
    const ordered = [...projectPhases].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === phase.id);
    const nextIndex = index + direction;
    if (!projectId || nextIndex < 0 || nextIndex >= ordered.length) return;
    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    const updated = ordered.map((item, position) => ({ ...item, position }));
    setProjectPhases(updated);
    const results = await Promise.all(updated.map((item) => fetch(`/api/phases/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: item.position }) })));
    if (results.some((result) => !result.ok)) setPhaseError("阶段顺序未能全部保存，请重试。");
  };
  const toggleTask = async (task: Task) => {
    const done = !task.done;
    setTasks((all) => all.map((item) => item.id === task.id ? { ...item, done } : item));
    if (projectId && typeof task.id === "string") {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: done ? "completed" : "not_started" }) });
      if (!response.ok) { setTasks((all) => all.map((item) => item.id === task.id ? { ...item, done: task.done } : item)); flash("状态保存失败，请重试"); }
    }
  };

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><span className={styles.brandMark}>w.</span><span>workstory<small>PROJECT SPACE</small></span></div>
      <div className={styles.sideLabel}>工作空间</div>
      <button className={`${styles.navItem} ${styles.navActive}`}><span>▦</span> 项目总览 <kbd>⌘ 1</kbd></button>
      <button className={styles.navItem}><span>◷</span> 我的任务 <b className={styles.count}>4</b></button>
      <button className={styles.navItem}><span>▧</span> 模板库</button>
      <div className={styles.sideLabel}>最近项目 <button className={styles.plus} onClick={() => { setProjectError(""); setNewProjectName(""); setNewProjectTemplate("blank"); setShowNewProject(true); }} aria-label="新建项目">＋</button></div>
      {projects.length ? projects.map((project, index) => <div className={`${styles.projectRow} ${project.id === projectId ? styles.projectCurrent : ""}`} key={project.id}><button className={styles.projectPick} onClick={() => void selectProject(project.id)} aria-current={project.id === projectId ? "page" : undefined}><i className={`${styles.projectDot} ${index % 3 === 1 ? styles.dotBlue : index % 3 === 2 ? styles.dotGold : ""}`}/>{project.name}</button><button className={styles.projectDelete} title={`删除项目 ${project.name}`} aria-label={`删除项目 ${project.name}`} onClick={() => void removeProject(project)}>•••</button></div>) : <p className={styles.noProjects}>还没有项目，点击 ＋ 创建</p>}
      <div className={styles.sidebarBottom}><div className={styles.upgrade}><span>✳</span><b>让每一步都有方向</b><p>把想法拆成计划，持续向前。</p><button onClick={() => flash("你正在使用演示工作区")}>了解工作空间 →</button></div><div className={styles.profile}><div className={styles.avatar}>林</div><span><b>林同学</b><small>个人工作空间</small></span><span className={styles.more}>•••</span></div></div>
    </aside>

    <section className={styles.mainArea}>
      <header className={styles.topbar}><div className={styles.breadcrumb}>我的工作空间 <span>/</span> <b>{projectName}</b></div><div className={styles.topActions}><button className={styles.iconButton} aria-label="通知" onClick={() => flash("目前没有新通知")}>♧<i/></button><button className={styles.help} onClick={() => flash("工作流管理演示项目")}>? 帮助</button><a className={styles.help} href="/login">登录</a><div className={styles.avatarSmall}>林</div></div></header>
      <div className={styles.content}>
        <div className={styles.eyebrow}><span className={styles.templateBadge}>{activeProject?.template_id ? "✦ 毕业设计模板" : "✦ 自定义项目"}</span><span>{projectPhases.length} 个阶段 · {tasks.length} 项任务</span></div>
        <div className={styles.headingRow}><div><h1>{projectName}</h1><p className={styles.subtitle}>按你的目标设置阶段、任务和计划日期。</p></div><div className={styles.headingActions}><button className={styles.outlineButton} onClick={() => flash("项目设置即将开放")}>⚙ 项目设置</button><button className={styles.primaryButton} onClick={() => { setNewStage(currentStages[0] ?? ""); setNewTaskDate(""); setShowNew(true); }}>＋ 新建任务</button></div></div>
        <div className={styles.metrics}><article className={styles.metric}><div className={styles.metricTop}><span>整体进度</span><span className={styles.metricIcon}>↗</span></div><div className={styles.metricValue}>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}<small>%</small></div><div className={styles.progressTrack}><i style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }}/></div><small className={styles.metricNote}>{completed} 项已完成，共 {tasks.length} 项任务</small></article>
          <article className={styles.metric}><div className={styles.metricTop}><span>项目阶段</span><span className={styles.metricIcon} style={{ color: "#6e64ce" }}>◉</span></div><div className={styles.metricValue}>{projectPhases.length} <small>个</small></div><small className={styles.metricNote}>{projectPhases.length ? `当前阶段：${projectPhases.find((phase) => tasks.some((task) => task.stage === phase.name && !task.done))?.name ?? projectPhases[0].name}` : "添加阶段来规划工作流程"}</small></article>
          <article className={styles.metric}><div className={styles.metricTop}><span>阶段计划跨度</span><span className={styles.metricIcon} style={{ color: "#d08b38" }}>◷</span></div><div className={styles.metricValue}>{timeline.length ? daysToTarget : "—"} <small>{timeline.length ? "天" : ""}</small></div><small className={styles.metricNote}>{timeline.length ? `计划截止 · ${formatChineseDate(timelineEnd)}` : "设置阶段日期以查看时间轴"}</small></article>
          <article className={styles.metric}><div className={styles.metricTop}><span>待办任务</span><span className={styles.metricIcon} style={{ color: "#43a886" }}>☷</span></div><div className={styles.metricValue}>{tasks.length - completed} <small>项</small></div><small className={styles.metricNote}>共 {tasks.length} 项任务</small></article></div>

        <div className={styles.stageCard}><div className={styles.sectionHeader}><div><h2>项目阶段</h2><p>每个项目都可以配置自己的阶段与起止日期</p></div><button className={styles.textButton} onClick={() => { if (!projectId) { flash("请先登录并创建项目，再管理自定义阶段"); return; } setPhaseError(""); setPhaseDrafts(Object.fromEntries(projectPhases.map((phase) => [phase.id, { name: phase.name, start: phase.start_date ?? "", end: phase.due_date ?? "" }]))); setShowPhaseManager(true); }}>管理阶段　↗</button></div>{projectPhases.length ? <div className={styles.stageRail}>{projectPhases.map((phase, i) => <button key={phase.id} className={`${styles.stage} ${i === 0 ? styles.stageDone : ""} ${i === 1 ? styles.stageCurrent : ""}`} onClick={() => { setActiveStage(phase.name); document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth" }); }}><span className={styles.stageNumber}>{String(i + 1).padStart(2, "0")}</span><span className={styles.stageLine}/><b>{phase.name}</b><small>{tasks.filter((task) => task.stage === phase.name).length} 项任务</small></button>)}</div> : <div className={styles.empty}>还没有阶段，点击“管理阶段”添加你的流程。</div>}</div>

        <div className={styles.taskSection} id="tasks"><div className={styles.sectionHeader}><div><h2>任务进度</h2><p>安排下一步，及时看到每项工作的状态</p></div><button className={styles.moreButton} onClick={() => flash("更多操作")}>•••</button></div>
          <div className={styles.toolbar}><div className={styles.tabs}>{["列表", "看板", "时间轴"].map((item, i) => <button key={item} className={view === item ? styles.tabSelected : ""} onClick={() => setView(item)}><span>{icons[i]}</span>{item}</button>)}</div><div className={styles.filters}><label className={styles.search}>⌕ <input aria-label="搜索任务" placeholder="搜索任务..." value={query} onChange={(event) => setQuery(event.target.value)}/><kbd>⌘ K</kbd></label><select aria-label="筛选阶段" value={activeStage} onChange={(event) => setActiveStage(event.target.value)}><option>全部阶段</option>{currentStages.map((stage) => <option key={stage}>{stage}</option>)}</select><div className={styles.filterWrap}><button className={styles.filterButton} aria-expanded={showFilters} onClick={() => setShowFilters((open) => !open)}>☷ 筛选{[activePriority !== "全部优先级", activeStatus !== "全部状态", activeDeadline !== "全部日期"].filter(Boolean).length > 0 ? ` (${[activePriority !== "全部优先级", activeStatus !== "全部状态", activeDeadline !== "全部日期"].filter(Boolean).length})` : ""}</button>{showFilters && <div className={styles.filterPanel}><div className={styles.filterPanelHeader}><b>筛选任务</b><button onClick={() => { setActivePriority("全部优先级"); setActiveStatus("全部状态"); setActiveDeadline("全部日期"); setActiveStage("全部阶段"); setQuery(""); }}>清除</button></div><label>状态<select value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)}><option>全部状态</option><option>未完成</option><option>已完成</option></select></label><label>优先级<select value={activePriority} onChange={(event) => setActivePriority(event.target.value)}><option>全部优先级</option><option>高</option><option>中</option><option>低</option></select></label><label>计划日期<select value={activeDeadline} onChange={(event) => setActiveDeadline(event.target.value)}><option>全部日期</option><option>已逾期</option><option>未来 7 天</option><option>未安排</option></select></label><small>当前匹配 {filtered.length} 项任务</small></div>}</div></div></div>
          {view === "列表" ? <div className={styles.tableWrap}><table><thead><tr><th className={styles.checkCol}></th><th>任务名称</th><th>所属阶段</th><th>计划日期</th><th>优先级</th><th>负责人</th><th></th></tr></thead><tbody>{filtered.map((task) => <tr key={task.id}><td><button aria-label={task.done ? "标记未完成" : "标记完成"} className={`${styles.checkbox} ${task.done ? styles.checked : ""}`} onClick={() => toggleTask(task)}>{task.done ? "✓" : ""}</button></td><td><span className={task.done ? styles.taskDone : ""}>{task.title}</span><small className={styles.taskTag}>{task.tag}</small></td><td><span className={styles.stagePill}>{task.stage}</span></td><td className={styles.date}>{shortDate(task.date)}</td><td><span className={`${styles.priority} ${task.priority === "高" ? styles.high : task.priority === "低" ? styles.low : styles.medium}`}><i/>{task.priority}</span></td><td><span className={styles.person}><i>林</i>{task.owner}</span></td><td><button className={styles.rowMore} aria-label="任务操作" onClick={() => flash("任务操作")}>•••</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className={styles.empty}>没有找到匹配的任务</div>}<button className={styles.addInline} onClick={() => setShowNew(true)}>＋　添加任务</button></div> : view === "看板" ? <div className={styles.board}>{currentStages.map((stage, index) => <div className={styles.boardColumn} key={stage}><div className={styles.boardTitle}><span><i className={styles.boardIndex}>{String(index + 1).padStart(2, "0")}</i>{stage}</span><b>{filtered.filter((t) => t.stage === stage).length} 项</b></div>{filtered.filter((task) => task.stage === stage).map((task) => <button className={styles.boardTask} key={task.id} onClick={() => toggleTask(task)}><small>{task.tag}</small><b className={task.done ? styles.taskDone : ""}>{task.title}</b><span>◷ {shortDate(task.date)} <i>{task.priority}优先级</i></span></button>)}<button className={styles.addInline} onClick={() => { setNewStage(stage); setShowNew(true); }}>＋ 添加任务</button></div>)}</div> : <div className={styles.timeline}>
            <div className={styles.timelineAxis}><span className={styles.timelineAxisHeading}>阶段 / 起止日期</span><div className={styles.timelineAxisTrack}>{monthTicks.map((tick) => <div className={styles.timelineTick} key={tick.label} style={{ left: `${tick.left}%` }}><i/><b>{tick.label}</b></div>)}</div></div>
            {timeline.filter((phase) => activeStage === "全部阶段" || activeStage === phase.stage).map((phase, index) => {
              const left = (phase.start.getTime() - timelineStart.getTime()) / timelineSpan * 100;
              const width = (phase.end.getTime() - phase.start.getTime()) / timelineSpan * 100;
              return <div className={styles.timelineRow} key={phase.stage}>
                <div className={styles.timelineLabel}><i className={index === 0 ? styles.timelineComplete : index === 1 ? styles.timelineActive : ""}/><span><b>{phase.stage}</b><small>{formatTimelineDate(phase.start)} — {formatTimelineDate(phase.end)}</small></span></div>
                <div className={styles.timelineTrack}>{monthTicks.map((tick) => <i className={styles.timelineGridLine} key={tick.label} style={{ left: `${tick.left}%` }}/>)}<i className={styles.timelineToday} style={{ left: `${todayPosition}%` }}/><div className={`${styles.timelineBar} ${index === 0 ? styles.barComplete : index === 1 ? styles.barActive : ""}`} style={{ left: `${left}%`, width: `${width}%` }}>{index === 0 ? "已完成" : index === 1 ? "进行中" : ""}</div></div>
              </div>;
            })}
            {!timeline.length && <div className={styles.timelineEmpty}>这个项目还没有已安排日期的阶段。点击“管理阶段”为阶段设置开始日期和截止日期。</div>}
          </div>}
          <div className={styles.tableFooter}><span>显示 <b>{filtered.length}</b> 项任务</span><button onClick={() => setActiveStage("全部阶段")}>查看全部任务　→</button></div>
        </div>
        <footer className={styles.footer}>WORKSTORY <span>把计划变成进度，把进度变成成果。</span><span>演示数据 · 可连接 Supabase</span></footer>
      </div>
    </section>
    {showNew && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="new-task-title"><button className={styles.modalClose} onClick={() => setShowNew(false)} aria-label="关闭">×</button><div className={styles.modalIcon}>＋</div><h2 id="new-task-title">添加一项任务</h2><p>把大目标拆成今天可以开始的一小步。</p><label>任务名称<input autoFocus placeholder="例如：整理研究方法相关文献" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}/></label><label>所属阶段<select value={newStage} onChange={(e) => setNewStage(e.target.value)}><option value="">未分阶段</option>{currentStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label>计划截止日期<input type="date" value={newTaskDate} onChange={(event) => setNewTaskDate(event.target.value)}/></label><div className={styles.modalActions}><button className={styles.outlineButton} onClick={() => setShowNew(false)}>取消</button><button className={styles.primaryButton} onClick={addTask}>创建任务</button></div></section></div>}
    {showPhaseManager && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPhaseManager(false); }}><section className={`${styles.modal} ${styles.phaseManagerModal}`} role="dialog" aria-modal="true" aria-labelledby="phase-manager-title"><button className={styles.modalClose} onClick={() => setShowPhaseManager(false)} aria-label="关闭">×</button><div className={styles.modalIcon}>↗</div><h2 id="phase-manager-title">管理项目阶段</h2><p>编辑阶段名称和计划日期，也可以调整顺序或删除阶段。</p>{phaseError && <div className={styles.errorMessage} role="alert">{phaseError}</div>}<div className={styles.phaseEditorList}>{projectPhases.map((phase, index) => { const draft = phaseDrafts[phase.id] ?? { name: phase.name, start: phase.start_date ?? "", end: phase.due_date ?? "" }; return <div className={styles.phaseEditor} key={phase.id}><div className={styles.phaseEditorTop}><b>{String(index + 1).padStart(2, "0")}</b><button type="button" onClick={() => void movePhase(phase, -1)} disabled={index === 0} aria-label={`上移${phase.name}`}>↑</button><button type="button" onClick={() => void movePhase(phase, 1)} disabled={index === projectPhases.length - 1} aria-label={`下移${phase.name}`}>↓</button><button type="button" className={styles.phaseDelete} onClick={() => void deletePhase(phase)}>删除</button></div><label>阶段名称<input value={draft.name} onChange={(event) => setPhaseDrafts((all) => ({ ...all, [phase.id]: { ...draft, name: event.target.value } }))}/></label><div className={styles.phaseDates}><label>开始日期<input type="date" value={draft.start} onChange={(event) => setPhaseDrafts((all) => ({ ...all, [phase.id]: { ...draft, start: event.target.value } }))}/></label><label>截止日期<input type="date" value={draft.end} min={draft.start || undefined} onChange={(event) => setPhaseDrafts((all) => ({ ...all, [phase.id]: { ...draft, end: event.target.value } }))}/></label></div><button type="button" className={styles.phaseSave} onClick={() => void savePhase(phase)}>保存阶段设置</button></div>; })}</div><form className={styles.phaseCreateForm} onSubmit={(event) => { event.preventDefault(); void addPhase(); }}><h3>添加阶段</h3><label>阶段名称<input required placeholder="例如：原型设计" value={newPhaseName} onChange={(event) => setNewPhaseName(event.target.value)}/></label><div className={styles.phaseDates}><label>开始日期<input type="date" value={newPhaseStart} onChange={(event) => setNewPhaseStart(event.target.value)}/></label><label>截止日期<input type="date" value={newPhaseEnd} min={newPhaseStart || undefined} onChange={(event) => setNewPhaseEnd(event.target.value)}/></label></div><button type="submit" className={styles.primaryButton} disabled={!newPhaseName.trim()}>＋ 添加到项目</button></form></section></div>}
    {showNewProject && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !creatingProject) setShowNewProject(false); }}><form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="new-project-title" onSubmit={(event) => { event.preventDefault(); void createProject(); }}><button type="button" className={styles.modalClose} onClick={() => setShowNewProject(false)} aria-label="关闭" disabled={creatingProject}>×</button><div className={styles.modalIcon}>▦</div><h2 id="new-project-title">新建项目</h2><p>空白项目适合自己搭建流程；也可以从毕业设计模板开始。</p><label>项目名称<input autoFocus required maxLength={100} placeholder="例如：毕业设计进度管理" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)}/></label><label>初始内容<select value={newProjectTemplate} onChange={(event) => setNewProjectTemplate(event.target.value)}><option value="blank">空白项目（推荐）</option><option value="thesis">毕业设计模板（含阶段和示例任务）</option></select></label>{projectError && <div className={styles.errorMessage} role="alert">{projectError}</div>}<div className={styles.modalActions}><button type="button" className={styles.outlineButton} onClick={() => setShowNewProject(false)} disabled={creatingProject}>取消</button><button type="submit" className={styles.primaryButton} disabled={creatingProject || !newProjectName.trim()}>{creatingProject ? "正在创建…" : "创建项目"}</button></div></form></div>}
    {toast && <div className={styles.toast}>✓　{toast}</div>}
  </main>;
}
