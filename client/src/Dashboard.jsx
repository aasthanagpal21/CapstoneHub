
import { useEffect, useState } from "react";
import "./Dashboard.css";
import TaskManager from "./TaskManager";
import MentorDirectory from "./MentorDirectory";

function Dashboard({ user, onLogout }) {
  const firstName = user?.name?.split(" ")[0] || "Student";

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Web Development",
    status: "Planning",
    deadline: "",
  });

  // Fetch the logged-in student's projects.
  useEffect(() => {
    async function fetchProjects() {
      const token = localStorage.getItem("capstonehub_token");

      if (!token) {
        setError("Please sign in again to view your projects.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/projects",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load projects."
          );
        }

        setProjects(data.projects || []);
      } catch (err) {
        setError(
          err.message ||
            "Something went wrong while loading projects."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const activeProjects = projects.filter(
    (project) => project.status === "In Progress"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const filteredProjects = projects
    .filter((project) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        (project.title || "").toLowerCase().includes(search) ||
        (project.description || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        project.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return sortOrder === "oldest"
        ? dateA - dateB
        : dateB - dateA;
    });

  // Handle changes in the project form.
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create a new project or update an existing one.
  const handleCreateProject = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormMessage("");
    setFormError("");

    const token = localStorage.getItem("capstonehub_token");

    if (!token) {
      setFormError("Please sign in again to continue.");
      setSaving(false);
      return;
    }

    try {
      const isEditing = Boolean(editingProjectId);

      const url = isEditing
        ? `http://localhost:5000/api/projects/${editingProjectId}`
        : "http://localhost:5000/api/projects";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save project."
        );
      }

      if (isEditing) {
        setProjects((previous) =>
          previous.map((project) =>
            project._id === editingProjectId
              ? data.project
              : project
          )
        );
      } else {
        setProjects((previous) => [
          data.project,
          ...previous,
        ]);
      }

      setFormData({
        title: "",
        description: "",
        category: "Web Development",
        status: "Planning",
        deadline: "",
      });

      setEditingProjectId(null);
      setShowForm(false);

      setFormMessage(
        isEditing
          ? "Project updated successfully!"
          : "Project created successfully!"
      );
    } catch (err) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Load project details into the form for editing.
  const handleEditProject = (project) => {
    setEditingProjectId(project._id);

    setFormData({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Other",
      status: project.status || "Planning",
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().slice(0, 10)
        : "",
    });

    setFormMessage("");
    setFormError("");
    setShowForm(true);

    document.getElementById("projects")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Delete a project.
  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    setDeletingProjectId(projectId);
    setError("");

    try {
      const token = localStorage.getItem("capstonehub_token");

      if (!token) {
        throw new Error("Please sign in again to continue.");
      }

      const response = await fetch(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete project."
        );
      }

      setProjects((previous) =>
        previous.filter((project) => project._id !== projectId)
      );

      setFormMessage("Project deleted successfully!");
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while deleting the project."
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Reset the project form.
  const resetProjectForm = () => {
    setShowForm(false);
    setEditingProjectId(null);
    setFormError("");
    setFormMessage("");

    setFormData({
      title: "",
      description: "",
      category: "Web Development",
      status: "Planning",
      deadline: "",
    });
  };

  // Navigate to the selected dashboard section.
  const scrollToSection = (event, sectionId) => {
    event.preventDefault();

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="dashboard-logo">C</span>
          <span>CapstoneHub</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <a
            href="#overview"
            className="nav-item active"
            onClick={(event) => scrollToSection(event, "overview")}
          >
            <span>⌂</span> Overview
          </a>

          <a
            href="#projects"
            className="nav-item"
            onClick={(event) => scrollToSection(event, "projects")}
          >
            <span>▦</span> My Projects
          </a>

          <a
            href="#tasks"
            className="nav-item"
            onClick={(event) => scrollToSection(event, "tasks")}
          >
            <span>☷</span> My Tasks
          </a>

          <a
            href="#mentors"
            className="nav-item"
            onClick={(event) => scrollToSection(event, "mentors")}
          >
            <span>♧</span> Mentors
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">✦</span>
            <strong>Keep building!</strong>
            <p>Every great project starts with an idea.</p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            ↪ &nbsp; Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <div>
            <p className="breadcrumb">Workspace / Overview</p>
            <h1>Dashboard</h1>
          </div>

          <div className="profile-chip">
            <div className="profile-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{user?.name || "Student"}</strong>
              <span>{user?.role || "student"}</span>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <span className="welcome-tag">YOUR WORKSPACE</span>
            <h2>Welcome back, {firstName}! 👋</h2>

            <p>
              Ready to turn your ideas into something amazing?
              Your next big project starts here.
            </p>

            <button
              type="button"
              className="welcome-button"
              onClick={() =>
                document.getElementById("projects")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Explore your workspace →
            </button>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <div className="art-circle">
              <span>✦</span>
            </div>
            <div className="art-dot dot-one"></div>
            <div className="art-dot dot-two"></div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Active Projects</span>
              <span className="stat-icon purple">▦</span>
            </div>
            <strong>{activeProjects}</strong>
            <p>Projects currently in progress</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Total Projects</span>
              <span className="stat-icon orange">☷</span>
            </div>
            <strong>{projects.length}</strong>
            <p>Projects in your workspace</p>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Completed Projects</span>
              <span className="stat-icon green">✓</span>
            </div>
            <strong>{completedProjects}</strong>
            <p>Projects marked as completed</p>
          </article>
        </section>

        <section className="workspace-grid">
          <article className="content-card projects-card" id="projects">
            <div className="section-heading">
              <div>
                <h3>My Projects</h3>
                <p>Your ideas and ongoing work</p>
              </div>

              <div className="project-heading-actions">
                <span className="count-badge">
                  {projects.length}{" "}
                  {projects.length === 1 ? "project" : "projects"}
                </span>

                <button
                  type="button"
                  className="create-project-button"
                  onClick={() => {
                    if (showForm) {
                      resetProjectForm();
                    } else {
                      setFormMessage("");
                      setFormError("");
                      setShowForm(true);
                    }
                  }}
                >
                  + Create Project
                </button>
              </div>
            </div>

            {showForm && (
              <form
                className="project-form"
                onSubmit={handleCreateProject}
              >
                <h4>
                  {editingProjectId
                    ? "Edit Project"
                    : "Create a New Project"}
                </h4>

                <label htmlFor="project-title">Project Title</label>
                <input
                  id="project-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Smart Recommendation System"
                  value={formData.title}
                  onChange={handleFormChange}
                  minLength={3}
                  maxLength={100}
                  required
                />

                <label htmlFor="project-description">
                  Description
                </label>
                <textarea
                  id="project-description"
                  name="description"
                  placeholder="Describe what your project will do..."
                  value={formData.description}
                  onChange={handleFormChange}
                  maxLength={2000}
                  rows={4}
                  required
                />

                <label htmlFor="project-category">Category</label>
                <select
                  id="project-category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Web Development">
                    Web Development
                  </option>
                  <option value="Artificial Intelligence">
                    Artificial Intelligence
                  </option>
                  <option value="Machine Learning">
                    Machine Learning
                  </option>
                  <option value="Data Science">Data Science</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Other">Other</option>
                </select>

                <label htmlFor="project-status">Status</label>
                <select
                  id="project-status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <label htmlFor="project-deadline">
                  Deadline (optional)
                </label>
                <input
                  id="project-deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleFormChange}
                />

                {formError && (
                  <p role="alert" className="form-error">
                    {formError}
                  </p>
                )}

                <div className="project-form-actions">
                  <button
                    type="button"
                    className="cancel-project-button"
                    onClick={resetProjectForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-project-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingProjectId
                      ? "Save Changes"
                      : "Save Project"}
                  </button>
                </div>
              </form>
            )}

            {formMessage && (
              <p role="status" className="form-success">
                {formMessage}
              </p>
            )}

            <div className="project-toolbar">
              <input
                type="search"
                placeholder="Search projects..."
                aria-label="Search projects"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

              <select
                aria-label="Filter projects by status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">All statuses</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                aria-label="Sort projects"
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value)
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </div>

            {loading ? (
              <p className="placeholder-text">
                Loading your projects...
              </p>
            ) : error ? (
              <p role="alert" className="placeholder-text">
                {error}
              </p>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">
                <h4>No matching projects</h4>
                <p>
                  Try a different search term or status filter.
                </p>
              </div>
            ) : (
              <div className="project-list">
                {filteredProjects.map((project) => (
                  <article
                    className="project-item"
                    key={project._id}
                  >
                    <div className="project-info">
                      <h4>{project.title}</h4>
                      <p>{project.description}</p>
                      <span>{project.category || "Other"}</span>

                      <div className="project-actions">
                        <button
                          type="button"
                          className="edit-project-button"
                          onClick={() => handleEditProject(project)}
                          disabled={
                            saving || deletingProjectId !== null
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-project-button"
                          onClick={() =>
                            handleDeleteProject(project._id)
                          }
                          disabled={
                            deletingProjectId === project._id ||
                            saving
                          }
                        >
                          {deletingProjectId === project._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    <span className="project-status">
                      {project.status}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="content-card activity-card">
            <div className="section-heading">
              <div>
                <h3>Recent Activity</h3>
                <p>Updates from your workspace</p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot"></span>
              <div>
                <strong>Account created</strong>
                <p>
                  Welcome to the CapstoneHub community!
                </p>
              </div>
            </div>

            <div className="activity-item">
              <span className="activity-dot muted"></span>
              <div>
                <strong>Your next milestone</strong>
                <p>
                  {projects.length > 0
                    ? "Keep making progress on your projects."
                    : "Create your first project to get started."}
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* Task management */}
        <TaskManager projects={projects} />

        {/* Mentor directory */}
        <MentorDirectory />

        <div className="dashboard-footer">
          Built with care for your next big idea.{" "}
          <span>✦ CapstoneHub</span>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
