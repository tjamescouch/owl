import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';

const API = '/api';

function Home() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/polls/recent`)
      .then(r => r.json())
      .then(setRecent)
      .catch(() => {});
  }, []);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    const filtered = options.filter(o => o.trim());
    if (!question.trim() || filtered.length < 2) return;

    setLoading(true);
    const res = await fetch(`${API}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, options: filtered }),
    });
    const poll = await res.json();
    setLoading(false);
    navigate(`/poll/${poll.id}`);
  };

  return (
    <div className="container">
      <h1>Poll</h1>
      <form onSubmit={submit} className="create-form">
        <input
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="question-input"
        />
        {options.map((opt, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Option ${i + 1}`}
            value={opt}
            onChange={e => updateOption(i, e.target.value)}
          />
        ))}
        <div className="buttons">
          {options.length < 6 && (
            <button type="button" onClick={addOption} className="secondary">
              + Add Option
            </button>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>

      {recent.length > 0 && (
        <div className="recent">
          <h2>Recent Polls</h2>
          {recent.map(p => (
            <Link key={p.id} to={`/poll/${p.id}`} className="recent-poll">
              {p.question}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Poll() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    setVoted(votedPolls.includes(id));

    // Connect to WebSocket for live updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host.replace(/:\d+$/, ':4010');
    const ws = new WebSocket(`${wsProtocol}//${wsHost}/polls/${id}/stream`);

    ws.onopen = () => setLive(true);
    ws.onclose = () => setLive(false);
    ws.onerror = () => {
      // Fallback to REST if WebSocket fails
      fetch(`${API}/polls/${id}`)
        .then(r => r.ok ? r.json() : Promise.reject('Not found'))
        .then(setPoll)
        .catch(() => setError('Poll not found'));
    };
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.poll) setPoll(data.poll);
    };

    return () => ws.close();
  }, [id]);

  const vote = async (optionIndex) => {
    if (voted) return;

    await fetch(`${API}/polls/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: optionIndex }),
    });

    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    localStorage.setItem('votedPolls', JSON.stringify([...votedPolls, id]));
    setVoted(true);
    // No manual refetch needed - WebSocket will push the update
  };

  if (error) return <div className="container"><h1>{error}</h1><Link to="/">Create a poll</Link></div>;
  if (!poll) return <div className="container">Loading...</div>;

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="container">
      <h1>{poll.question}</h1>
      <div className="options">
        {poll.options.map((opt, i) => {
          const pct = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <div
              key={i}
              className={`option ${voted ? 'voted' : 'clickable'}`}
              onClick={() => !voted && vote(i)}
            >
              <div className="bar" style={{ width: `${pct}%` }} />
              <span className="text">{opt.text}</span>
              <span className="pct">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="total">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {live && <span className="live-indicator"> • Live</span>}
      </p>
      <div className="share">
        <input type="text" value={window.location.href} readOnly onClick={e => e.target.select()} />
      </div>
      <Link to="/" className="back">Create new poll</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/poll/:id" element={<Poll />} />
    </Routes>
  );
}
