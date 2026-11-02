import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, CalendarDays, Check, CheckCircle2, Circle, Clock3,
  ClipboardList, Filter, ListTodo, Pencil, Plus, Search, Sparkles,
  Trash2, X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "studyflow-tasks-v1";
const categories = ["Assignment", "Study", "Project", "Exam", "Personal"];
const priorities = ["Low", "Medium", "High"];
const emptyForm = {
  title: "", description: "", category: "Study", priority: "Medium", dueDate: ""
};

function readLocalTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function localSave(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function dateLabel(value) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(task) {
  return !task.completed && task.dueDate &&
    new Date(`${task.dueDate}T23:59:59`) < new Date();
}

export default function App() {
  const [tasks, setTasks] = useState(readLocalTasks);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [storageMode, setStorageMode] = useState("checking");

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/tasks`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setTasks(data);
        localSave(data);
        setStorageMode("database");
      })
      .catch(() => {
        if (!active) return;
        setTasks(readLocalTasks());
        setStorageMode("local");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (storageMode === "local") localSave(tasks);
  }, [tasks, storageMode]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length
  }), [tasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Pending" && !task.completed) ||
        (filter === "Completed" && task.completed);
      const text = `${task.title} ${task.description} ${task.category}`.toLowerCase();
      return matchesFilter && text.includes(query.toLowerCase().trim());
    }).sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, filter, query]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function openNewTask() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditTask(task) {
    setEditingId(task._id || task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "Study",
      priority: task.priority || "Medium",
      dueDate: task.dueDate || ""
    });
    setShowForm(true);
  }

  async function saveTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    try {
      if (storageMode === "database") {
        if (editingId) {
          const updated = await request(`/tasks/${editingId}`, {
            method: "PUT", body: JSON.stringify(form)
          });
          setTasks((current) => current.map((task) => (task._id === editingId ? updated : task)));
        } else {
          const created = await request("/tasks", {
            method: "POST", body: JSON.stringify(form)
          });
          setTasks((current) => [created, ...current]);
        }
      } else {
        if (editingId) {
          setTasks((current) => current.map((task) =>
            (String(task.id) === String(editingId) ? { ...task, ...form } : task)
          ));
        } else {
          setTasks((current) => [{
            ...form, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString()
          }, ...current]);
        }
      }
      setShowForm(false);
      setForm(emptyForm);
      showNotice(editingId ? "Task updated" : "Task added");
    } catch (error) {
      showNotice(error.message);
    }
  }

  async function toggleTask(task) {
    const id = task._id || task.id;
    try {
      if (storageMode === "database") {
        const updated = await request(`/tasks/${id}/toggle`, { method: "PATCH" });
        setTasks((current) => current.map((item) => item._id === id ? updated : item));
      } else {
        setTasks((current) => current.map((item) =>
          String(item.id) === String(id) ? { ...item, completed: !item.completed } : item
        ));
      }
    } catch (error) {
      showNotice(error.message);
    }
  }

  async function deleteTask(task) {
    const id = task._id || task.id;
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      if (storageMode === "database") await request(`/tasks/${id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) =>
        String(item._id || item.id) !== String(id)
      ));
      showNotice("Task deleted");
    } catch (error) {
      showNotice(error.message);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><BookOpen size={21}/></span><span>StudyFlow</span></div>
        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active"><ListTodo size={18}/> My tasks</button>
        <div className="sidebar-tip">
          <div className="tip-icon"><Sparkles size={18}/></div>
          <strong>Small steps add up.</strong>
          <p>Make today count. One task at a time.</p>
        </div>
        <div className="sidebar-bottom">STUDENT TASK MANAGER <span>v1.0</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><div className="eyebrow">YOUR PERSONAL STUDY SPACE</div><h1>My tasks</h1></div>
          <button className="primary-btn" onClick={openNewTask}><Plus size={18}/> Add task</button>
        </header>

        <section className="welcome-card">
          <div>
            <div className="welcome-kicker">A FRESH START, EVERY DAY</div>
            <h2>Plan it. Do it. <span>Own it.</span></h2>
            <p>Keep your assignments, study goals, and projects in one calm place.</p>
          </div>
          <div className="welcome-art"><CalendarDays size={76} strokeWidth={1.25}/><Sparkles className="sparkle" size={22}/></div>
        </section>

        <section className="stats-grid">
          <StatCard icon={<ClipboardList/>} label="Total tasks" value={stats.total} tone="violet"/>
          <StatCard icon={<Clock3/>} label="Pending" value={stats.pending} tone="orange"/>
          <StatCard icon={<CheckCircle2/>} label="Completed" value={stats.completed} tone="green"/>
        </section>

        <section className="task-section">
          <div className="section-heading">
            <div><h2>Your task list</h2><p>Stay focused on what matters next.</p></div>
            <div className="storage-pill"><span className={storageMode === "database" ? "dot green-dot" : "dot"}></span>
              {storageMode === "database" ? "MongoDB connected" : storageMode === "local" ? "Local demo mode" : "Connecting…"}
            </div>
          </div>

          <div className="toolbar">
            <div className="search-box"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your tasks..."/></div>
            <div className="filter-tabs" aria-label="Filter tasks">
              <Filter size={16}/>
              {["All", "Pending", "Completed"].map((item) =>
                <button key={item} className={filter === item ? "filter-tab selected" : "filter-tab"} onClick={() => setFilter(item)}>{item}</button>
              )}
            </div>
          </div>

          <div className="task-list">
            {visibleTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><CheckCircle2 size={28}/></div>
                <h3>{query ? "No matching tasks" : "Nothing on your list yet"}</h3>
                <p>{query ? "Try another search term." : "Add your first task and make a little progress today."}</p>
                {!query && <button className="text-btn" onClick={openNewTask}><Plus size={16}/> Create your first task</button>}
              </div>
            ) : visibleTasks.map((task) => (
              <article className={`task-card ${task.completed ? "is-complete" : ""}`} key={task._id || task.id}>
                <button className="check-btn" onClick={() => toggleTask(task)} aria-label={task.completed ? "Mark pending" : "Mark completed"}>
                  {task.completed ? <Check size={17}/> : <Circle size={20}/>}
                </button>
                <div className="task-info">
                  <div className="task-title-row"><h3>{task.title}</h3><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="task-meta"><span className="category">{task.category}</span><span className={isOverdue(task) ? "due overdue" : "due"}><CalendarDays size={13}/>{isOverdue(task) ? "Overdue · " : ""}{dateLabel(task.dueDate)}</span></div>
                </div>
                <div className="task-actions">
                  <button onClick={() => openEditTask(task)} aria-label="Edit task"><Pencil size={16}/></button>
                  <button onClick={() => deleteTask(task)} aria-label="Delete task"><Trash2 size={16}/></button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <footer className="footer-note">Built for focused days <span>✦</span> StudyFlow</footer>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
        <form className="task-modal" onSubmit={saveTask}>
          <div className="modal-heading"><div><div className="eyebrow">{editingId ? "MAKE A CHANGE" : "PLAN SOMETHING"} </div><h2>{editingId ? "Edit task" : "Add a task"}</h2></div>
            <button type="button" className="close-btn" onClick={() => setShowForm(false)}><X size={20}/></button>
          </div>
          <label>Task title <span>*</span><input autoFocus maxLength="120" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="e.g. Complete DBMS assignment"/></label>
          <label>Description <textarea rows="3" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Add a few details (optional)"/></label>
          <div className="form-row">
            <label>Category<select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Priority<select value={form.priority} onChange={(e) => setForm({...form, priority: e.target.value})}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})}/></label>
          <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" type="submit">{editingId ? "Save changes" : "Add task"}</button></div>
        </form>
      </div>}
      {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong></div></div>;
}
