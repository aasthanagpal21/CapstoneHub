
import { useEffect, useState } from "react";
import "./MentorDirectory.css";
import MentorshipRequests from "./MentorshipRequests";

function MentorDirectory() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMentors() {
      const token = localStorage.getItem("capstonehub_token");

      if (!token) {
        setError("Please sign in again to view mentors.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/mentors",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load mentors."
          );
        }

        const mentorList = Array.isArray(data)
          ? data
          : data.mentors || [];

        setMentors(mentorList);
      } catch (err) {
        setError(err.message || "Unable to load mentors.");
      } finally {
        setLoading(false);
      }
    }

    fetchMentors();
  }, []);

  return (
    <section className="mentor-directory" id="mentors">
      <div className="directory-heading">
        <div>
          <span className="directory-eyebrow">GET GUIDANCE</span>
          <h2>Find Your Mentor</h2>
          <p>
            Connect with experienced mentors who can guide you
            throughout your project journey.
          </p>
        </div>

        <span className="mentor-total">
          {mentors.length} {mentors.length === 1 ? "Mentor" : "Mentors"}
        </span>
      </div>

      {loading ? (
        <div className="directory-message">
          Loading mentors...
        </div>
      ) : error ? (
        <div className="directory-message directory-error" role="alert">
          {error}
        </div>
      ) : mentors.length === 0 ? (
        <div className="directory-empty">
          <h3>No mentors available yet</h3>
          <p>
            Mentor profiles will appear here once mentors create
            and save their profiles.
          </p>
        </div>
      ) : (
        <div className="mentor-grid">
          {mentors.map((mentor) => (
            <article className="mentor-directory-card" key={mentor._id}>
              <div className="directory-card-top">
                <div className="directory-avatar">
                  {(mentor.user?.name || "M")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <span
                  className={`availability-tag ${
                    mentor.availability === "Available"
                      ? "available"
                      : mentor.availability === "Busy"
                      ? "busy"
                      : "unavailable"
                  }`}
                >
                  {mentor.availability || "Available"}
                </span>
              </div>

              <h3>{mentor.user?.name || "Mentor"}</h3>

              <p className="mentor-expertise">
                {(mentor.expertise || []).join(", ") || "General Guidance"}
              </p>

              <div className="mentor-details">
                <p>
                  <strong>Experience:</strong>{" "}
                  {mentor.experience ?? 0} years
                </p>

                <p>
                  <strong>Skills:</strong>{" "}
                  {(mentor.skills || []).join(", ") || "Not specified"}
                </p>
              </div>

              {mentor.bio && (
                <p className="mentor-bio">{mentor.bio}</p>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="directory-request-section">
        <MentorshipRequests
          role="student"
          mentors={mentors}
        />
      </div>
    </section>
  );
}

export default MentorDirectory;
