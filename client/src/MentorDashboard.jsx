
import { useEffect, useState } from "react";
import "./MentorDashboard.css";
import MentorshipRequests from "./MentorshipRequests";

function MentorDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);

  const [expertise, setExpertise] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("0");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("Available");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const token = localStorage.getItem("capstonehub_token");

  const expertiseList = Array.isArray(profile?.expertise)
    ? profile.expertise
    : [];

  const skillsList = Array.isArray(profile?.skills)
    ? profile.skills
    : [];

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/mentors/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 404) {
          setProfile(null);
          setEditing(true);
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load mentor profile.");
        }

        const mentorData = data.mentor || data;

        setProfile(mentorData);
        setExpertise((mentorData.expertise || []).join(", "));
        setSkills((mentorData.skills || []).join(", "));
        setExperience(String(mentorData.experience ?? 0));
        setBio(mentorData.bio || "");
        setAvailability(mentorData.availability || "Available");
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/mentors/me",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            expertise: expertise
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),

            skills: skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),

            experience: Number(experience),
            bio,
            availability,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save mentor profile.");
      }

      const savedProfile = data.mentor || data;

      setProfile(savedProfile);
      setExpertise((savedProfile.expertise || []).join(", "));
      setSkills((savedProfile.skills || []).join(", "));
      setExperience(String(savedProfile.experience ?? 0));
      setBio(savedProfile.bio || "");
      setAvailability(savedProfile.availability || "Available");

      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleCard(cardName) {
    setActiveCard((current) =>
      current === cardName ? null : cardName
    );
  }

  function handleCardKeyDown(e, cardName) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCard(cardName);
    }
  }

  function renderTags(items, emptyText) {
    if (!items.length) {
      return <span className="mentor-no-data">{emptyText}</span>;
    }

    return (
      <div className="mentor-detail-tags">
        {items.map((item, index) => (
          <span className="mentor-detail-tag" key={`${item}-${index}`}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Mentor";
  const initial = user?.name?.charAt(0)?.toUpperCase() || "M";

  return (
    <main className="mentor-page">
      {/* Sidebar */}
      <aside className="mentor-sidebar">
        <div className="mentor-brand">
          <span className="mentor-logo">C</span>
          <span>CapstoneHub</span>
        </div>

        <div className="mentor-sidebar-label">WORKSPACE</div>

        <nav className="mentor-navigation">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            <span>▦</span> Overview
          </button>

          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => {
              setActiveTab("profile");
              setEditing(false);
              setMessage("");
            }}
          >
            <span>♙</span> My Profile
          </button>

          <button
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            <span>✉</span> Mentorship Requests
          </button>
        </nav>

        <div className="mentor-sidebar-bottom">
          <div className="mentor-sidebar-user">
            <div className="mentor-avatar">{initial}</div>
            <div>
              <strong>{user?.name}</strong>
              <small>Mentor Account</small>
            </div>
          </div>

          <button className="mentor-logout" onClick={onLogout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <section className="mentor-main">
        <header className="mentor-topbar">
          <div>
            <span className="mentor-topbar-label">
              CAPSTONEHUB / MENTOR
            </span>

            <h2>
              {activeTab === "overview" && "Overview"}
              {activeTab === "profile" && "My Profile"}
              {activeTab === "requests" && "Mentorship Requests"}
            </h2>
          </div>

          <div className="mentor-topbar-user">
            <div className="mentor-avatar">{initial}</div>
            <div>
              <strong>{user?.name}</strong>
              <small>Mentor</small>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="mentor-loading">
            Loading your workspace...
          </div>
        ) : (
          <div className="mentor-dashboard-content">

            {/* OVERVIEW PAGE */}
            {activeTab === "overview" && (
              <>
                <section className="mentor-hero">
                  <div>
                    <span className="mentor-eyebrow">
                      YOUR MENTOR WORKSPACE
                    </span>

                    <h1>Welcome back, {firstName}!</h1>

                    <p>
                      Guide students, share your knowledge, and help turn
                      innovative ideas into successful projects.
                    </p>
                  </div>

                  <div className="mentor-hero-icon">✦</div>
                </section>

                <div className="mentor-section-heading">
                  <div>
                    <h2>Workspace Overview</h2>
                    <p>
                      Hover over or tap a card to view its details.
                    </p>
                  </div>
                </div>

                {/* INTERACTIVE OVERVIEW CARDS */}
                <div className="mentor-overview-grid">

                  {/* Profile Status */}
                  <div
                    className={`mentor-overview-card ${activeCard === "status" ? "card-open" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={activeCard === "status"}
                    onClick={() => toggleCard("status")}
                    onKeyDown={(e) => handleCardKeyDown(e, "status")}
                  >
                    <div className="mentor-card-front">
                      <span>♙</span>
                      <h3>Profile Status</h3>
                    </div>

                    <div className="mentor-card-details">
                      <h4>Profile Status</h4>
                      <p>{profile ? "Completed" : "Incomplete"}</p>
                      <small>
                        {profile
                          ? "Your mentor profile is saved."
                          : "Create your profile to get started."}
                      </small>
                    </div>
                  </div>

                  {/* Areas of Expertise */}
                  <div
                    className={`mentor-overview-card ${activeCard === "expertise" ? "card-open" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={activeCard === "expertise"}
                    onClick={() => toggleCard("expertise")}
                    onKeyDown={(e) => handleCardKeyDown(e, "expertise")}
                  >
                    <div className="mentor-card-front">
                      <span>✦</span>
                      <h3>Areas of Expertise</h3>
                    </div>

                    <div className="mentor-card-details">
                      <h4>Areas of Expertise</h4>

                      {expertiseList.length > 0 ? (
                        <ul>
                          {expertiseList.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No expertise added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Technical Skills */}
                  <div
                    className={`mentor-overview-card ${activeCard === "skills" ? "card-open" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={activeCard === "skills"}
                    onClick={() => toggleCard("skills")}
                    onKeyDown={(e) => handleCardKeyDown(e, "skills")}
                  >
                    <div className="mentor-card-front">
                      <span>⌘</span>
                      <h3>Technical Skills</h3>
                    </div>

                    <div className="mentor-card-details">
                      <h4>Technical Skills</h4>

                      {skillsList.length > 0 ? (
                        <ul>
                          {skillsList.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No skills added yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  <div
                    className={`mentor-overview-card ${activeCard === "experience" ? "card-open" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={activeCard === "experience"}
                    onClick={() => toggleCard("experience")}
                    onKeyDown={(e) => handleCardKeyDown(e, "experience")}
                  >
                    <div className="mentor-card-front">
                      <span>◷</span>
                      <h3>Experience</h3>
                    </div>

                    <div className="mentor-card-details">
                      <h4>Experience</h4>
                      <p>
                        {profile
                          ? `${profile.experience ?? 0} Years`
                          : "Not set"}
                      </p>
                      <small>Professional experience</small>
                    </div>
                  </div>

                  {/* Availability */}
                  <div
                    className={`mentor-overview-card ${activeCard === "availability" ? "card-open" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={activeCard === "availability"}
                    onClick={() => toggleCard("availability")}
                    onKeyDown={(e) => handleCardKeyDown(e, "availability")}
                  >
                    <div className="mentor-card-front">
                      <span>●</span>
                      <h3>Availability</h3>
                    </div>

                    <div className="mentor-card-details">
                      <h4>Availability</h4>
                      <p>
                        {profile
                          ? profile.availability || "Not set"
                          : "Not set"}
                      </p>
                      <small>Current mentoring availability</small>
                    </div>
                  </div>

                </div>

                {/* PROFILE SUMMARY */}
                <div className="mentor-lower-grid">
                  <div className="mentor-panel">
                    <div className="mentor-panel-heading">
                      <div>
                        <h3>Profile Summary</h3>
                        <p>
                          Your professional mentoring information.
                        </p>
                      </div>

                      <button
                        className="mentor-text-button"
                        onClick={() => {
                          setActiveTab("profile");
                          setEditing(false);
                          setMessage("");
                        }}
                      >
                        View Profile →
                      </button>
                    </div>

                    {profile ? (
                      <div className="mentor-summary-details">
                        <div className="mentor-summary-row">
                          <span>Areas of Expertise</span>
                          {renderTags(expertiseList, "Not added")}
                        </div>

                        <div className="mentor-summary-row">
                          <span>Technical Skills</span>
                          {renderTags(skillsList, "Not added")}
                        </div>

                        <div className="mentor-summary-row">
                          <span>Experience</span>
                          <strong>
                            {profile.experience ?? 0} years
                          </strong>
                        </div>

                        <div className="mentor-summary-row">
                          <span>Availability</span>
                          <strong>
                            {profile.availability || "Not set"}
                          </strong>
                        </div>

                        <div className="mentor-summary-row">
                          <span>About Me</span>
                          <p>
                            {profile.bio || "No introduction added yet."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mentor-empty">
                        Your profile is not complete yet. Add your expertise
                        and skills to help students find you.

                        <button
                          className="mentor-primary-button"
                          onClick={() => {
                            setActiveTab("profile");
                            setEditing(true);
                          }}
                        >
                          Create Profile →
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mentor-panel mentor-guidance">
                    <div className="mentor-guidance-icon">✦</div>
                    <h3>Make an Impact</h3>
                    <p>
                      Your experience can help students overcome challenges,
                      build confidence, and develop meaningful projects.
                    </p>

                    <button
                      className="mentor-primary-button"
                      onClick={() => setActiveTab("requests")}
                    >
                      View Requests →
                    </button>
                  </div>
                </div>

                {/* ABOUT ME */}
                {profile && (
                  <div className="mentor-panel mentor-about-panel">
                    <div className="mentor-panel-heading">
                      <div>
                        <h3>About Me</h3>
                        <p>Your professional introduction.</p>
                      </div>
                    </div>

                    <p>
                      {profile.bio || "No introduction added yet."}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* MY PROFILE PAGE */}
            {activeTab === "profile" && (
              <section className="mentor-panel mentor-profile-panel">
                <div className="mentor-panel-heading">
                  <div>
                    <h2>Your Mentor Profile</h2>
                    <p>
                      Manage the information students see about you.
                    </p>
                  </div>

                  {profile && !editing && (
                    <button
                      className="mentor-primary-button"
                      onClick={() => setEditing(true)}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {profile && !editing ? (
                  <div className="mentor-profile-view">
                    <div className="mentor-profile-heading">
                      <div className="mentor-avatar large">
                        {initial}
                      </div>

                      <div>
                        <h2>{user?.name}</h2>
                        <span className="mentor-profile-status">
                          {profile.availability || "Not set"}
                        </span>
                      </div>
                    </div>

                    <div className="mentor-profile-detail">
                      <label>Areas of Expertise</label>
                      {renderTags(expertiseList, "Not added")}
                    </div>

                    <div className="mentor-profile-detail">
                      <label>Technical Skills</label>
                      {renderTags(skillsList, "Not added")}
                    </div>

                    <div className="mentor-profile-detail">
                      <label>Experience</label>
                      <p>{profile.experience ?? 0} years</p>
                    </div>

                    <div className="mentor-profile-detail">
                      <label>About Me</label>
                      <p>
                        {profile.bio || "No introduction added yet."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form className="mentor-form" onSubmit={handleSave}>
                    <label htmlFor="expertise">
                      Areas of Expertise
                    </label>

                    <input
                      id="expertise"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="AI/ML, Web Development, DSA"
                      required
                    />

                    <small>
                      Separate multiple areas with commas.
                    </small>

                    <label htmlFor="skills">
                      Technical Skills
                    </label>

                    <input
                      id="skills"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Python, Java, React"
                    />

                    <label htmlFor="experience">
                      Years of Experience
                    </label>

                    <input
                      id="experience"
                      type="number"
                      min="0"
                      step="1"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      required
                    />

                    <label htmlFor="bio">About You</label>

                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Introduce yourself and explain how you can guide students."
                      maxLength={500}
                      rows={5}
                    />

                    <label htmlFor="availability">
                      Availability
                    </label>

                    <select
                      id="availability"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>

                    {message && (
                      <p className="mentor-message" role="status">
                        {message}
                      </p>
                    )}

                    <div className="mentor-form-actions">
                      <button
                        className="mentor-primary-button"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Profile"}
                      </button>

                      {profile && (
                        <button
                          className="mentor-secondary-button"
                          type="button"
                          onClick={() => {
                            setExpertise(expertiseList.join(", "));
                            setSkills(skillsList.join(", "));
                            setExperience(
                              String(profile.experience ?? 0)
                            );
                            setBio(profile.bio || "");
                            setAvailability(
                              profile.availability || "Available"
                            );
                            setEditing(false);
                            setMessage("");
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* MENTORSHIP REQUESTS PAGE */}
            {activeTab === "requests" && (
              <section className="mentor-panel mentor-requests-panel">
                <div className="mentor-panel-heading">
                  <div>
                    <h2>Incoming Requests</h2>
                    <p>
                      Review mentorship requests from students and respond
                      to them.
                    </p>
                  </div>
                </div>

                <MentorshipRequests role="mentor" />
              </section>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default MentorDashboard;
