
import { useCallback, useEffect, useState } from "react";
import "./MentorshipRequests.css";

const API = "http://localhost:5000/api/mentorship";

function MentorshipRequests({ role, mentors = [] }) {
  const [requests, setRequests] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRequests = useCallback(async () => {
    const token = localStorage.getItem("capstonehub_token");

    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load requests.");
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const sendRequest = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!selectedMentor) {
      setError("Please select a mentor.");
      return;
    }

    const token = localStorage.getItem("capstonehub_token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId: selectedMentor,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send request.");
      }

      setMessage("");
      setNotice("Mentorship request sent successfully.");
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to send request.");
    } finally {
      setSending(false);
    }
  };

  const respondToRequest = async (requestId, status) => {
    const token = localStorage.getItem("capstonehub_token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setError("");
    setNotice("");
    setProcessingId(requestId);

    try {
      const response = await fetch(`${API}/${requestId}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          mentorResponse: responses[requestId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update request.");
      }

      setNotice(`Request ${status.toLowerCase()} successfully.`);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to update request.");
    } finally {
      setProcessingId("");
    }
  };

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  return (
    <section className="content-card mentorship-requests" id="mentorship-requests">
      <div className="section-heading">
        <div>
          <h3>
            {role === "mentor"
              ? "Incoming Mentorship Requests"
              : "My Mentorship Requests"}
          </h3>
          <p>
            {role === "mentor"
              ? "Review students who want your guidance."
              : "Track the status of your requests to mentors."}
          </p>
        </div>

        <span className="count-badge">
          {pendingCount} pending
        </span>
      </div>

      {error && <p className="mentorship-error" role="alert">{error}</p>}
      {notice && <p className="mentorship-success" role="status">{notice}</p>}

      {role === "student" && (
        <form className="mentorship-form" onSubmit={sendRequest}>
          <h4>Request a Mentor</h4>

          <label htmlFor="request-mentor">Choose a mentor</label>
          <select
            id="request-mentor"
            value={selectedMentor}
            onChange={(event) => setSelectedMentor(event.target.value)}
            required
          >
            <option value="">Select a mentor</option>
            {mentors
              .filter((mentor) => mentor.availability !== "Unavailable")
              .map((mentor) => (
                <option key={mentor._id} value={mentor._id}>
                  {mentor.user?.name || "Mentor"} —{" "}
                  {(mentor.expertise || []).join(", ") || "General"}
                </option>
              ))}
          </select>

          <label htmlFor="request-message">Your message</label>
          <textarea
            id="request-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Introduce your project and explain what guidance you need..."
            minLength={10}
            maxLength={1000}
            rows={4}
            required
          />

          <button
            type="submit"
            className="create-project-button"
            disabled={sending || mentors.length === 0}
          >
            {sending ? "Sending..." : "Send Mentorship Request"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="placeholder-text">Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h4>No requests yet</h4>
          <p>
            {role === "mentor"
              ? "Student requests will appear here."
              : "Choose a mentor above to send your first request."}
          </p>
        </div>
      ) : (
        <div className="mentorship-request-list">
          {requests.map((request) => {
            const mentorName = request.mentor?.user?.name || "Mentor";
            const studentName = request.student?.name || "Student";

            return (
              <article className="mentorship-request-item" key={request._id}>
                <div className="mentorship-request-top">
                  <div>
                    <h4>
                      {role === "mentor"
                        ? studentName
                        : mentorName}
                    </h4>
                    <p className="mentorship-request-date">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`request-status status-${request.status.toLowerCase()}`}
                  >
                    {request.status}
                  </span>
                </div>

                <p className="request-message">{request.message}</p>

                {request.mentorResponse && (
                  <div className="mentor-response">
                    <strong>Mentor response</strong>
                    <p>{request.mentorResponse}</p>
                  </div>
                )}

                {role === "mentor" && request.status === "Pending" && (
                  <div className="request-response-form">
                    <label htmlFor={`response-${request._id}`}>
                      Optional response
                    </label>
                    <textarea
                      id={`response-${request._id}`}
                      value={responses[request._id] || ""}
                      onChange={(event) =>
                        setResponses((previous) => ({
                          ...previous,
                          [request._id]: event.target.value,
                        }))
                      }
                      placeholder="Write a short response to the student..."
                      maxLength={1000}
                      rows={3}
                    />

                    <div className="request-action-buttons">
                      <button
                        type="button"
                        className="accept-request-button"
                        onClick={() => respondToRequest(request._id, "Accepted")}
                        disabled={processingId === request._id}
                      >
                        {processingId === request._id
                          ? "Updating..."
                          : "Accept"}
                      </button>

                      <button
                        type="button"
                        className="reject-request-button"
                        onClick={() => respondToRequest(request._id, "Rejected")}
                        disabled={processingId === request._id}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MentorshipRequests;
