import { useCallback, useEffect, useMemo, useState } from "react";
import "./TaskManager.css";

const API_URL = "http://localhost:5000/api/tasks";

const emptyForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
};

function getToken() {
  return localStorage.getItem("capstonehub_token");
}

function getErrorMessage(data, fallback) {
  return data?.message || fallback;
}

function TaskManager({ projects = [] }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Keep the selected project valid when projects load or change.
  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProject("");
      setTasks([]);
      return;
    }

    setSelectedProject((current) => {
      if (projects.some((project) => project._id === current)) {
        return current;
      }

      return projects[0]._id;
    });
  }, [projects]);

  const loadTasks = useCallback(async () => {
    if (!selectedProject) {
      setTasks([]);
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please log in again to manage tasks.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}?projectId=${encodeURIComponent(selectedProject)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not load tasks.")
        );
      }

      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      setError(err.message || "Could not load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const completionPercentage =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "All") return tasks;

    return tasks.filter((task) => task.status === statusFilter);
  }, [tasks, statusFilter]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(task) {
    setEditingId(task._id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
      priority: task.priority || "Medium",
    });

    setError("");
    setNotice("");
    document
      .getElementById("task-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!selectedProject) {
      setError("Create a project before adding tasks.");
      return;
    }

    if (form.title.trim().length < 3) {
      setError("Task title must contain at least 3 characters.");
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please log in again to manage tasks.");
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(editingId);

      const payload = isEditing
        ? {
            title: form.title.trim(),
            description: form.description.trim(),
            dueDate: form.dueDate || null,
            priority: form.priority,
          }
        : {
            title: form.title.trim(),
            description: form.description.trim(),
            projectId: selectedProject,
            dueDate: form.dueDate || "",
            priority: form.priority,
          };

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not save the task.")
        );
      }

      resetForm();
      setNotice(
        isEditing
          ? "Task updated successfully."
          : "Task created successfully."
      );

      await loadTasks();
    } catch (err) {
      setError(err.message || "Could not save the task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(task, status) {
    const token = getToken();

    if (!token) {
      setError("Please log in again.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not update task status.")
        );
      }

      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? data.task : item
        )
      );

      setNotice("Task status updated.");
    } catch (err) {
      setError(err.message || "Could not update task status.");
    }
  }

  async function handleDelete(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setError("Please log in again.");
      return;
    }

    setDeletingId(taskId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not delete the task.")
        );
      }

      setTasks((current) =>
        current.filter((task) => task._id !== taskId)
      );

      if (editingId === taskId) resetForm();

      setNotice("Task deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete the task.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "No due date";

    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (projects.length === 0) {
    return (
      <section className="content-card task-manager" id="tasks">
        <div className="task-heading">
          <div>
            <h3>Task &amp; Milestone Management</h3>
            <p>Break your project into manageable tasks.</p>
          </div>
        </div>

        <div className="task-empty">
          <h4>No projects yet</h4>
          <p>Create a project first. You can then add tasks to it here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="content-card task-manager" id="tasks">
      <div className="task-heading">
        <div>
          <h3>Task &amp; Milestone Management</h3>
          <p>Plan your work, track deadlines, and monitor progress.</p>
        </div>
      </div>

      {error && (
        <div className="task-message task-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="task-message task-success" role="status">
          {notice}
        </div>
      )}

      <div className="task-project-select">
        <label htmlFor="task-project">Select project</label>
        <select
          id="task-project"
          value={selectedProject}
          onChange={(event) => {
            setSelectedProject(event.target.value);
            resetForm();
            setError("");
            setNotice("");
          }}
        >
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>

      <div className="task-stats">
        <div className="task-stat">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="task-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="task-stat">
          <span>In progress</span>
          <strong>{inProgressCount}</strong>
        </div>

        <div className="task-stat">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="task-progress">
        <div className="task-progress-label">
          <span>Project task completion</span>
          <strong>{completionPercentage}%</strong>
        </div>

        <div
          className="task-progress-track"
          role="progressbar"
          aria-label="Task completion"
          aria-valuenow={completionPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            className="task-progress-fill"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <form
        id="task-form"
        className="task-form"
        onSubmit={handleSubmit}
      >
        <h4>{editingId ? "Edit task" : "Add a new task"}</h4>

        <div className="task-form-grid">
          <div className="task-field task-field-wide">
            <label htmlFor="task-title">Task title *</label>
            <input
              id="task-title"
              name="title"
              type="text"
              minLength={3}
              maxLength={100}
              value={form.title}
              onChange={handleFormChange}
              placeholder="e.g. Design the login page"
              required
            />
          </div>

          <div className="task-field task-field-wide">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              maxLength={1000}
              rows={3}
              value={form.description}
              onChange={handleFormChange}
              placeholder="What needs to be done?"
            />
          </div>

          <div className="task-field">
            <label htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleFormChange}
            />
          </div>

          <div className="task-field">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              name="priority"
              value={form.priority}
              onChange={handleFormChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="task-form-actions">
          <button
            type="submit"
            className="task-primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
              ? "Save changes"
              : "Add task"}
          </button>

          {editingId && (
            <button
              type="button"
              className="task-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="task-list-heading">
        <div>
          <h4>Your tasks</h4>
          <p>{filteredTasks.length} task(s) shown</p>
        </div>

        <label className="task-filter">
          <span>Filter</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All tasks</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In progress</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="task-empty">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="task-empty">
          <h4>No tasks to show</h4>
          <p>
            {tasks.length === 0
              ? "Add your first task using the form above."
              : "No tasks match the selected status filter."}
          </p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <article className="task-item" key={task._id}>
              <div className="task-item-main">
                <div className="task-item-title-row">
                  <h5>{task.title}</h5>
                  <span
                    className={`task-priority priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority} priority
                  </span>
                </div>

                {task.description && <p>{task.description}</p>}

                <div className="task-item-meta">
                  <span>Due: {formatDate(task.dueDate)}</span>
                  <span
                    className={`task-status status-${task.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="task-item-actions">
                <label>
                  <span className="sr-only">Task status</span>
                  <select
                    value={task.status}
                    onChange={(event) =>
                      handleStatusChange(task, event.target.value)
                    }
                    aria-label={`Change status for ${task.title}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="task-edit-button"
                  onClick={() => handleEdit(task)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="task-delete-button"
                  onClick={() => handleDelete(task._id)}
                  disabled={deletingId === task._id}
                >
                  {deletingId === task._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TaskManager;