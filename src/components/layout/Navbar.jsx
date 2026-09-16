"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { logoutUser, getMe } from "@/services/authApi";
import { disconnectSocket } from "@/socket/socket";

import useChatStore from "@/store/chatStore";

export default function Navbar({ onMenuClick }) {
  const router = useRouter();

  const currentUser = useChatStore(
    (state) => state.currentUser
  );

  const setCurrentUser = useChatStore(
    (state) => state.setCurrentUser
  );

  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef(null);

  /*
   * =========================
   * GET CURRENT USER
   * =========================
   */

  useEffect(() => {
    if (currentUser) {
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const data = await getMe();

        if (data?.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error(
          "Failed to get current user:",
          error.response?.data ||
            error.message
        );
      }
    };

    fetchCurrentUser();
  }, [currentUser, setCurrentUser]);

  /*
   * =========================
   * CLOSE DROPDOWN
   * =========================
   */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * =========================
   * LOGOUT
   * =========================
   */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      disconnectSocket();

      await logoutUser();

      setCurrentUser(null);

      router.replace("/login");
    } catch (error) {
      console.error(
        "Logout failed:",
        error.response?.data ||
          error.message
      );

      disconnectSocket();

      setCurrentUser(null);

      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  /*
   * =========================
   * USER DISPLAY
   * =========================
   */

  const userName =
    currentUser?.name || "User";

  const username =
    currentUser?.username
      ? `@${currentUser.username}`
      : "@user";

  const avatar =
    currentUser?.avatar ||
    userName
      .charAt(0)
      .toUpperCase();

  /*
   * =========================
   * RENDER
   * =========================
   */

  return (
    <header className="navbar">
      {/* =========================
          LEFT
      ========================= */}

      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={21} />
        </button>

        <div className="brand">
          <span className="brand-mark">
            N
          </span>

          NEXUS
        </div>
      </div>

      {/* =========================
          PROFILE
      ========================= */}

      <div className="navbar-actions">
        <div
          className="navbar-profile-wrapper"
          ref={dropdownRef}
        >
          <button
            type="button"
            className="navbar-profile"
            onClick={() =>
              setIsOpen((prev) => !prev)
            }
          >
            <span className="avatar purple">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={userName}
                />
              ) : (
                avatar
              )}
            </span>

            <div>
              <strong>
                {userName}
              </strong>

              <small>
                {username}
              </small>
            </div>

            <ChevronDown
              size={16}
              className={
                isOpen
                  ? "profile-chevron-open"
                  : ""
              }
            />
          </button>

          {/* =========================
              DROPDOWN
          ========================= */}

          {isOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-user">
                <span className="avatar purple">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={userName}
                    />
                  ) : (
                    avatar
                  )}
                </span>

                <div>
                  <strong>
                    {userName}
                  </strong>

                  <small>
                    {username}
                  </small>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              {/* PROFILE */}

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setIsOpen(false);

                  router.push(
                    `/profile/${
                      currentUser?.username ||
                      ""
                    }`
                  );
                }}
              >
                <span>
                  Profile
                </span>
              </button>

              <div className="profile-dropdown-divider" />

              {/* LOGOUT */}

              <button
                type="button"
                className="profile-dropdown-item logout-item"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={17} />

                <span>
                  {loggingOut
                    ? "Logging out..."
                    : "Logout"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}