"use client";

import {
  MessageCircle,
  UserMinus,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getFriends,
  removeFriend,
} from "@/services/friendApi";

import useChatStore from "@/store/chatStore";

export default function FriendsList() {
  const router = useRouter();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const onlineUsers = useChatStore(
    (state) => state.onlineUsers
  );

  const lastSeenUsers = useChatStore(
    (state) => state.lastSeenUsers
  );

  // =========================
  // LOAD FRIENDS
  // =========================

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const data = await getFriends();

        setFriends(data?.friends || []);
      } catch (error) {
        console.error(
          "Failed to load friends:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  // =========================
  // ONLINE STATUS
  // =========================

  const isOnline = (userId) => {
    return onlineUsers.includes(userId?.toString());
  };

  const getLastSeen = (userId) => {
    const lastSeen =
      lastSeenUsers[userId?.toString()];

    if (!lastSeen) {
      return "Offline";
    }

    return `Last seen ${new Date(
      lastSeen
    ).toLocaleString()}`;
  };

  // =========================
  // PROFILE
  // =========================

  const openProfile = (username) => {
    if (!username) return;

    router.push(`/profile/${username}`);
  };

  // =========================
  // MESSAGE
  // =========================

  // const handleMessage = (friend) => {
  //    console.log("MESSAGE CLICKED:", friend);
  // console.log("FRIEND ID:", friend?._id);
  //   if (!friend?._id) return;

  //   router.push(`/chat?userId=${friend._id}`);
  // };

  const handleMessage = (friend) => {
  console.log("MESSAGE CLICKED:", friend);
  console.log("FRIEND ID:", friend?._id);

  if (!friend?._id) return;

  const url = `/chat?userId=${friend._id}`;

  console.log("NAVIGATING TO:", url);

  router.push(url);
};

  // =========================
  // REMOVE FRIEND
  // =========================

  const handleRemove = async (friend) => {
    if (!friend?._id) return;

    const confirmRemove = window.confirm(
      `Remove ${friend.name} from your friends?`
    );

    if (!confirmRemove) return;

    try {
      setActionId(friend._id);

      await removeFriend(friend._id);

      setFriends((current) =>
        current.filter(
          (item) => item._id !== friend._id
        )
      );
    } catch (error) {
      console.error(
        "Failed to remove friend:",
        error.response?.data || error.message
      );
    } finally {
      setActionId(null);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="friends-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              NETWORK
            </span>

            <h1>Your friends</h1>

            <p>
              People you&apos;re connected with.
            </p>
          </div>
        </div>

        <div className="empty-state">
          <Loader2
            size={26}
            className="animate-spin"
          />

          <p>Loading friends...</p>
        </div>
      </section>
    );
  }

  // =========================
  // EMPTY
  // =========================

  if (friends.length === 0) {
    return (
      <section className="friends-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              NETWORK
            </span>

            <h1>Your friends</h1>

            <p>
              People you&apos;re connected with.
            </p>
          </div>

          <span className="count-pill">
            0 friends
          </span>
        </div>

        <div className="empty-state">
          <h3>No friends yet</h3>

          <p>
            Search for people and send them
            a friend request.
          </p>
        </div>
      </section>
    );
  }

  // =========================
  // FRIENDS
  // =========================

  return (
    <section className="friends-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            NETWORK
          </span>

          <h1>Your friends</h1>

          <p>
            People you&apos;re connected with.
          </p>
        </div>

        <span className="count-pill">
          {friends.length}{" "}
          {friends.length === 1
            ? "friend"
            : "friends"}
        </span>
      </div>

      <div className="friends-grid">
        {friends.map((friend) => {
          const online = isOnline(friend._id);

          const actionLoading =
            actionId === friend._id;

          const initials =
            friend.name
              ?.charAt(0)
              .toUpperCase() || "U";

          return (
            <div
              className="friend-card"
              key={friend._id}
            >
              {/* =========================
                  CARD TOP
              ========================= */}

              <div className="friend-card-top">
                <button
                  type="button"
                  className="avatar-wrapper"
                  onClick={() =>
                    openProfile(friend.username)
                  }
                  aria-label={`Open ${friend.name}'s profile`}
                >
                  <span className="avatar xl purple">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name || "User"}
                      />
                    ) : (
                      initials
                    )}
                  </span>

                  {online && (
                    <span className="online-dot" />
                  )}
                </button>

                <span className="online-text">
                  {online
                    ? "Online"
                    : getLastSeen(friend._id)}
                </span>
              </div>

              {/* =========================
                  PROFILE INFO
              ========================= */}

              <button
                type="button"
                className="friend-profile-info"
                onClick={() =>
                  openProfile(friend.username)
                }
              >
                <h3>
                  {friend.name || "User"}
                </h3>

                <span>
                  @{friend.username || "user"}
                </span>
              </button>

              {/* =========================
                  ACTIONS
              ========================= */}

              <div className="friend-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleMessage(friend)
                  }
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <MessageCircle size={16} />
                  )}

                  Message
                </button>

                <button
                  type="button"
                  className="remove"
                  onClick={() =>
                    handleRemove(friend)
                  }
                  disabled={actionLoading}
                  title="Remove friend"
                  aria-label="Remove friend"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}