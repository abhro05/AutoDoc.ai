import React, { useState, useEffect, useRef } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import "../styles/NetworkStatusBanner.css";

const NetworkStatusBanner = () => {
  const isOnline = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("online"); // "online" or "offline"
  const hasBeenOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      hasBeenOffline.current = true;
      setStatus("offline");
      setVisible(true);
    } else {
      if (hasBeenOffline.current) {
        setStatus("online");
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  if (!visible && isOnline) return null;

  return (
    <div className={`network-status-banner ${status} ${visible ? "visible" : "hidden"}`}>
      <div className="network-status-content">
        {status === "offline" ? (
          <>
            <svg
              className="network-icon"
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
            <span>You are offline. Working in offline mode.</span>
          </>
        ) : (
          <>
            <svg
              className="network-icon"
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
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 23.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>Back online! Connection restored.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusBanner;
