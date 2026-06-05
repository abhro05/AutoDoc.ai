import React, { useState, useEffect } from "react";
import { marked } from "marked";
import "github-markdown-css/github-markdown-dark.css";
import "../styles/Generator.css";
import Navbar from "../components/Navbar";

const Generator = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [activeTab, setActiveTab] = useState("code");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // File tree states
  const [treeData, setTreeData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState({});
  const [checkedPaths, setCheckedPaths] = useState({});
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState(null);

  // GitHub Auth States
  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem("github_oauth_token") || "";
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [patInput, setPatInput] = useState("");

  // Commit Modal States
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [commitBranch, setCommitBranch] = useState("main");
  const [commitPath, setCommitPath] = useState("README.md");
  const [commitMessage, setCommitMessage] = useState("docs: generate README via AutoDoc.ai");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState(null);
  const [commitStep, setCommitStep] = useState(0); // 0: input form, 1: blob, 2: tree, 3: commit, 4: ref, 5: success

  // Listen to message events from simulated OAuth popup
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === "oauth-success") {
        const token = event.data.token;
        setGithubToken(token);
        localStorage.setItem("github_oauth_token", token);
        setAuthModalOpen(false);
      }
    };
    
    window.addEventListener("message", handleOAuthMessage);
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, []);

  const handleStartOAuth = () => {
    const width = 550;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      "/oauth-callback.html",
      "Authorize AutoDoc.ai",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=no,location=no`
    );
  };

  const handleSavePat = () => {
    const token = patInput.trim();
    if (token) {
      setGithubToken(token);
      localStorage.setItem("github_oauth_token", token);
      setPatInput("");
      setAuthModalOpen(false);
    }
  };

  const handleDisconnect = () => {
    setGithubToken("");
    localStorage.removeItem("github_oauth_token");
  };

  const handleSyncClick = () => {
    if (!githubToken) {
      setAuthModalOpen(true);
    } else {
      setCommitModalOpen(true);
    }
  };

  const parseGitHubUrl = (url) => {
    try {
      let cleanUrl = url.trim();
      // Remove trailing slash or .git
      cleanUrl = cleanUrl.replace(/\/$/, "").replace(/\.git$/, "");
      
      // Handle SSH format git@github.com:owner/repo
      if (cleanUrl.startsWith("git@")) {
        const parts = cleanUrl.split(":");
        if (parts.length === 2) {
          const repoParts = parts[1].split("/");
          if (repoParts.length >= 2) {
            return {
              owner: repoParts[repoParts.length - 2],
              repo: repoParts[repoParts.length - 1],
            };
          }
        }
      }
      
      // Handle HTTP/HTTPS format https://github.com/owner/repo
      const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);
      if (urlObj.hostname.includes("github.com")) {
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          return {
            owner: pathParts[0],
            repo: pathParts[1],
          };
        }
      }
    } catch (e) {
      console.error("URL parsing error:", e);
    }
    return null;
  };

  const buildHierarchicalTree = (files) => {
    const root = [];
    const pathMap = {};

    // Sort files to make sure parent folders are created before files
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach((file) => {
      const parts = file.path.split("/");
      let currentLevel = root;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        if (!pathMap[currentPath]) {
          const node = {
            name: part,
            path: currentPath,
            type: isLast ? file.type : "tree",
          };
          if (node.type === "tree") {
            node.children = [];
          }
          pathMap[currentPath] = node;
          currentLevel.push(node);
        }

        if (pathMap[currentPath].children) {
          currentLevel = pathMap[currentPath].children;
        }
      });
    });

    const sortTree = (nodes) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "tree" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((node) => {
        if (node.children) {
          sortTree(node.children);
        }
      });
    };
    sortTree(root);

    return root;
  };

  const loadRepositoryTree = async () => {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setTreeError("Invalid GitHub repository URL.");
      return;
    }

    setTreeLoading(true);
    setTreeError(null);
    setTreeData(null);
    setCheckedPaths({});
    setExpandedPaths({});

    try {
      // 1. Fetch default branch
      const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
      if (!repoRes.ok) {
        if (repoRes.status === 403) {
          throw new Error("rate-limit");
        }
        if (repoRes.status === 404) {
          throw new Error("not-found");
        }
        throw new Error(`api-error:${repoRes.status}`);
      }
      const repoInfo = await repoRes.json();
      const defaultBranch = repoInfo.default_branch || "main";
      setCommitBranch(defaultBranch); // auto-fill branch name

      // 2. Fetch recursive git tree
      const treeRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${defaultBranch}?recursive=1`
      );
      if (!treeRes.ok) {
        if (treeRes.status === 403) {
          throw new Error("rate-limit");
        }
        throw new Error(`api-error:${treeRes.status}`);
      }
      const treeInfo = await treeRes.json();
      if (!treeInfo.tree || !Array.isArray(treeInfo.tree)) {
        throw new Error("empty-tree");
      }

      // Convert flat tree array to hierarchical tree
      const root = buildHierarchicalTree(treeInfo.tree);
      setTreeData(root);

      // Pre-check all files by default
      const initialChecked = {};
      const initialExpanded = {};
      const selectAllPaths = (node) => {
        initialChecked[node.path] = true;
        // Expand top-level paths by default
        if (node.path.split("/").length === 1) {
          initialExpanded[node.path] = true;
        }
        if (node.children) {
          node.children.forEach(selectAllPaths);
        }
      };
      root.forEach(selectAllPaths);
      setCheckedPaths(initialChecked);
      setExpandedPaths(initialExpanded);

    } catch (err) {
      console.error(err);
      if (err.message === "rate-limit") {
        setTreeError("GitHub API rate limit exceeded. Please try again later.");
      } else if (err.message === "not-found") {
        setTreeError("Repository not found. Make sure it is public and correct.");
      } else if (err.message === "empty-tree") {
        setTreeError("The repository is empty.");
      } else {
        setTreeError("Failed to load repository tree. Check connection or URL.");
      }
    } finally {
      setTreeLoading(false);
    }
  };

  const handleCheckNode = (path, isChecked) => {
    const newChecked = { ...checkedPaths };

    // Find node in tree and set it and all descendants
    const toggleNodeAndChildren = (node) => {
      newChecked[node.path] = isChecked;
      if (node.children) {
        node.children.forEach(toggleNodeAndChildren);
      }
    };

    const findAndToggle = (nodes) => {
      for (let node of nodes) {
        if (node.path === path) {
          toggleNodeAndChildren(node);
          return true;
        }
        if (node.children && findAndToggle(node.children)) {
          return true;
        }
      }
      return false;
    };
    
    if (treeData) {
      findAndToggle(treeData);
    }

    // Update parent checked states up the tree
    const updateAncestors = (nodes) => {
      let allChecked = true;
      let anyChecked = false;

      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          const res = updateAncestors(node.children);
          newChecked[node.path] = res.allChecked;
          if (res.allChecked) {
            anyChecked = true;
          } else if (res.anyChecked) {
            anyChecked = true;
            allChecked = false;
          } else {
            allChecked = false;
          }
        } else {
          if (newChecked[node.path]) {
            anyChecked = true;
          } else {
            allChecked = false;
          }
        }
      });

      return { allChecked, anyChecked };
    };

    if (treeData) {
      updateAncestors(treeData);
    }

    setCheckedPaths(newChecked);
  };

  const getFolderCheckState = (node) => {
    let allChecked = true;
    let anyChecked = false;

    const checkRecurse = (n) => {
      if (n.type === "blob") {
        const isChecked = !!checkedPaths[n.path];
        if (isChecked) {
          anyChecked = true;
        } else {
          allChecked = false;
        }
      } else if (n.children) {
        n.children.forEach(checkRecurse);
      }
    };
    
    checkRecurse(node);

    if (allChecked) return "checked";
    if (anyChecked) return "indeterminate";
    return "unchecked";
  };

  const matchesSearch = (node, query) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    
    if (node.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    if (node.children) {
      return node.children.some(child => matchesSearch(child, query));
    }
    
    return false;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Find all checked files (leaves)
    const selectedFiles = [];
    const getCheckedFiles = (nodes) => {
      nodes.forEach(n => {
        if (n.type === "blob") {
          if (checkedPaths[n.path]) {
            selectedFiles.push(n.path);
          }
        } else if (n.children) {
          getCheckedFiles(n.children);
        }
      });
    };
    if (treeData) {
      getCheckedFiles(treeData);
    }

    setTimeout(() => {
      let fileListMarkdown = "";
      if (selectedFiles.length > 0) {
        fileListMarkdown = `\n\n## Analyzed Files\nThis documentation is generated for the following selected repository files:\n${selectedFiles.map(f => `- \`${f}\``).join("\n")}`;
      }

      setMarkdownOutput(
        `# Documentation for: ${repoUrl || "Repository"}\n\n## Overview\nThis documentation was automatically generated by AutoDoc.ai.\n\n## Installation\n\`\`\`bash\ngit clone ${repoUrl || "https://github.com/username/repository"}\ncd repository\nnpm install\n\`\`\`\n\n## Usage\nBasic usage instructions will appear here once your repository is analyzed.\n\n## API Reference\nAPI documentation will be generated automatically.\n\n## Contributing\nGuidelines for contributions will be populated based on repository analysis.${fileListMarkdown}\n`,
      );
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopyCode = () => {
    if (!markdownOutput) return;
    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownloadFile = () => {
    if (!markdownOutput) return;

    let fileName = "README.md";
    if (repoUrl) {
      try {
        const parts = repoUrl.trim().split("/");
        const repoName = parts[parts.length - 1] || parts[parts.length - 2];
        if (repoName) {
          fileName = `${repoName.replace(/\.git$/, "")}-README.md`;
        }
      } catch (error) {
        fileName = "README.md";
      }
    }

    const blob = new Blob([markdownOutput], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
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

  const handleClear = () => {
    setRepoUrl("");
    setCustomInstructions("");
    setMarkdownOutput("");
    setTreeData(null);
    setSearchQuery("");
    setExpandedPaths({});
    setCheckedPaths({});
    setTreeError(null);
  };

  const handleCommitToGitHub = async () => {
    if (!githubToken) return;

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setCommitError("Invalid repository URL.");
      return;
    }

    setIsCommitting(true);
    setCommitError(null);
    setCommitStep(0);

    const isMock = githubToken.startsWith("mock_github_oauth_token");

    if (isMock) {
      // Run mock commit sequence
      try {
        setCommitStep(1); // Creating blob
        await new Promise((r) => setTimeout(r, 800));
        setCommitStep(2); // Creating tree
        await new Promise((r) => setTimeout(r, 800));
        setCommitStep(3); // Writing commit
        await new Promise((r) => setTimeout(r, 800));
        setCommitStep(4); // Updating ref
        await new Promise((r) => setTimeout(r, 800));
        setCommitStep(5); // Success!
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        setCommitError("Mock push failed unexpectedly.");
      } finally {
        setIsCommitting(false);
      }
    } else {
      // Run real GitHub database API commit sequence
      try {
        const headers = {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        };

        const branch = commitBranch || "main";

        setCommitStep(1); // Fetching reference details and Creating Blob

        // Fetch latest commit SHA of the branch
        const refRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/ref/heads/${branch}`,
          { headers }
        );
        if (!refRes.ok) {
          throw new Error(`Failed to fetch branch reference (Status ${refRes.status})`);
        }
        const refData = await refRes.json();
        const latestCommitSha = refData.object.sha;

        // Fetch last commit data to get its Tree SHA
        const commitRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/commits/${latestCommitSha}`,
          { headers }
        );
        if (!commitRes.ok) {
          throw new Error(`Failed to fetch commit details (Status ${commitRes.status})`);
        }
        const commitData = await commitRes.json();
        const baseTreeSha = commitData.tree.sha;

        // Create blob
        const blobRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/blobs`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              content: markdownOutput,
              encoding: "utf-8",
            }),
          }
        );
        if (!blobRes.ok) {
          throw new Error(`Failed to create blob (Status ${blobRes.status})`);
        }
        const blobData = await blobRes.json();
        const newBlobSha = blobData.sha;

        setCommitStep(2); // Creating Tree

        // Create new tree based on parent tree SHA
        const treeRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              base_tree: baseTreeSha,
              tree: [
                {
                  path: commitPath || "README.md",
                  mode: "100644",
                  type: "blob",
                  sha: newBlobSha,
                },
              ],
            }),
          }
        );
        if (!treeRes.ok) {
          throw new Error(`Failed to create tree structure (Status ${treeRes.status})`);
        }
        const treeDataRes = await treeRes.json();
        const newTreeSha = treeDataRes.sha;

        setCommitStep(3); // Writing Commit

        // Create commit referencing parents
        const createCommitRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/commits`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              message: commitMessage || "docs: generate README via AutoDoc.ai",
              tree: newTreeSha,
              parents: [latestCommitSha],
            }),
          }
        );
        if (!createCommitRes.ok) {
          throw new Error(`Failed to create commit object (Status ${createCommitRes.status})`);
        }
        const newCommitData = await createCommitRes.json();
        const newCommitSha = newCommitData.sha;

        setCommitStep(4); // Updating Reference

        // Update branch ref to point to new commit
        const updateRefRes = await fetch(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/refs/heads/${branch}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              sha: newCommitSha,
              force: false,
            }),
          }
        );
        if (!updateRefRes.ok) {
          throw new Error(`Failed to update branch reference (Status ${updateRefRes.status})`);
        }

        setCommitStep(5); // Success!
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(err);
        setCommitError(err.message || "Failed to commit changes. Check repository permissions.");
      } finally {
        setIsCommitting(false);
      }
    }
  };

  const renderCheckbox = (node) => {
    if (node.type === "blob") {
      const isChecked = !!checkedPaths[node.path];
      return (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => handleCheckNode(node.path, e.target.checked)}
          className="tree-checkbox"
          aria-label={`Select file ${node.name}`}
        />
      );
    } else {
      const checkState = getFolderCheckState(node);
      return (
        <input
          type="checkbox"
          checked={checkState === "checked"}
          ref={(el) => {
            if (el) {
              el.indeterminate = checkState === "indeterminate";
            }
          }}
          onChange={(e) => handleCheckNode(node.path, e.target.checked)}
          className="tree-checkbox"
          aria-label={`Select folder ${node.name}`}
        />
      );
    }
  };

  const renderTreeNode = (node, depth = 0) => {
    const matches = matchesSearch(node, searchQuery);
    if (!matches) return null;

    const isFolder = node.type === "tree";
    const isExpanded = !!expandedPaths[node.path] || !!searchQuery;

    return (
      <div key={node.path} className="tree-node-wrapper">
        <div 
          className="tree-node-item" 
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {isFolder ? (
            <button
              onClick={() => {
                setExpandedPaths(prev => ({ ...prev, [node.path]: !prev[node.path] }));
              }}
              className="tree-expander"
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              <svg
                className={`chevron-icon ${isExpanded ? "expanded" : ""}`}
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
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          ) : (
            <span className="tree-leaf-indent" />
          )}

          {renderCheckbox(node)}

          <span className="tree-node-icon">
            {isFolder ? (
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
                className="folder-icon"
                aria-hidden="true"
              >
                <path d="M20 5h-9.586L8.414 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2z"></path>
              </svg>
            ) : (
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                height="1.1em"
                width="1.1em"
                xmlns="http://www.w3.org/2000/svg"
                className="file-icon"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            )}
          </span>

          <span className="tree-node-name">{node.name}</span>
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="tree-node-children">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="generator-container">
      <Navbar />

      <main className="workspace">
        {/* Left Column: Interactive File Tree Explorer */}
        <div className="file-tree-panel">
          <h3 className="panel-subtitle">Repository Files</h3>
          {treeLoading ? (
            <div className="tree-loading">
              <span className="spinner"></span>
              <span>Fetching repository structure...</span>
            </div>
          ) : treeError ? (
            <div className="tree-error">
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                height="1.5em"
                width="1.5em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{treeError}</span>
            </div>
          ) : treeData ? (
            <>
              <div className="tree-actions">
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tree-search-input"
                  aria-label="Filter repository files"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="tree-search-clear"
                    aria-label="Clear filter"
                  >
                    &times;
                  </button>
                )}
              </div>
              <div className="tree-container">
                {treeData.map(node => renderTreeNode(node))}
              </div>
            </>
          ) : (
            <div className="tree-placeholder">
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                height="2.5em"
                width="2.5em"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
              <span>Enter a repository URL and click "Load Tree" to view files.</span>
            </div>
          )}
        </div>

        {/* Middle Column: Configuration Panel */}
        <div className="control-panel">
          <h2 className="panel-title">Repository Configuration</h2>

          <div className="input-group">
            <label htmlFor="repo-url">GitHub Repository URL</label>
            <div className="repo-url-input-wrapper">
              <input
                id="repo-url"
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="text-input"
              />
              <button
                onClick={loadRepositoryTree}
                disabled={!repoUrl || treeLoading}
                className="btn btn-secondary load-tree-btn"
                type="button"
              >
                {treeLoading ? "Loading..." : "Load Tree"}
              </button>
            </div>
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
            />
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
                  Generating...
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

          {githubToken && (
            <div className="github-auth-status animate-fade-in">
              <span className="status-dot"></span>
              <span className="status-text">Connected to GitHub</span>
              <button className="btn-disconnect" onClick={handleDisconnect} aria-label="Disconnect GitHub">
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Output Panel */}
        <div className="output-panel">
          <div className="output-header">
            <div className="output-header-left">
              <h3>Generated Documentation</h3>
              <div className="tabs">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`tab-button ${activeTab === "code" ? "active" : ""}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`tab-button ${activeTab === "preview" ? "active" : ""}`}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="output-header-actions">
              {/* Sync / Commit Button */}
              <div className="tooltip-wrapper">
                <button
                  onClick={handleSyncClick}
                  disabled={!markdownOutput}
                  className={`btn-copy-icon btn-sync-icon ${githubToken ? "authenticated" : ""}`}
                  aria-label="Commit to GitHub"
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1.1em"
                    width="1.1em"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
                <span className="tooltip-text">
                  {githubToken ? "Commit to GitHub" : "Connect GitHub"}
                </span>
              </div>

              <div className={`tooltip-wrapper ${copied ? "show-success" : ""}`}>
                <button
                  onClick={handleCopyCode}
                  disabled={!markdownOutput}
                  className="btn-copy-icon"
                  aria-label="Copy code"
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
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <span className="tooltip-text">{copied ? "Copied!" : "Copy Code"}</span>
              </div>

              <div className={`tooltip-wrapper ${downloaded ? "show-success" : ""}`}>
                <button
                  onClick={handleDownloadFile}
                  disabled={!markdownOutput}
                  className="btn-copy-icon"
                  aria-label="Download file"
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
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <span className="tooltip-text">{downloaded ? "Downloaded!" : "Download File"}</span>
              </div>
            </div>
          </div>
          {activeTab === "code" ? (
            <pre className="output-content">
              <code>{markdownOutput || "# Your documentation will appear here..."}</code>
            </pre>
          ) : (
            <div
              className="output-content markdown-body"
              dangerouslySetInnerHTML={{
                __html: marked.parse(markdownOutput || "# Your documentation will appear here..."),
              }}
            />
          )}
        </div>
      </main>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="modal-backdrop" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect to GitHub</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setAuthModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Connect your GitHub account to commit generated documentation directly to your repository.
              </p>
              
              <button 
                onClick={handleStartOAuth}
                className="btn btn-primary oauth-connect-btn"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.86 2.33.66.07-.52.28-.86.51-1.06-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                Connect via GitHub (Simulated)
              </button>

              <div className="modal-divider">
                <span>OR</span>
              </div>

              <div className="input-group text-left">
                <label htmlFor="pat-token">GitHub Personal Access Token (PAT)</label>
                <input
                  id="pat-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  className="text-input"
                />
              </div>

              <button
                onClick={handleSavePat}
                disabled={!patInput.trim()}
                className="btn btn-secondary pat-save-btn"
              >
                Use Access Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commit Modal */}
      {commitModalOpen && (
        <div className="modal-backdrop" onClick={() => !isCommitting && setCommitModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Commit to GitHub</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => !isCommitting && setCommitModalOpen(false)}
                disabled={isCommitting}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="modal-body text-left">
              {commitStep === 0 && (
                <>
                  <div className="input-group">
                    <label htmlFor="commit-branch">Target Branch</label>
                    <input
                      id="commit-branch"
                      type="text"
                      placeholder="main"
                      value={commitBranch}
                      onChange={(e) => setCommitBranch(e.target.value)}
                      className="text-input"
                      disabled={isCommitting}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="commit-path">Target File Path</label>
                    <input
                      id="commit-path"
                      type="text"
                      placeholder="README.md"
                      value={commitPath}
                      onChange={(e) => setCommitPath(e.target.value)}
                      className="text-input"
                      disabled={isCommitting}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="commit-msg">Commit Message</label>
                    <input
                      id="commit-msg"
                      type="text"
                      placeholder="docs: generate README via AutoDoc.ai"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="text-input"
                      disabled={isCommitting}
                    />
                  </div>

                  {commitError && (
                    <div className="commit-modal-error">
                      <span>{commitError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCommitToGitHub}
                    disabled={isCommitting || !markdownOutput}
                    className="btn btn-primary commit-submit-btn"
                  >
                    Push Commit
                  </button>
                </>
              )}

              {commitStep > 0 && (
                <div className="commit-progress-container">
                  <h4 className="progress-title">
                    {commitStep === 5 ? "Commit Pushed Successfully!" : "Pushing Commit to GitHub..."}
                  </h4>
                  
                  <ul className="progress-steps">
                    <li className={commitStep >= 1 ? (commitStep === 1 ? "active" : "done") : ""}>
                      <span className="step-bullet"></span>
                      <span>Preparing & uploading file content...</span>
                    </li>
                    <li className={commitStep >= 2 ? (commitStep === 2 ? "active" : "done") : ""}>
                      <span className="step-bullet"></span>
                      <span>Creating tree structure...</span>
                    </li>
                    <li className={commitStep >= 3 ? (commitStep === 3 ? "active" : "done") : ""}>
                      <span className="step-bullet"></span>
                      <span>Writing commit metadata...</span>
                    </li>
                    <li className={commitStep >= 4 ? (commitStep === 4 ? "active" : "done") : ""}>
                      <span className="step-bullet"></span>
                      <span>Updating branch reference...</span>
                    </li>
                  </ul>

                  {commitStep === 5 && (
                    <div className="commit-success-animation">
                      <div className="success-icon">✓</div>
                      <button
                        onClick={() => {
                          setCommitModalOpen(false);
                          setCommitStep(0);
                        }}
                        className="btn btn-primary progress-close-btn"
                      >
                        Close Panel
                      </button>
                    </div>
                  )}

                  {commitError && (
                    <div className="commit-progress-error">
                      <span>{commitError}</span>
                      <button
                        onClick={() => {
                          setCommitStep(0);
                          setCommitError(null);
                        }}
                        className="btn btn-secondary progress-retry-btn"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generator;
