import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/Contributors.css";
import Navbar from "../components/Navbar";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const fallbackContributors = [
  {
    id: 1,
    login: "alice-wonder",
    avatar_url: "https://via.placeholder.com/150?text=Alice",
    contributions: 124,
    html_url: "https://github.com/alice-wonder",
  },
  {
    id: 2,
    login: "bob-builder",
    avatar_url: "https://via.placeholder.com/150?text=Bob",
    contributions: 98,
    html_url: "https://github.com/bob-builder",
  },
  {
    id: 3,
    login: "charlie-code",
    avatar_url: "https://via.placeholder.com/150?text=Charlie",
    contributions: 87,
    html_url: "https://github.com/charlie-code",
  },
  {
    id: 4,
    login: "diana-design",
    avatar_url: "https://via.placeholder.com/150?text=Diana",
    contributions: 65,
    html_url: "https://github.com/diana-design",
  },
  {
    id: 5,
    login: "edward-engineer",
    avatar_url: "https://via.placeholder.com/150?text=Edward",
    contributions: 42,
    html_url: "https://github.com/edward-engineer",
  },
];

const Contributors = () => {
  const [contributors, setContributors] = useState(fallbackContributors);
  const isOnline = useOnlineStatus();
  const [offlineNotice, setOfflineNotice] = useState(!navigator.onLine);

  useEffect(() => {
    if (!isOnline) {
      setOfflineNotice(true);
      const cachedData = localStorage.getItem("github_contributors");
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setContributors(parsedData);
          }
        } catch (parseErr) {
          console.error("Failed to parse cached contributors:", parseErr);
        }
      }
      return;
    }

    setOfflineNotice(false);
    const fetchContributors = async () => {
      try {
        const cachedData = localStorage.getItem("github_contributors");
        const cachedTime = localStorage.getItem("github_contributors_time");
        const now = Date.now();

        if (
          cachedData &&
          cachedTime &&
          now - parseInt(cachedTime, 10) < 24 * 60 * 60 * 1000
        ) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              setContributors(parsedData);
              return;
            }
          } catch (parseErr) {
            console.error(
              "Failed to parse cached contributors JSON:",
              parseErr,
            );
          }
        }

        const response = await fetch(
          "https://api.github.com/repos/abhro05/AutoDoc.ai/contributors",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setContributors(data);
          localStorage.setItem("github_contributors", JSON.stringify(data));
          localStorage.setItem("github_contributors_time", now.toString());
        }
      } catch (error) {
        console.error(
          "Error fetching contributors, falling back to cache if available:",
          error,
        );
        const cachedData = localStorage.getItem("github_contributors");
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              setContributors(parsedData);
            }
          } catch (parseErr) {
            console.error(
              "Failed to parse cached contributors JSON in fallback:",
              parseErr,
            );
          }
        }
      }
    };

    fetchContributors();
  }, [isOnline]);

  return (
    <div className="contributors-page">
      <Navbar />

      <header className="header">
        <h1>Meet Our Contributors</h1>
        <p className="subtitle">
          We thank the open‑source community for their amazing work.
        </p>
      </header>

      {offlineNotice && (
        <div className="offline-notice" role="alert">
          <div className="offline-notice-content">
            <svg
              className="offline-notice-icon"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1.2em"
              width="1.2em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>You are viewing cached contributor data because your browser is currently offline.</span>
          </div>
          <button
            onClick={() => setOfflineNotice(false)}
            className="offline-notice-close"
            aria-label="Dismiss notice"
          >
            <svg
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <section className="grid">
        {contributors.map((contributor) => (
          <div key={contributor.id} className="card">
            <img
              className="avatar"
              src={contributor.avatar_url}
              alt={contributor.login}
            />
            <h2 className="name">{contributor.login}</h2>
            <a
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="github-btn"
            >
              <svg
                height="20"
                width="20"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.86 2.33.66.07-.52.28-.86.51-1.06-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
              View Profile
            </a>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Contributors;
