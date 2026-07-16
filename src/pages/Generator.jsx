import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "../styles/Generator.css";
import Navbar from "../components/Navbar";
import useLocalStorage from '../utils/useLocalStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const parseGitHubUrl = (url) => {
  const trimmed = url.trim();
  if (!trimmed) return { isValid: false, owner: '', repo: '' };

  const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+)(?:\/.*)?$/;
  const match = trimmed.match(regex);

  if (match) {
    let owner = match[1];
    let repo = match[2];
    
    if (repo.endsWith('.git')) {
      repo = repo.slice(0, -4);
    }
    
    return { isValid: true, owner, repo };
  }

  return { isValid: false, owner: '', repo: '' };
};

const PHASE_LABELS = {
  queued: "Queued",
  starting: "Starting",
  fetching_tree: "Fetching Repository Tree",
  fetching_files: "Fetching Files",
  generating: "Generating Documentation",
  completed: "Completed",
  failed: "Failed",
};

const PHASE_ORDER = ["queued", "starting", "fetching_tree", "fetching_files", "generating", "completed"];

const Generator = () => {
  useEffect(() => {
    document.title = "Workspace | AutoDoc.ai";
  }, []);

  // --- REFACTORED STATE USING CUSTOM HOOK ---
  const [repoUrl, setRepoUrl] = useLocalStorage("autodoc_repo_url", "");
  const [customInstructions, setCustomInstructions] = useLocalStorage("autodoc_custom_instructions", "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [markdownOutput, setMarkdownOutput] = useLocalStorage("autodoc_markdown_output", "");
  const [versionHistory, setVersionHistory] = useLocalStorage("autodoc_version_history", []);
  // ------------------------------------------

  const [activeTab, setActiveTab] = useState('code');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  // Job progress state
  const [jobPhase, setJobPhase] = useState('');
  const [jobMessage, setJobMessage] = useState('');
  const [jobProgress, setJobProgress] = useState({ filesProcessed: 0, totalFiles: 0 });
  const eventSourceRef = useRef(null);

  const savedGenRef = useRef(false);

  const saveGeneration = useCallback(async (markdown) => {
    const trimmed = repoUrl.trim();
    if (!trimmed || !markdown) return;
    savedGenRef.current = true;
    try {
      const parsed = parseGitHubUrl(trimmed);
      await axios.post(`${API_BASE_URL}/api/generations`, {
        repoUrl: trimmed,
        repoOwner: parsed.isValid ? parsed.owner : '',
        repoName: parsed.isValid ? parsed.repo : '',
        customInstructions,
        markdown,
        status: 'completed',
      });
    } catch {
      /* silent */
    }
  }, [repoUrl, customInstructions]);

  const [previousMarkdown, setPreviousMarkdown] = useState("");
  
  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleUrlChange = (e) => {
    setRepoUrl(e.target.value);
    if (error) {
      setError('');
    }
  };

  // Preview renderer
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    if (activeTab !== 'preview') {
      return undefined;
    }

    const renderPreview = async () => {
      await new Promise(resolve => { timeoutId = setTimeout(resolve, 150); });
      if (!isMounted) return;

      setIsPreviewLoading(true);
      const [{ marked }, DOMPurify] = await Promise.all([
        import("marked"),
        import("dompurify"),
        import("github-markdown-css/github-markdown-dark.css"),
      ]);

      if (!isMounted) return;

      const source = markdownOutput || '# Your documentation will appear here...';
      setPreviewHtml(DOMPurify.default.sanitize(marked.parse(source)));
      setIsPreviewLoading(false);
    };

    renderPreview();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [activeTab, markdownOutput]);

  // Connect to job status via SSE
  const connectToJobStatus = useCallback((jobId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/job-status?id=${encodeURIComponent(jobId)}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setJobPhase(data.phase || '');
        setJobMessage(data.message || '');
        setJobProgress(data.progress || { filesProcessed: 0, totalFiles: 0 });

        if (data.markdown) {
          setMarkdownOutput(data.markdown);
        }

        if (data.status === "completed") {
          const md = data.markdown || '';
          setMarkdownOutput(md);
          if (previousMarkdown && data.markdown && previousMarkdown !== data.markdown) {
            setVersionHistory((prev) => [
              {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                repoUrl,
                content: previousMarkdown,
              },
              ...prev,
            ]);
          }

          setMarkdownOutput(data.markdown || '');
          setIsGenerating(false);
          setJobPhase('completed');
          setJobMessage('Documentation generated successfully!');
          es.close();
          if (!savedGenRef.current && md) {
            saveGeneration(md);
          }
        } else if (data.status === "failed") {
          setError(data.error || data.message || "Generation failed.");
          setIsGenerating(false);
          setJobPhase('failed');
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 400);
          es.close();
        }
      } catch (_) {
        /* ignore parse errors */
      }
    };

    es.onerror = () => {
      setError("Lost connection to job status stream. Please try again.");
      setIsGenerating(false);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [previousMarkdown, repoUrl, setMarkdownOutput, setVersionHistory]);

  const handleGenerate = async () => {
    const trimmedUrl = repoUrl.trim();
    if (!trimmedUrl) {
      setError('Please enter a GitHub repository URL.');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
      return;
    }

    const parsed = parseGitHubUrl(trimmedUrl);
    if (!parsed.isValid) {
      setError('Invalid GitHub URL. Expected format: https://github.com/owner/repository');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
      return;
    }

    setIsGenerating(true);
    setJobPhase('queued');
    setJobMessage('Submitting job...');
    setJobProgress({ filesProcessed: 0, totalFiles: 0 });
    setPreviousMarkdown(markdownOutput);
    setMarkdownOutput('');
    setError('');

    try {
      const response = await fetch('/api/generate-readme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: trimmedUrl,
          customInstructions,
          async: true,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            errMsg = parsed.error || parsed.message || errMsg;
          } catch (_) {
            /* non-JSON error body, keep basic message */
          }
        }
        throw new Error(errMsg);
      }

      if (!text) {
        throw new Error('Empty response received from server');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Invalid JSON response from server');
      }

      if (data.jobId) {
        savedGenRef.current = false;
        connectToJobStatus(data.jobId);
      } else if (data.markdown) {
        // Synchronous fallback
        if (previousMarkdown && previousMarkdown !== data.markdown) {
          setVersionHistory((prev) => [
            {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              repoUrl,
              content: previousMarkdown,
            },
            ...prev,
          ]);
        }
        setMarkdownOutput(data.markdown);
        setIsGenerating(false);
        setJobPhase('completed');
        saveGeneration(data.markdown);
      }
    } catch (e) {
      setError(e.message);
      setIsGenerating(false);
      setJobPhase('');
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
    }
  };

  const restoreVersion = (version) => {
    setMarkdownOutput(version.content);
  };

  const handleClear = () => {
    setRepoUrl("");
    setCustomInstructions("");
    setMarkdownOutput("");
    setJobPhase('');
    setJobMessage('');
    setJobProgress({ filesProcessed: 0, totalFiles: 0 });
    setError('');
    savedGenRef.current = false;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error("Fallback copy command was unsuccessful");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textArea);
  };

  const handleCopyCode = () => {
    if (!markdownOutput) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(markdownOutput)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy via navigator.clipboard, trying fallback:", err);
          fallbackCopyText(markdownOutput);
        });
    } else {
      fallbackCopyText(markdownOutput);
    }
  };

  const extractRepoName = (url) => {
    if (!url) return "";
    try {
      let cleanUrl = url.trim();
      cleanUrl = cleanUrl.split("?")[0].split("#")[0];
      cleanUrl = cleanUrl.replace(/\/$/, "");

      if (cleanUrl.startsWith("git@") || cleanUrl.includes("@")) {
        const parts = cleanUrl.split(":");
        if (parts.length >= 2) {
          const path = parts[parts.length - 1];
          const pathParts = path.split("/").filter(Boolean);
          if (pathParts.length >= 2) {
            const treeIndex = pathParts.indexOf("tree");
            const blobIndex = pathParts.indexOf("blob");
            let repoIdx = pathParts.length - 1;
            if (treeIndex !== -1 && treeIndex > 0) {
              repoIdx = treeIndex - 1;
            } else if (blobIndex !== -1 && blobIndex > 0) {
              repoIdx = blobIndex - 1;
            }
            const repoName = pathParts[repoIdx];
            if (repoName) {
              return repoName.replace(/\.git$/, "");
            }
          } else if (pathParts.length === 1) {
            return pathParts[0].replace(/\.git$/, "");
          }
        }
      }

      let urlString = cleanUrl;
      if (!/^https?:\/\//i.test(cleanUrl) && !/^[a-z0-9]+:\/\//i.test(cleanUrl)) {
        urlString = `https://${cleanUrl}`;
      }
      
      const parsedUrl = new URL(urlString);
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      
      if (pathParts.length > 0) {
        const treeIndex = pathParts.indexOf("tree");
        const blobIndex = pathParts.indexOf("blob");
        let repoIdx = pathParts.length - 1;
        
        if (treeIndex !== -1 && treeIndex > 0) {
          repoIdx = treeIndex - 1;
        } else if (blobIndex !== -1 && blobIndex > 0) {
          repoIdx = blobIndex - 1;
        }
        
        const repoName = pathParts[repoIdx];
        if (repoName) {
          return repoName.replace(/\.git$/, "");
        }
      }
    } catch (e) {
      console.error("Error parsing repository URL name:", e);
    }
    return "";
  };

  const handleDownloadFile = () => {
    if (!markdownOutput) return;

    let fileName = 'README.md';
    if (repoUrl) {
      const repoName = extractRepoName(repoUrl);
      if (repoName) {
        fileName = `${repoName}-README.md`;
      }
    }

    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  };

  const progressPercent = (() => {
    const phaseIdx = PHASE_ORDER.indexOf(jobPhase);
    if (phaseIdx < 0) return 0;
    const basePercent = (phaseIdx / (PHASE_ORDER.length - 1)) * 100;
    if (jobPhase === "fetching_files" && jobProgress.totalFiles > 0) {
      const filePercent = (jobProgress.filesProcessed / jobProgress.totalFiles);
      const phaseRange = 100 / (PHASE_ORDER.length - 1);
      return Math.min(basePercent + filePercent * phaseRange, 100);
    }
    return Math.min(basePercent, 100);
  })();

  return (
    <div className="generator-container">
      <Navbar />

      <main className="workspace">
        <div className="control-panel">
          <h2 className="panel-title">Repository Configuration</h2>

          <div className="input-group">
            <label htmlFor="repo-url">GitHub Repository URL</label>
            <input
              id="repo-url"
              type="url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={handleUrlChange}
              className={`text-input ${error ? 'input-error' : ''} ${shouldShake ? 'shake' : ''}`}
            />
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span> {error}
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="custom-instructions">
              Custom Instructions (Optional)
            </label>
            <textarea
              id="custom-instructions"
              placeholder="Add any specific requirements or focus areas for the documentation..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="text-textarea"
              rows={5}
              maxLength={500}
            />
            <div
              className={`char-counter ${
                customInstructions.length >= 450 ? "warning" : ""
              } ${customInstructions.length >= 500 ? "limit" : ""}`}
            >
              {customInstructions.length} / 500
            </div>
          </div>

          <div className="workspace-buttons">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn btn-primary generate-btn"
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                "Generate Documentation"
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isGenerating || (!repoUrl && !customInstructions && !markdownOutput)}
              className="btn btn-secondary clear-btn"
              aria-label="Clear workspace"
            >
              Clear
            </button>
          </div>

          {/* Job Progress Tracker */}
          {isGenerating && jobPhase && (
            <div className="job-progress-panel">
              <div className="job-progress-header">
                <span className="job-progress-phase-icon">
                  {jobPhase === "completed" ? "✓" : jobPhase === "failed" ? "✗" : "⟳"}
                </span>
                <span className="job-progress-phase-label">
                  {PHASE_LABELS[jobPhase] || jobPhase}
                </span>
              </div>
              <div className="job-progress-bar-track">
                <div
                  className={`job-progress-bar-fill ${jobPhase === "failed" ? "failed" : ""}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="job-progress-message">{jobMessage}</div>
              {jobPhase === "fetching_files" && jobProgress.totalFiles > 0 && (
                <div className="job-progress-files">
                  {jobProgress.filesProcessed} / {jobProgress.totalFiles} files fetched
                </div>
              )}
              <div className="job-progress-steps">
                {PHASE_ORDER.slice(0, -1).map((phase) => {
                  const currentIdx = PHASE_ORDER.indexOf(jobPhase);
                  const stepIdx = PHASE_ORDER.indexOf(phase);
                  const isDone = currentIdx > stepIdx;
                  const isActive = currentIdx === stepIdx;
                  return (
                    <div
                      key={phase}
                      className={`job-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
                    >
                      <span className="job-step-dot" />
                      <span className="job-step-label">{PHASE_LABELS[phase]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="output-panel">
          <div className="output-header">
            <div className="output-header-left">
              <h3>Generated Documentation</h3>
              {versionHistory.length > 0 && (
                <div className="version-history-panel">
                  <h4>Version History</h4>
                  {versionHistory.slice(0, 5).map((version) => (
                    <div key={version.id} className="version-item">
                      <span>
                        {new Date(version.timestamp).toLocaleString()}
                      </span>
                      <button
                        onClick={() => restoreVersion(version)}
                        className="btn btn-secondary"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="tabs">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="output-header-actions">
              <div className={`tooltip-wrapper ${copied ? 'show-success' : ''}`}>
                <button
                  onClick={handleCopyCode}
                  disabled={!markdownOutput}
                  className="btn-copy-icon"
                  aria-label="Copy code"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
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
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <span className="tooltip-text">{copied ? 'Copied!' : 'Copy Code'}</span>
              </div>

              <div className={`tooltip-wrapper ${downloaded ? 'show-success' : ''}`}>
                <button
                  onClick={handleDownloadFile}
                  disabled={!markdownOutput}
                  className="btn-copy-icon"
                  aria-label="Download file"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <span className="tooltip-text">{downloaded ? 'Downloaded!' : 'Download File'}</span>
              </div>
            </div>
          </div>
          {activeTab === 'code' ? (
            <pre className="output-content">
              <code>{markdownOutput || '# Your documentation will appear here...'}</code>
            </pre>
          ) : (
            <div
              className="output-content markdown-body"
              dangerouslySetInnerHTML={{
                __html: isPreviewLoading
                  ? '<p>Loading preview...</p>'
                  : previewHtml,
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Generator;