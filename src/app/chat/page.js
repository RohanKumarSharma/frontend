"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import SearchUsers from "@/components/users/SearchUsers";
import FriendsList from "@/components/friends/FriendsList";
import FriendRequests from "@/components/friends/FriendRequests";

import { getMe } from "@/services/authApi";
import { createConversation } from "@/services/chatApi";

import useChatStore from "@/store/chatStore";

import {
  connectSocket,
  disconnectSocket,
} from "@/socket/socket";

function ChatPageContent() {
  const router = useRouter();

  const searchParams = useSearchParams();

  /*
   * Use the complete query string as the dependency.
   * This makes direct-chat navigation reliable even when
   * only ?userId= changes.
   */
  const queryString = searchParams.toString();

  const userId = new URLSearchParams(
    queryString
  ).get("userId");

  /*
   * Prevent opening the exact same conversation
   * multiple times.
   */
  const lastOpenedUserId = useRef(null);

  /*
   * =========================
   * STATES
   * =========================
   */

  const [activeSection, setActiveSection] =
    useState("messages");

  const [selectedChat, setSelectedChat] =
    useState(null);

  const [mobileView, setMobileView] =
    useState("list");

  const [
    openingConversation,
    setOpeningConversation,
  ] = useState(false);

  /*
   * =========================
   * MOBILE SIDEBAR
   * =========================
   */

  const [
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  ] = useState(false);

  /*
   * =========================
   * ZUSTAND
   * =========================
   */

  const setCurrentUser = useChatStore(
    (state) => state.setCurrentUser
  );

  const setOnlineUsers = useChatStore(
    (state) => state.setOnlineUsers
  );

  const addOnlineUser = useChatStore(
    (state) => state.addOnlineUser
  );

  const removeOnlineUser = useChatStore(
    (state) => state.removeOnlineUser
  );

  const setLastSeen = useChatStore(
    (state) => state.setLastSeen
  );

  /*
   * =========================
   * GET CURRENT USER
   * =========================
   */

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await getMe();

        console.log(
          "Current logged-in user:",
          data
        );

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
  }, [setCurrentUser]);

  /*
   * =========================
   * OPEN CHAT FROM URL
   * =========================
   */

  useEffect(() => {
    let cancelled = false;

    const openConversationFromUrl =
      async () => {
        /*
         * No direct user selected.
         */
        if (!userId) {
          lastOpenedUserId.current = null;
          return;
        }

        /*
         * Same user already opened.
         */
        if (
          lastOpenedUserId.current ===
          userId
        ) {
          return;
        }

        /*
         * Remember current direct-chat target.
         */
        lastOpenedUserId.current =
          userId;

        /*
         * Immediately switch to Messages.
         */
        setActiveSection("messages");
        setMobileView("chat");
        setIsMobileSidebarOpen(false);

        /*
         * Remove old selected chat first.
         * This prevents Test User chat from
         * remaining visible while opening Alok.
         */
        setSelectedChat(null);

        try {
          setOpeningConversation(true);

          console.log(
            "Opening conversation with user:",
            userId
          );

          const data =
            await createConversation(
              userId
            );

          console.log(
            "Create conversation response:",
            data
          );

          /*
           * If URL changed while request
           * was running, ignore this response.
           */
          if (cancelled) {
            return;
          }

          if (!data?.conversation) {
            console.error(
              "Conversation was not returned by backend."
            );

            setSelectedChat(null);
            return;
          }

          console.log(
            "Conversation opened:",
            data.conversation
          );

          setSelectedChat(
            data.conversation
          );

          setActiveSection("messages");
          setMobileView("chat");
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Failed to open conversation:",
            error.response?.data ||
              error.message
          );

          setSelectedChat(null);
        } finally {
          if (!cancelled) {
            setOpeningConversation(false);
          }
        }
      };

    openConversationFromUrl();

    return () => {
      cancelled = true;
    };
  }, [queryString, userId]);

  /*
   * =========================
   * SOCKET.IO
   * =========================
   */

  useEffect(() => {
    const socket = connectSocket();

    console.log(
      "Connecting to Socket.IO..."
    );

    /*
     * CONNECT
     */

    const handleConnect = () => {
      console.log(
        "Socket.IO connected:",
        socket.id
      );
    };

    /*
     * CONNECTION ERROR
     */

    const handleConnectError = (
      error
    ) => {
      console.error(
        "Socket.IO connection error:",
        error.message
      );
    };

    /*
     * DISCONNECT
     */

    const handleDisconnect = (
      reason
    ) => {
      console.log(
        "Socket.IO disconnected:",
        reason
      );
    };

    /*
     * INITIAL ONLINE USERS
     */

    const handleOnlineUsers = (
      users
    ) => {
      console.log(
        "Currently online users:",
        users
      );

      setOnlineUsers(users);
    };

    /*
     * USER ONLINE
     */

    const handleUserOnline = (
      data
    ) => {
      const onlineUserId =
        data?.userId;

      if (!onlineUserId) {
        return;
      }

      console.log(
        "User online:",
        onlineUserId
      );

      addOnlineUser(
        onlineUserId
      );
    };

    /*
     * USER OFFLINE
     */

    const handleUserOffline = (
      data
    ) => {
      const offlineUserId =
        data?.userId;

      if (!offlineUserId) {
        return;
      }

      console.log(
        "User offline:",
        offlineUserId
      );

      removeOnlineUser(
        offlineUserId
      );

      if (data.lastSeen) {
        setLastSeen(
          offlineUserId,
          data.lastSeen
        );
      }
    };

    /*
     * REGISTER SOCKET EVENTS
     */

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "users:online",
      handleOnlineUsers
    );

    socket.on(
      "user:online",
      handleUserOnline
    );

    socket.on(
      "user:offline",
      handleUserOffline
    );

    /*
     * CLEANUP
     */

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "users:online",
        handleOnlineUsers
      );

      socket.off(
        "user:online",
        handleUserOnline
      );

      socket.off(
        "user:offline",
        handleUserOffline
      );

      disconnectSocket();
    };
  }, [
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    setLastSeen,
  ]);

  /*
   * =========================
   * SELECT CHAT
   * =========================
   */

  const handleChatSelect = (
    chat
  ) => {
    if (!chat) {
      return;
    }

    setSelectedChat(chat);
    setActiveSection("messages");
    setMobileView("chat");

    /*
     * Close mobile sidebar
     * when chat is selected.
     */

    setIsMobileSidebarOpen(false);
  };

  /*
   * =========================
   * CLOSE CHAT
   * =========================
   */

  const handleChatBack = () => {
    setSelectedChat(null);
    setMobileView("list");

    lastOpenedUserId.current =
      null;

    /*
     * Use Next.js router instead of
     * window.history so Next router state
     * stays synchronized.
     *
     * This does NOT refresh the page.
     */

    router.replace("/chat");
  };

  /*
   * =========================
   * MOBILE MENU
   * =========================
   */

  const handleMobileMenuOpen =
    () => {
      setIsMobileSidebarOpen(true);
    };

  const handleMobileMenuClose =
    () => {
      setIsMobileSidebarOpen(false);
    };

  /*
   * =========================
   * CHANGE SECTION
   * =========================
   */

  const handleSectionChange = (
    section
  ) => {
    setActiveSection(section);

    /*
     * Close sidebar on mobile
     * after selecting a section.
     */

    setIsMobileSidebarOpen(false);

    /*
     * If user moves away from a direct
     * conversation, remove ?userId from URL.
     *
     * This keeps the Next.js router state
     * clean and prevents stale direct-chat
     * parameters.
     */

    if (section !== "messages") {
      lastOpenedUserId.current =
        null;

      if (userId) {
        router.replace("/chat");
      }

      setSelectedChat(null);
    }

    /*
     * If user opens Messages from
     * mobile sidebar, show chat list.
     */

    if (section === "messages") {
      setMobileView("list");

      /*
       * If there is an active direct-chat
       * query and the user manually opens
       * Messages, clear the direct chat.
       */

      if (userId) {
        lastOpenedUserId.current =
          null;

        router.replace("/chat");
        setSelectedChat(null);
      }
    }
  };

  /*
   * =========================
   * EFFECTIVE SECTION
   * =========================
   *
   * When ?userId exists, Messages should
   * always be displayed.
   */

  const renderedSection =
    userId
      ? "messages"
      : activeSection;

  /*
   * =========================
   * RENDER
   * =========================
   */

  return (
    <main className="app-shell">
      <Navbar
        onMenuClick={
          handleMobileMenuOpen
        }
      />

      <div className="app-layout">
        <Sidebar
          activeSection={
            renderedSection
          }
          setActiveSection={
            handleSectionChange
          }
          isMobileOpen={
            isMobileSidebarOpen
          }
          onClose={
            handleMobileMenuClose
          }
        />

        {/*
         * Mobile sidebar backdrop
         */}

        {isMobileSidebarOpen && (
          <div
            className="mobile-sidebar-backdrop"
            onClick={
              handleMobileMenuClose
            }
          />
        )}

        <section
          className={`content-panel ${
            mobileView === "chat"
              ? "mobile-chat-active"
              : ""
          }`}
        >
          {renderedSection ===
            "messages" && (
            <>
              <ChatList
                selectedChat={
                  selectedChat
                }
                onSelect={
                  handleChatSelect
                }
              />

              <ChatWindow
                chat={
                  selectedChat
                }
                onBack={
                  handleChatBack
                }
              />

              {openingConversation && (
                <div className="chat-opening-overlay">
                  Opening conversation...
                </div>
              )}
            </>
          )}

          {renderedSection ===
            "search" && (
            <SearchUsers />
          )}

          {renderedSection ===
            "friends" && (
            <FriendsList />
          )}

          {renderedSection ===
            "requests" && (
            <FriendRequests />
          )}
        </section>
      </div>
    </main>
  );
}

/*
 * =========================
 * PAGE
 * =========================
 */

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <div className="chat-opening-overlay">
            Loading chat...
          </div>
        </main>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}