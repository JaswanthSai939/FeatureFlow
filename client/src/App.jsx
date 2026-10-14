import { useCallback, useEffect, useState } from "react";



import "./App.css";

import AuthPage from "./pages/AuthPage";







const API_URL = "http://localhost:5000/api/ideas";

const AUTH_URL = "http://localhost:5000/api/auth";



function logoutUser() {

  localStorage.removeItem("token");

}



async function getCurrentUser() {

  const token = localStorage.getItem("token");

  if (!token) throw new Error("No authentication token");



  const response = await fetch(`${AUTH_URL}/me`, {

    headers: { Authorization: `Bearer ${token}` },

  });



  const result = await readResponse(

    response,

    "Unable to verify your session. Please log in again."

  );

  return result;

}



function authHeaders() {

  const token = localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};

}







const CATEGORIES = [



  "UI & Experience",



  "Notifications",



  "Productivity",



  "Integrations",



  "Other",



];







const STATUSES = ["Planned", "In Progress", "Shipped"];







function normalizeIdea(idea) {



  return {



    ...idea,



    id: idea._id || idea.id,



    votes: idea.voteCount ?? idea.votes ?? 0,



    comments: idea.commentCount ?? idea.commentsCount ?? idea.comments ?? 0,



  };



}







async function readResponse(response, fallbackMessage) {



  let result;







  try {



    result = await response.json();



  } catch {



    throw new Error(fallbackMessage);



  }







  if (!response.ok || result.success === false) {



    throw new Error(result.message || fallbackMessage);



  }







  return result;



}







function App() {

  const [user, setUser] = useState(null);

  const [authChecking, setAuthChecking] = useState(true);



  useEffect(() => {

    let cancelled = false;



    async function checkAuthentication() {

      try {

        const token = localStorage.getItem("token");

        if (!token) return;



        const result = await getCurrentUser();

        if (!cancelled) setUser(result.user);

      } catch {

        logoutUser();

      } finally {

        if (!cancelled) setAuthChecking(false);

      }

    }



    checkAuthentication();

    return () => {

      cancelled = true;

    };

  }, []);



  const [ideas, setIdeas] = useState([]);



  const [filter, setFilter] = useState("All");



  const [sort, setSort] = useState("votes");







  const [showForm, setShowForm] = useState(false);



  const [title, setTitle] = useState("");



  const [description, setDescription] = useState("");



  const [category, setCategory] = useState("UI & Experience");







  const [loading, setLoading] = useState(true);



  const [submitting, setSubmitting] = useState(false);



  const [votingId, setVotingId] = useState(null);

  const [updatingStatusId, setUpdatingStatusId] = useState(null);







  const [error, setError] = useState("");



  const [successMessage, setSuccessMessage] = useState("");







  // Comments feature state



  const [expandedComments, setExpandedComments] = useState({});



  const [commentsByIdea, setCommentsByIdea] = useState({});



  const [commentsLoading, setCommentsLoading] = useState({});



  const [commentSubmitting, setCommentSubmitting] = useState({});



  const [commentErrors, setCommentErrors] = useState({});



  const [commentSuccess, setCommentSuccess] = useState({});



  const [commentDrafts, setCommentDrafts] = useState({});



  const [authorName, setAuthorName] = useState("");







  // GET /api/ideas



  const fetchIdeas = useCallback(async () => {



    try {



      setError("");







      const response = await fetch(API_URL);



      const result = await readResponse(response, "Unable to load ideas.");



      const records = Array.isArray(result) ? result : result.data ?? [];







      setIdeas(records.map(normalizeIdea));



    } catch (err) {



      setError(



        err.message ||



          "Could not connect to the server. Make sure your backend is running on port 5000."



      );



    } finally {



      setLoading(false);



    }



  }, []);







  useEffect(() => {



    fetchIdeas();



  }, [fetchIdeas]);







  // Filter and sort ideas



  const visibleIdeas = [...ideas]



    .filter((idea) => filter === "All" || idea.status === filter)



    .sort((a, b) => {



      if (sort === "votes") {



        return (



          b.votes - a.votes ||



          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)



        );



      }







      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);



    });







  // POST /api/ideas



  async function addIdea(event) {



    event.preventDefault();







    if (!title.trim() || !description.trim()) {



      setError("Please enter both a title and description.");



      return;



    }







    try {



      setSubmitting(true);



      setError("");



      setSuccessMessage("");







      const response = await fetch(API_URL, {



        method: "POST",



        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },



        body: JSON.stringify({



          title: title.trim(),



          description: description.trim(),



          category,



        }),



      });







      await readResponse(response, "Failed to submit idea.");







      setTitle("");



      setDescription("");



      setCategory("UI & Experience");



      setShowForm(false);



      setFilter("All");



      setSort("newest");







      await fetchIdeas();



      setSuccessMessage("Your idea was submitted successfully.");



    } catch (err) {



      setError(err.message || "Unable to submit your idea.");



    } finally {



      setSubmitting(false);



    }



  }







  // POST /api/ideas/:id/vote



  async function voteForIdea(id) {



    if (votingId !== null) return;







    try {



      setVotingId(id);



      setError("");



      setSuccessMessage("");







      const response = await fetch(`${API_URL}/${id}/vote`, {



        method: "POST",



        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },



      });







      const result = await readResponse(response, "Failed to record vote.");







      if (result.data) {



        const updatedIdea = normalizeIdea(result.data);



        setIdeas((current) =>



          current.map((idea) =>



            idea.id === id ? { ...idea, ...updatedIdea } : idea



          )



        );



      } else {



        await fetchIdeas();



      }







      setSuccessMessage("Vote recorded successfully.");



    } catch (err) {



      setError(err.message || "Unable to record your vote.");



    } finally {



      setVotingId(null);



    }



  }







  // PATCH /api/ideas/:id/status (admin only)
  async function updateIdeaStatus(ideaId, newStatus) {
    if (!user || user.role !== "admin") {
      setError("Only admins can update idea statuses.");
      return;
    }

    try {
      setUpdatingStatusId(ideaId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/${ideaId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await readResponse(response, "Failed to update idea status.");

      if (result.data) {
        const updatedIdea = normalizeIdea(result.data);
        setIdeas((current) =>
          current.map((idea) =>
            idea.id === ideaId ? { ...idea, ...updatedIdea } : idea
          )
        );
      } else {
        await fetchIdeas();
      }

      setSuccessMessage("Idea status updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update idea status.");
    } finally {
      setUpdatingStatusId(null);
    }
  }


  // GET /api/ideas/:id/comments



  async function fetchComments(ideaId) {



    try {



      setCommentsLoading((current) => ({ ...current, [ideaId]: true }));



      setCommentErrors((current) => ({ ...current, [ideaId]: "" }));







      const response = await fetch(`${API_URL}/${ideaId}/comments`);



      const result = await readResponse(response, "Unable to load comments.");



      const records = Array.isArray(result) ? result : result.data ?? [];







      setCommentsByIdea((current) => ({ ...current, [ideaId]: records }));



    } catch (err) {



      setCommentErrors((current) => ({



        ...current,



        [ideaId]: err.message || "Unable to load comments.",



      }));



    } finally {



      setCommentsLoading((current) => ({ ...current, [ideaId]: false }));



    }



  }







  // Open or close an idea's comments



  async function toggleComments(ideaId) {



    const isOpening = !expandedComments[ideaId];







    setExpandedComments((current) => ({ ...current, [ideaId]: isOpening }));







    if (isOpening && commentsByIdea[ideaId] === undefined) {



      await fetchComments(ideaId);



    }



  }







  // POST /api/ideas/:id/comments



  async function addComment(event, ideaId) {



    event.preventDefault();







    const text = (commentDrafts[ideaId] || "").trim();



    const name = authorName.trim();







    if (!name) {



      setCommentErrors((current) => ({



        ...current,



        [ideaId]: "Please enter your name.",



      }));



      return;



    }







    if (!text) {



      setCommentErrors((current) => ({



        ...current,



        [ideaId]: "Please enter a comment.",



      }));



      return;



    }







    if (text.length > 1000) {



      setCommentErrors((current) => ({



        ...current,



        [ideaId]: "Comments cannot exceed 1000 characters.",



      }));



      return;



    }







    try {



      setCommentSubmitting((current) => ({ ...current, [ideaId]: true }));



      setCommentErrors((current) => ({ ...current, [ideaId]: "" }));



      setCommentSuccess((current) => ({ ...current, [ideaId]: "" }));







      const response = await fetch(`${API_URL}/${ideaId}/comments`, {



        method: "POST",



        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },



        body: JSON.stringify({ authorName: name, text }),



      });







      const result = await readResponse(response, "Failed to submit comment.");



      const savedComment = result.data;







      if (savedComment?._id) {



        setCommentsByIdea((current) => ({



          ...current,



          [ideaId]: [...(current[ideaId] || []), savedComment],



        }));







        setIdeas((current) =>



          current.map((idea) =>



            idea.id === ideaId



              ? { ...idea, comments: (idea.comments || 0) + 1 }



              : idea



          )



        );



      } else {



        await fetchComments(ideaId);



        await fetchIdeas();



      }







      setCommentDrafts((current) => ({ ...current, [ideaId]: "" }));



      setCommentSuccess((current) => ({



        ...current,



        [ideaId]: "Comment added successfully!",



      }));



    } catch (err) {



      setCommentErrors((current) => ({



        ...current,



        [ideaId]: err.message || "Unable to submit comment.",



      }));



    } finally {



      setCommentSubmitting((current) => ({ ...current, [ideaId]: false }));



    }



  }







  const totalVotes = ideas.reduce((sum, idea) => sum + idea.votes, 0);



  const inProgressCount = ideas.filter(



    (idea) => idea.status === "In Progress"



  ).length;



  const shippedCount = ideas.filter(



    (idea) => idea.status === "Shipped"



  ).length;







  if (authChecking) {

    return <div className="empty-state">Checking authentication...</div>;

  }



  if (!user) {

    return (

      <AuthPage

        onAuthenticated={(authenticatedUser) => {

          setUser(authenticatedUser);

          setError("");

        }}

      />

    );

  }



  return (



    <div className="app-shell">



      <header className="topbar">



        <a className="brand" href="/">



          <span className="brand-icon">F</span>



          FeatureFlow



        </a>







        <span className="topbar-label">Product feedback, together.</span>







        <button



          type="button"



          className="primary-button"



          onClick={() => {



            setShowForm((current) => !current);



            setError("");



            setSuccessMessage("");



          }}



        >



          + Submit idea



        </button>

        <button

          type="button"

          className="secondary-button"

          onClick={() => {

            logoutUser();

            setUser(null);

            setShowForm(false);

            setSuccessMessage("");

            setError("");

          }}

        >

          Sign Out

        </button>



      </header>







      <main className="main-content">



        <section className="hero">



          <span className="eyebrow">COMMUNITY FEEDBACK BOARD</span>



          <h1>



            Great ideas start <span>with you.</span>



          </h1>



          <p>



            Share your ideas, support the features you love, and help shape what



            we build next.



          </p>



        </section>







        <section className="stats">



          <div className="stat-card">



            <span>Total ideas</span>



            <strong>{ideas.length}</strong>



          </div>



          <div className="stat-card">



            <span>Total upvotes</span>



            <strong>{totalVotes}</strong>



          </div>



          <div className="stat-card">



            <span>In progress</span>



            <strong>{inProgressCount}</strong>



          </div>



          <div className="stat-card">



            <span>Shipped</span>



            <strong>{shippedCount}</strong>



          </div>



        </section>







        {error && (



          <div className="empty-state" role="alert">



            <p>{error}</p>



            <button



              type="button"



              className="secondary-button"



              onClick={fetchIdeas}



            >



              Retry



            </button>



          </div>



        )}







        {successMessage && (



          <div className="success-message" role="status">



            {successMessage}



          </div>



        )}







        {showForm && (



          <form className="idea-form" onSubmit={addIdea}>



            <h2>Share a feature idea</h2>







            <label htmlFor="idea-title">Idea title</label>



            <input



              id="idea-title"



              value={title}



              onChange={(event) => setTitle(event.target.value)}



              placeholder="What should we build?"



              minLength={5}



              maxLength={100}



              required



            />







            <label htmlFor="idea-description">Description</label>



            <textarea



              id="idea-description"



              value={description}



              onChange={(event) => setDescription(event.target.value)}



              placeholder="Explain how this feature would help..."



              rows={4}



              minLength={10}



              maxLength={2000}



              required



            />







            <label htmlFor="idea-category">Category</label>



            <select



              id="idea-category"



              value={category}



              onChange={(event) => setCategory(event.target.value)}



              required



            >



              {CATEGORIES.map((item) => (



                <option key={item} value={item}>



                  {item}



                </option>



              ))}



            </select>







            <div className="form-actions">



              <button



                type="button"



                className="secondary-button"



                onClick={() => setShowForm(false)}



                disabled={submitting}



              >



                Cancel



              </button>



              <button



                type="submit"



                className="primary-button"



                disabled={submitting}



              >



                {submitting ? "Submitting..." : "Submit idea"}



              </button>



            </div>



          </form>



        )}







        <section className="board-heading">



          <div>



            <h2>Explore ideas</h2>



            <p>Vote for the features you'd love to see.</p>



          </div>







          <div className="board-controls">



            <select



              value={filter}



              onChange={(event) => setFilter(event.target.value)}



              aria-label="Filter ideas by status"



            >



              <option value="All">All statuses</option>



              {STATUSES.map((status) => (



                <option key={status} value={status}>



                  {status}



                </option>



              ))}



            </select>







            <select



              value={sort}



              onChange={(event) => setSort(event.target.value)}



              aria-label="Sort ideas"



            >



              <option value="votes">Most votes</option>



              <option value="newest">Newest</option>



            </select>



          </div>



        </section>







        <section className="ideas-list">



          {loading ? (



            <div className="empty-state">Loading ideas...</div>



          ) : visibleIdeas.length > 0 ? (



            visibleIdeas.map((idea) => (



              <article className="idea-card" key={idea.id}>



                <button



                  type="button"



                  className="vote-button"



                  onClick={() => voteForIdea(idea.id)}



                  disabled={votingId !== null}



                  aria-label={`Upvote ${idea.title}`}



                >



                  <span aria-hidden="true">▲</span>



                  <strong>{idea.votes}</strong>



                  <small>



                    {votingId === idea.id ? "Voting..." : "votes"}



                  </small>



                </button>







                <div className="idea-content">



                  <div className="idea-meta">



                    <span>{idea.category}</span>



                    <span
                      className={`status status-${(idea.status || "Planned")
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {idea.status || "Planned"}
                    </span>

                    {user.role === "admin" && (
                      <select
                        className="admin-status-select"
                        value={idea.status || "Planned"}
                        onChange={(event) =>
                          updateIdeaStatus(idea.id, event.target.value)
                        }
                        disabled={updatingStatusId === idea.id}
                        aria-label={`Update status for ${idea.title}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}



                  </div>







                  <h3>{idea.title}</h3>



                  <p>{idea.description}</p>







                  <button



                    type="button"



                    className="comment-count"



                    onClick={() => toggleComments(idea.id)}



                    aria-expanded={!!expandedComments[idea.id]}



                  >



                    <span aria-hidden="true">◯</span>{" "}



                    {idea.comments}{" "}



                    {idea.comments === 1 ? "comment" : "comments"}



                    <span aria-hidden="true">



                      {" "}



                      {expandedComments[idea.id] ? "▲" : "▼"}



                    </span>



                  </button>







                  {expandedComments[idea.id] && (



                    <section className="comments-panel">



                      <h4>Discussion</h4>







                      {commentsLoading[idea.id] ? (



                        <p className="comments-loading">Loading comments...</p>



                      ) : (



                        <>



                          {commentErrors[idea.id] &&



                            commentsByIdea[idea.id] === undefined && (



                              <p className="comment-error" role="alert">



                                {commentErrors[idea.id]}



                              </p>



                            )}







                          {commentsByIdea[idea.id]?.length > 0 ? (



                            <div className="comments-list">



                              {commentsByIdea[idea.id].map((comment) => (



                                <article



                                  className="comment-item"



                                  key={comment._id}



                                >



                                  <div className="comment-header">



                                    <strong>



                                      {comment.authorName || "Anonymous"}



                                    </strong>



                                    <small>



                                      {comment.createdAt



                                        ? new Date(



                                            comment.createdAt



                                          ).toLocaleString()



                                        : ""}



                                    </small>



                                  </div>



                                  <p>{comment.text}</p>



                                </article>



                              ))}



                            </div>



                          ) : (



                            <p className="no-comments">



                              No comments yet. Start the discussion!



                            </p>



                          )}







                          <form



                            className="comment-form"



                            onSubmit={(event) => addComment(event, idea.id)}



                          >



                            <label htmlFor={`author-${idea.id}`}>



                              Your name



                            </label>



                            <input



                              id={`author-${idea.id}`}



                              type="text"



                              value={authorName}



                              onChange={(event) => {



                                setAuthorName(event.target.value);



                                setCommentSuccess((current) => ({



                                  ...current,



                                  [idea.id]: "",



                                }));



                              }}



                              placeholder="Enter your name"



                              maxLength={80}



                              required



                            />







                            <label htmlFor={`comment-${idea.id}`}>



                              Add a comment



                            </label>



                            <textarea



                              id={`comment-${idea.id}`}



                              value={commentDrafts[idea.id] || ""}



                              onChange={(event) => {



                                setCommentDrafts((current) => ({



                                  ...current,



                                  [idea.id]: event.target.value,



                                }));



                                setCommentSuccess((current) => ({



                                  ...current,



                                  [idea.id]: "",



                                }));



                              }}



                              placeholder="Share your thoughts..."



                              rows={3}



                              maxLength={1000}



                              required



                            />







                            {commentErrors[idea.id] &&



                              commentsByIdea[idea.id] !== undefined && (



                                <p className="comment-error" role="alert">



                                  {commentErrors[idea.id]}



                                </p>



                              )}







                            {commentSuccess[idea.id] && (



                              <p className="comment-success" role="status">



                                {commentSuccess[idea.id]}



                              </p>



                            )}







                            <button



                              type="submit"



                              className="primary-button"



                              disabled={!!commentSubmitting[idea.id]}



                            >



                              {commentSubmitting[idea.id]



                                ? "Posting..."



                                : "Post comment"}



                            </button>



                          </form>



                        </>



                      )}



                    </section>



                  )}



                </div>



              </article>



            ))



          ) : (



            <div className="empty-state">No ideas found for this status.</div>



          )}



        </section>







        <footer>



          FeatureFlow <span>·</span> Built for better products.



        </footer>



      </main>



    </div>



  );



}







export default App;
