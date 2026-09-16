"use client";

export default function TypingIndicator({
  userName,
  isTyping,
}) {
  if (!isTyping) {
    return null;
  }

  const avatar =
    userName?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="typing-indicator">
      <span className="typing-avatar">
        {avatar}
      </span>

      <div className="typing-bubble">
        <span />
        <span />
        <span />
      </div>

      <small>
        {userName || "User"} is
        typing...
      </small>
    </div>
  );
}