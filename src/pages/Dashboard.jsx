import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const REPO_PATTERN = /github\.com\/([^/]+)\/([^/]+)/;

const extractRepoInfo = (url) => {
  const match = url.match(REPO_PATTERN);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '').replace(/\/.*$/, '') };
  }
  return null;
};

const timeAgo = (dateStr) => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasMore: false });
  const [viewingGen, setViewingGen] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    document.title = 'Dashboard | AutoDoc.ai';
  }, []);

  const fetchGenerations = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/generations?page=${page}&limit=10`);
      if (response.data.success) {
        setGenerations(response.data.generations);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load generations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setViewingGen(null);
    fetchGenerations(newPage);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this generation?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_BASE_URL}/api/generations/${id}`);
      setGenerations((prev) => prev.filter((g) => g._id !== id));
      if (viewingGen?._id === id) setViewingGen(null);
    } catch {
      setError('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-top">
            <div>
              <h1>Dashboard</h1>
              <p className="dashboard-subtitle">
                Welcome back, {user?.name || 'User'}
              </p>
            </div>
            <Link to="/generator" className="btn btn-primary dashboard-cta">
              New Generation
            </Link>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-value">{pagination.total}</span>
              <span className="stat-label">Total Generations</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {pagination.total > 0
                  ? (() => {
                      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                      return generations.filter((g) => new Date(g.createdAt).getTime() > sevenDaysAgo).length;
                    })()
                  : 0}
              </span>
              <span className="stat-label">This Week</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span className="stat-label">Account</span>
            </div>
          </div>

          {error && <div className="dashboard-error">{error}</div>}

          {loading && (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <p>Loading generations...</p>
            </div>
          )}

          {!loading && !error && generations.length === 0 && (
            <div className="dashboard-empty">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <h3>No generations yet</h3>
              <p>Generate your first documentation to see it here.</p>
              <Link to="/generator" className="btn btn-primary">Go to Generator</Link>
            </div>
          )}

          {!loading && generations.length > 0 && !viewingGen && (
            <>
              <div className="dashboard-list-header">
                <h2>Generation History</h2>
              </div>
              <div className="generations-list">
                {generations.map((gen) => {
                  const info = extractRepoInfo(gen.repoUrl);
                  return (
                    <div
                      key={gen._id}
                      className="generation-card"
                      onClick={() => setViewingGen(gen)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setViewingGen(gen); }}
                    >
                      <div className="gen-card-main">
                        <div className="gen-card-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                          </svg>
                        </div>
                        <div className="gen-card-info">
                          <span className="gen-card-name">
                            {info ? `${info.owner}/${info.repo}` : gen.repoUrl}
                          </span>
                          <span className="gen-card-meta">
                            {timeAgo(gen.createdAt)}
                            {gen.customInstructions && ' · with custom instructions'}
                          </span>
                        </div>
                      </div>
                      <div className="gen-card-actions">
                        <button
                          className="gen-card-delete"
                          onClick={(e) => { e.stopPropagation(); handleDelete(gen._id); }}
                          disabled={deleting === gen._id}
                          aria-label="Delete generation"
                        >
                          {deleting === gen._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {viewingGen && (
            <div className="gen-detail">
              <button className="gen-detail-back" onClick={() => setViewingGen(null)}>
                &larr; Back to History
              </button>
              <div className="gen-detail-header">
                <h2>{extractRepoInfo(viewingGen.repoUrl)?.repo || 'Generation Details'}</h2>
                <span className="gen-detail-date">
                  {new Date(viewingGen.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="gen-detail-url">
                <span className="detail-label">Repository:</span>
                <a href={viewingGen.repoUrl} target="_blank" rel="noopener noreferrer">
                  {viewingGen.repoUrl}
                </a>
              </div>
              {viewingGen.customInstructions && (
                <div className="gen-detail-instructions">
                  <span className="detail-label">Instructions:</span>
                  <p>{viewingGen.customInstructions}</p>
                </div>
              )}
              <div className="gen-detail-markdown">
                <span className="detail-label">Generated Documentation:</span>
                <pre className="gen-detail-code"><code>{viewingGen.markdown}</code></pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
