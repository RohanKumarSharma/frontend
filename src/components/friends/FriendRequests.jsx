"use client";

import { Check, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/services/friendApi";

export default function FriendRequests() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  /*
   * =========================
   * LOAD FRIEND REQUESTS
   * =========================
   */

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);

        const data = await getFriendRequests();

        setRequests(data?.requests || []);
      } catch (error) {
        console.error(
          "Failed to load friend requests:",
          error.response?.data ||
            error.message
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  /*
   * =========================
   * ACCEPT REQUEST
   * =========================
   */

  const handleAccept = async (request) => {
    const requestId = request?._id;
    const requester = request?.requester;

    if (
      !requestId ||
      !requester?._id ||
      actionId
    ) {
      return;
    }

    try {
      setActionId(requestId);

      /*
       * Accept the friend request.
       *
       * Backend also creates/gets the
       * private conversation.
       */
      const data =
        await acceptFriendRequest(
          requestId
        );

      console.log(
        "Friend request accepted:",
        data
      );

      /*
       * Remove accepted request
       * from the current list.
       */
      setRequests((current) =>
        current.filter(
          (item) =>
            item._id !== requestId
        )
      );

      /*
       * Open chat with the requester.
       *
       * Chat page will create/get the
       * existing conversation using
       * this userId.
       */
      router.push(
        `/chat?userId=${requester._id}`
      );
    } catch (error) {
      console.error(
        "Accept request error:",
        error.response?.data ||
          error.message
      );
    } finally {
      setActionId(null);
    }
  };

  /*
   * =========================
   * REJECT REQUEST
   * =========================
   */

  const handleReject = async (
    requestId
  ) => {
    if (!requestId || actionId) {
      return;
    }

    try {
      setActionId(requestId);

      await rejectFriendRequest(
        requestId
      );

      setRequests((current) =>
        current.filter(
          (request) =>
            request._id !== requestId
        )
      );
    } catch (error) {
      console.error(
        "Reject request error:",
        error.response?.data ||
          error.message
      );
    } finally {
      setActionId(null);
    }
  };

  /*
   * =========================
   * RENDER
   * =========================
   */

  return (
    <section className="requests-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            CONNECTIONS
          </span>

          <h1>Friend requests</h1>

          <p>
            Manage your pending connection
            requests.
          </p>
        </div>

        <span className="count-pill">
          {requests.length} pending
        </span>
      </div>

      {/* =========================
          LOADING
      ========================= */}

      {loading ? (
        <div className="empty-state">
          <Loader2
            size={26}
            className="animate-spin"
          />

          <p>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        /* =========================
           EMPTY
        ========================= */

        <div className="empty-state">
          <h3>No friend requests</h3>

          <p>
            New friend requests will appear
            here.
          </p>
        </div>
      ) : (
        /* =========================
           REQUEST LIST
        ========================= */

        <div className="request-list">
          {requests.map((request) => {
            const user =
              request.requester;

            if (!user) {
              return null;
            }

            const initials =
              user.name
                ?.charAt(0)
                ?.toUpperCase() ||
              "U";

            const isLoading =
              actionId === request._id;

            return (
              <div
                className="request-card"
                key={request._id}
              >
                {/* =========================
                    AVATAR
                ========================= */}

                <button
                  type="button"
                  className="avatar xl purple"
                  onClick={() =>
                    router.push(
                      `/profile/${user.username}`
                    )
                  }
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={
                        user.name ||
                        "User"
                      }
                    />
                  ) : (
                    initials
                  )}
                </button>

                {/* =========================
                    USER INFO
                ========================= */}

                <button
                  type="button"
                  className="request-info"
                  onClick={() =>
                    router.push(
                      `/profile/${user.username}`
                    )
                  }
                >
                  <h3>{user.name}</h3>

                  <span>
                    @{user.username}
                  </span>
                </button>

                {/* =========================
                    ACTIONS
                ========================= */}

                <div className="request-actions">
                  {/* ACCEPT */}

                  <button
                    type="button"
                    className="accept"
                    disabled={isLoading}
                    onClick={() =>
                      handleAccept(
                        request
                      )
                    }
                  >
                    {isLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={17} />
                    )}

                    {isLoading
                      ? "Opening..."
                      : "Accept"}
                  </button>

                  {/* REJECT */}

                  <button
                    type="button"
                    className="reject"
                    disabled={isLoading}
                    onClick={() =>
                      handleReject(
                        request._id
                      )
                    }
                    title="Reject request"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}