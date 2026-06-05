import React, { useState } from "react";
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
    </div>
  );
};

export default Generator;
