"use client";

import {
  Search,
  UserPlus,
  UserCheck,
  UserMinus,
  MessageCircle,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SearchUsers() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========================
  // SEARCH USERS
  // =========================

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);

        const response = await axios.get(
          `${API}/users/search?q=${encodeURIComponent(
            query.trim()
          )}`,
          {
            withCredentials: true,
          }
        );

        const searchResults =
          response.data.users || [];

        /*
         * Search API returns basic user information.
         * Fetch each user's profile to get
         * current relationship status.
         */

        const usersWithRelationship =
          await Promise.all(
            searchResults.map(async (user) => {
              try {
                const profileResponse =
                  await axios.get(
                    `${API}/users/${user.username}`,
                    {
                      withCredentials: true,
                    }
                  );

                const profileData =
                  profileResponse.data;

                return {
                  ...user,
                  relationship:
                    profileData.relationship || {
                      isFollowing: false,
                      isFriend: false,
                      friendRequestStatus: null,
                    },
                };
              } catch (error) {
                console.error(
                  `Failed to load relationship for @${user.username}:`,
                  error.response?.data ||
                    error.message
                );

                return {
                  ...user,
                  relationship: {
                    isFollowing: false,
                    isFriend: false,
                    friendRequestStatus: null,
                  },
                };
              }
            })
          );

        setUsers(usersWithRelationship);
      } catch (error) {
        console.error(
          "Search users error:",
          error.response?.data ||
            error.message
        );

        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(
      searchUsers,
      300
    );

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="discover-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            DISCOVER
          </span>

          <h1>Find people</h1>

          <p>
            Connect with people and grow your
            network.
          </p>
        </div>
      </div>

      <div className="large-search">
        <Search size={20} />

        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search by name or username..."
          autoFocus
        />
      </div>

      <div className="user-results">
        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className="empty-state">
            <Loader2
              size={26}
              className="animate-spin"
            />

            <p>Searching...</p>
          </div>
        )}

        {/* =========================
            EMPTY SEARCH RESULT
        ========================= */}

        {!loading &&
          query.trim() &&
          users.length === 0 && (
            <div className="empty-state">
              <div>⌕</div>

              <h3>No users found</h3>

              <p>
                Try another name or username.
              </p>
            </div>
          )}

        {/* =========================
            USERS
        ========================= */}

        {!loading &&
          users.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onProfile={() =>
                router.push(
                  `/profile/${user.username}`
                )
              }
            />
          ))}
      </div>
    </section>
  );
}

/*
 * =========================
 * USER CARD
 * =========================
 */

function UserCard({
  user,
  onProfile,
}) {
  const router = useRouter();

  const [relationship, setRelationship] =
    useState(
      user.relationship || {
        isFollowing: false,
        isFriend: false,
        friendRequestStatus: null,
      }
    );

  const [friendLoading, setFriendLoading] =
    useState(false);

  const [followLoading, setFollowLoading] =
    useState(false);

  const initials =
    user.name
      ?.charAt(0)
      ?.toUpperCase() || "U";

  // =========================
  // FRIEND REQUEST
  // =========================

  const handleFriendRequest = async () => {
    if (
      !user._id ||
      friendLoading ||
      relationship.isFriend ||
      relationship.friendRequestStatus ===
        "pending"
    ) {
      return;
    }

    try {
      setFriendLoading(true);

      await axios.post(
        `${API}/friends/request`,
        {
          receiverId: user._id,
        },
        {
          withCredentials: true,
        }
      );

      setRelationship((previous) => ({
        ...previous,
        friendRequestStatus: "pending",
      }));
    } catch (error) {
      console.error(
        "Friend request failed:",
        error.response?.data ||
          error.message
      );
    } finally {
      setFriendLoading(false);
    }
  };

  // =========================
  // FOLLOW / UNFOLLOW
  // =========================

  const handleFollow = async () => {
    if (
      !user._id ||
      followLoading
    ) {
      return;
    }

    try {
      setFollowLoading(true);

      if (relationship.isFollowing) {
        await axios.delete(
          `${API}/follow/${user._id}`,
          {
            withCredentials: true,
          }
        );

        setRelationship((previous) => ({
          ...previous,
          isFollowing: false,
        }));
      } else {
        await axios.post(
          `${API}/follow/${user._id}`,
          {},
          {
            withCredentials: true,
          }
        );

        setRelationship((previous) => ({
          ...previous,
          isFollowing: true,
        }));
      }
    } catch (error) {
      console.error(
        "Follow action failed:",
        error.response?.data ||
          error.message
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // =========================
  // MESSAGE
  // =========================

  const handleMessage = () => {
    if (!user?._id) return;

    router.push(
      `/chat?userId=${user._id}`
    );
  };

  // =========================
  // FRIEND BUTTON
  // =========================

  const renderFriendButton = () => {
    if (relationship.isFriend) {
      return (
        <button
          className="user-follow following"
          type="button"
          disabled
        >
          <UserCheck size={16} />
          Friends
        </button>
      );
    }

    if (
      relationship.friendRequestStatus ===
      "pending"
    ) {
      return (
        <button
          className="user-follow following"
          type="button"
          disabled
        >
          <UserCheck size={16} />
          Request Sent
        </button>
      );
    }

    return (
      <button
        className="user-follow"
        type="button"
        onClick={handleFriendRequest}
        disabled={friendLoading}
      >
        {friendLoading ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />
            Sending...
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Add Friend
          </>
        )}
      </button>
    );
  };

  return (
    <div className="user-card">
      {/* =========================
          AVATAR
      ========================= */}

      <button
        type="button"
        onClick={onProfile}
        className="avatar xl purple"
        aria-label={`Open ${user.name || "user"} profile`}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || "User"}
          />
        ) : (
          initials
        )}
      </button>

      {/* =========================
          USER INFO
      ========================= */}

      <div className="user-card-info">
        <button
          type="button"
          onClick={onProfile}
          className="user-profile-info"
        >
          <h3>
            {user.name || "User"}
          </h3>

          <span>
            @{user.username || "user"}
          </span>
        </button>

        {user.bio && (
          <p>{user.bio}</p>
        )}

        <small>
          {user.followers || 0} followers
        </small>
      </div>

      {/* =========================
          ACTIONS
      ========================= */}

      <div className="user-card-actions">
        {/* MESSAGE */}

        <button
          className="user-message"
          type="button"
          onClick={handleMessage}
          title="Message"
          aria-label={`Message ${user.name || "user"}`}
        >
          <MessageCircle size={17} />
        </button>

        {/* FOLLOW */}

        <button
          className={`user-follow ${
            relationship.isFollowing
              ? "following"
              : ""
          }`}
          type="button"
          onClick={handleFollow}
          disabled={followLoading}
        >
          {followLoading ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : relationship.isFollowing ? (
            <>
              <UserMinus size={16} />
              Following
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Follow
            </>
          )}
        </button>

        {/* FRIEND */}

        {renderFriendButton()}
      </div>
    </div>
  );
}