"use client";

import { useEffect, useState } from "react";

import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Reply,
  Trash2,
} from "lucide-react";

import {
  reactToMessage,
  deleteMessage,
} from "@/services/chatApi";

import {
  getSocket,
  connectSocket,
} from "@/socket/socket";

const reactionEmojis = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "👍",
  "🔥",
];

export default function Message({
  message,
  onReply,
  onReaction,
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isMe = message.sender === "me";
  const isRead = message.read === true;
  const replySenderName = message.replyTo?.sender?.name || "User";
  const reactions = message.reactions || [];

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) {
      connectSocket();
    }

    const handleMessageDeleted = (data) => {
      if (data?.messageId === message.id) {
        setDeleted(true);
      }
    };

    socket.on("message:deleted", handleMessageDeleted);

    return () => {
      socket.off("message:deleted", handleMessageDeleted);
    };
  }, [message.id]);

  const handleReaction = async (emoji) => {
    if (reacting || deleting || !message.id) return;

    try {
      setReacting(true);

      const response = await reactToMessage(
        message.id,
        emoji
      );

      if (response?.reactions) {
        onReaction?.(
          message.id,
          response.reactions
        );
      }

      setShowReactions(false);
    } catch (error) {
      console.error(
        "Failed to react to message:",
        error
      );
    } finally {
      setReacting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || !message.id) return;

    const confirmed = window.confirm(
      "Delete this message?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setDeleted(true);

      await deleteMessage(message.id);

      setShowReactions(false);
    } catch (error) {
      console.error(
        "Failed to delete message:",
        error
      );

      setDeleted(false);

      alert(
        error.response?.data?.message ||
          "Failed to delete message."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) return null;

  return (
    <div
      className={`message-row ${
        isMe
          ? "message-me"
          : "message-other"
      }`}
    >
      <div className="message-content">

        <div className="message-actions">

          <button
            type="button"
            onClick={() =>
              onReply?.(message)
            }
            aria-label="Reply"
            disabled={deleting}
          >
            <Reply size={14} />
          </button>

          <div className="message-more-wrapper">

            <button
              type="button"
              onClick={() =>
                setShowReactions(
                  (previous) => !previous
                )
              }
              aria-label="More options"
              disabled={deleting}
            >
              <MoreHorizontal size={14} />
            </button>

            {showReactions && (
              <div className="reaction-menu">

                {reactionEmojis.map(
                  (emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        handleReaction(emoji)
                      }
                      disabled={
                        reacting ||
                        deleting
                      }
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  )
                )}

                {/* DELETE FOR BOTH OWN AND RECEIVED MESSAGE */}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label="Delete message"
                  className="delete-message-option"
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>

              </div>
            )}

          </div>
        </div>

        {message.replyTo && (
          <div className="message-reply-preview">
            <strong>
              {replySenderName}
            </strong>

            <span>
              {message.replyTo.text}
            </span>
          </div>
        )}

        <div className="message-bubble">
          {message.text}
        </div>

        {reactions.length > 0 && (
          <div className="message-reactions">

            {reactions.map(
              (reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() =>
                    handleReaction(
                      reaction.emoji
                    )
                  }
                  disabled={
                    reacting ||
                    deleting
                  }
                  className="message-reaction"
                  aria-label={`React with ${reaction.emoji}`}
                >
                  <span>
                    {reaction.emoji}
                  </span>

                  <span>
                    {
                      reaction.users
                        ?.length || 0
                    }
                  </span>
                </button>
              )
            )}

          </div>
        )}

        <div className="message-meta">

          <span>
            {message.time}
          </span>

          {isMe &&
            (isRead ? (
              <CheckCheck
                size={14}
                className="read-icon"
              />
            ) : (
              <Check size={14} />
            ))}

        </div>

      </div>
    </div>
  );
}