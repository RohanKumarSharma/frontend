"use client";

import {
  ArrowLeft,
  CalendarDays,
  MessageCircle,
  UserPlus,
  UserCheck,
  X,
} from "lucide-react";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();

  const username = params?.username;

  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    friends: 0,
  });

  const [relationship, setRelationship] = useState({
    isFollowing: false,
    isFriend: false,
    friendRequestStatus: null,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [followLoading, setFollowLoading] =
    useState(false);

  const [friendLoading, setFriendLoading] =
    useState(false);

  // =========================
  // FETCH PROFILE
  // =========================

  useEffect(() => {
    if (!username) {
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API}/users/${username}`,
          {
            withCredentials: true,
          }
        );

        const data = response.data;

        console.log(
          "Profile data:",
          data
        );

        console.log(
          "Is Friend:",
          data.relationship?.isFriend
        );

        console.log(
          "Request Status:",
          data.relationship
            ?.friendRequestStatus
        );

        setProfile({
          ...data.user,
          isOwnProfile:
            data.isOwnProfile,
        });

        setStats(
          data.stats || {
            followers: 0,
            following: 0,
            friends: 0,
          }
        );

        setRelationship(
          data.relationship || {
            isFollowing: false,
            isFriend: false,
            friendRequestStatus: null,
          }
        );
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // =========================
  // CLOSE PROFILE
  // =========================

  const handleClose = () => {
    router.push("/chat");
  };

  // =========================
  // FOLLOW / UNFOLLOW
  // =========================

  const handleFollow = async () => {
    if (
      !profile?._id ||
      profile.isOwnProfile ||
      followLoading
    ) {
      return;
    }

    try {
      setFollowLoading(true);

      if (relationship.isFollowing) {
        await axios.delete(
          `${API}/follow/${profile._id}`,
          {
            withCredentials: true,
          }
        );

        setRelationship(
          (previous) => ({
            ...previous,
            isFollowing: false,
          })
        );

        setStats(
          (previous) => ({
            ...previous,
            followers: Math.max(
              0,
              previous.followers - 1
            ),
          })
        );
      } else {
        await axios.post(
          `${API}/follow/${profile._id}`,
          {},
          {
            withCredentials: true,
          }
        );

        setRelationship(
          (previous) => ({
            ...previous,
            isFollowing: true,
          })
        );

        setStats(
          (previous) => ({
            ...previous,
            followers:
              previous.followers + 1,
          })
        );
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
  // FRIEND REQUEST
  // =========================

  const handleFriendRequest = async () => {
    console.log(
      "FRIEND BUTTON CLICKED"
    );

    if (
      !profile?._id ||
      profile.isOwnProfile ||
      friendLoading
    ) {
      return;
    }

    // Already friends
    if (relationship.isFriend) {
      return;
    }

    // Request already sent
    if (
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
          receiverId: profile._id,
        },
        {
          withCredentials: true,
        }
      );

      setRelationship(
        (previous) => ({
          ...previous,
          friendRequestStatus:
            "pending",
        })
      );
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
  // OPEN CHAT
  // =========================

  const handleMessage = () => {
    if (!profile?._id) {
      return;
    }

    router.push(
      `/chat?userId=${profile._id}`
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="profile-page">
        <button
          type="button"
          className="profile-back"
          onClick={handleClose}
        >
          <ArrowLeft size={18} />
          Back to messages
        </button>

        <section className="profile-card">
          <div className="profile-cover" />

          <div className="profile-content">
            <div className="profile-avatar">
              ...
            </div>

            <div className="profile-main">
              <div className="profile-loading">
                Loading profile...
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error || !profile) {
    return (
      <main className="profile-page">
        <button
          type="button"
          className="profile-back"
          onClick={handleClose}
        >
          <ArrowLeft size={18} />
          Back to messages
        </button>

        <section className="profile-card">
          <div className="profile-error">
            <h2>
              {error || "User not found"}
            </h2>

            <button
              type="button"
              className="profile-message"
              onClick={handleClose}
            >
              Go to messages
            </button>
          </div>
        </section>
      </main>
    );
  }

  // =========================
  // USER INFO
  // =========================

  const isOwnProfile =
    profile.isOwnProfile === true;

  const userName =
    profile.name || "User";

  const userUsername =
    profile.username || username;

  const avatarLetter =
    userName.charAt(0).toUpperCase();

  const joinedDate = profile.createdAt
    ? new Date(
        profile.createdAt
      ).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      )
    : "September 2026";

  // =========================
  // FRIEND BUTTON TEXT
  // =========================

  let friendButtonText =
    "Add Friend";

  if (relationship.isFriend) {
    friendButtonText = "Friends";
  } else if (
    relationship.friendRequestStatus ===
    "pending"
  ) {
    friendButtonText =
      "Request Sent";
  }

  // =========================
  // RENDER
  // =========================

  return (
    <main className="profile-page">
      {/* =========================
          BACK
      ========================= */}

      <button
        type="button"
        className="profile-back"
        onClick={handleClose}
      >
        <ArrowLeft size={18} />
        Back to messages
      </button>

      {/* =========================
          PROFILE CARD
      ========================= */}

      <section className="profile-card">
        {/* =========================
            CLOSE BUTTON
        ========================= */}

        <button
          type="button"
          className="profile-close-button"
          onClick={handleClose}
          aria-label="Close profile"
        >
          <X size={19} />
        </button>

        {/* =========================
            COVER
        ========================= */}

        <div className="profile-cover" />

        <div className="profile-content">
          {/* =========================
              AVATAR
          ========================= */}

          <div className="profile-avatar">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={userName}
              />
            ) : (
              avatarLetter
            )}
          </div>

          <div className="profile-main">
            {/* =========================
                NAME + ACTIONS
            ========================= */}

            <div className="profile-name-row">
              <div>
                <h1>{userName}</h1>

                <p>
                  @{userUsername}
                </p>
              </div>

              {/* =========================
                  OTHER USER ACTIONS
              ========================= */}

              {!isOwnProfile && (
                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-message"
                    onClick={
                      handleMessage
                    }
                  >
                    <MessageCircle
                      size={17}
                    />
                    Message
                  </button>

                  <button
                    type="button"
                    className="profile-follow"
                    onClick={
                      handleFollow
                    }
                    disabled={
                      followLoading
                    }
                  >
                    {relationship.isFollowing ? (
                      <>
                        <UserCheck
                          size={17}
                        />

                        {followLoading
                          ? "..."
                          : "Following"}
                      </>
                    ) : (
                      <>
                        <UserPlus
                          size={17}
                        />

                        {followLoading
                          ? "..."
                          : "Follow"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* =========================
                BIO
            ========================= */}

            {profile.bio && (
              <p className="profile-bio">
                {profile.bio}
              </p>
            )}

            {/* =========================
                JOINED
            ========================= */}

            <div className="profile-meta">
              <span>
                <CalendarDays
                  size={16}
                />
                Joined {joinedDate}
              </span>
            </div>

            {/* =========================
                REAL STATS
            ========================= */}

            <div className="profile-stats">
              <div>
                <strong>
                  {stats.followers}
                </strong>

                <span>
                  Followers
                </span>
              </div>

              <div>
                <strong>
                  {stats.following}
                </strong>

                <span>
                  Following
                </span>
              </div>

              <div>
                <strong>
                  {stats.friends}
                </strong>

                <span>
                  Friends
                </span>
              </div>
            </div>

            {/* =========================
                FRIEND ACTION
            ========================= */}

            {!isOwnProfile && (
              <>
                {relationship.isFriend ? (
                  <button
                    type="button"
                    className="friend-button friend-added"
                    disabled
                  >
                    <UserCheck
                      size={17}
                    />
                    Friends
                  </button>
                ) : (
                  <button
                    type="button"
                    className="friend-button"
                    onClick={
                      handleFriendRequest
                    }
                    disabled={
                      friendLoading ||
                      relationship.friendRequestStatus ===
                        "pending"
                    }
                  >
                    <UserPlus
                      size={17}
                    />

                    {friendLoading
                      ? "Sending..."
                      : relationship.friendRequestStatus ===
                          "pending"
                        ? "Request Sent"
                        : "Add Friend"}
                  </button>
                )}
              </>
            )}

            {/* =========================
                OWN PROFILE
            ========================= */}

            {isOwnProfile && (
              <div className="own-profile-label">
                <span>
                  This is your profile
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}