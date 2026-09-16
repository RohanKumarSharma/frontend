"use client";

import { UserPlus } from "lucide-react";

export default function UserCard({ user }) {
  return (
    <div className="user-card">
      <span className={`avatar xl ${user.color}`}>
        {user.avatar}
      </span>

      <div className="user-card-info">
        <h3>{user.name}</h3>
        <span>@{user.username}</span>
        <p>{user.bio}</p>
      </div>

      <button className="user-follow">
        <UserPlus size={16} />
        Follow
      </button>
    </div>
  );
}