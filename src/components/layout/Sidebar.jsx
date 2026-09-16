// "use client";

// import {
//   MessageCircle,
//   Search,
//   Users,
//   UserRoundPlus,
//   LogOut,
//   X,
// } from "lucide-react";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// import { logoutUser } from "@/services/authApi";
// import { getFriendRequests } from "@/services/friendApi";
// import { disconnectSocket } from "@/socket/socket";

// import useChatStore from "@/store/chatStore";

// export default function Sidebar({
//   activeSection,
//   setActiveSection,
//   isMobileOpen,
//   onClose,
// }) {
//   const router = useRouter();

//   const currentUser = useChatStore(
//     (state) => state.currentUser
//   );

//   const setCurrentUser = useChatStore(
//     (state) => state.setCurrentUser
//   );

//   const [loggingOut, setLoggingOut] =
//     useState(false);

//   const [requestCount, setRequestCount] =
//     useState(0);

//   /*
//    * =========================
//    * GET FRIEND REQUEST COUNT
//    * =========================
//    */

//   useEffect(() => {
//     const fetchRequestCount = async () => {
//       try {
//         const data =
//           await getFriendRequests();

//         const requests =
//           data?.requests || [];

//         setRequestCount(
//           requests.length
//         );
//       } catch (error) {
//         console.error(
//           "Failed to get friend requests:",
//           error.response?.data ||
//             error.message
//         );

//         setRequestCount(0);
//       }
//     };

//     fetchRequestCount();
//   }, [activeSection]);

//   /*
//    * =========================
//    * USER DISPLAY
//    * =========================
//    */

//   const userName =
//     currentUser?.name || "User";

//   const avatar =
//     currentUser?.avatar ||
//     userName
//       .charAt(0)
//       .toUpperCase();

//   const userStatus =
//     currentUser?.isOnline === false
//       ? "Offline"
//       : "Available";

//   /*
//    * =========================
//    * NAVIGATION
//    * =========================
//    */

//   const navigation = [
//     {
//       id: "messages",
//       label: "Messages",
//       icon: MessageCircle,
//     },
//     {
//       id: "search",
//       label: "Discover",
//       icon: Search,
//     },
//     {
//       id: "friends",
//       label: "Friends",
//       icon: Users,
//     },
//     {
//       id: "requests",
//       label: "Requests",
//       icon: UserRoundPlus,
//       badge: requestCount,
//     },
//   ];

//   /*
//    * =========================
//    * NAVIGATION CLICK
//    * =========================
//    */

//   const handleNavigation = (section) => {
//     setActiveSection(section);

//     /*
//      * Close mobile sidebar
//      * after selecting a section.
//      */

//     if (onClose) {
//       onClose();
//     }
//   };

//   /*
//    * =========================
//    * LOGOUT
//    * =========================
//    */

//   const handleLogout = async () => {
//     if (loggingOut) {
//       return;
//     }

//     try {
//       setLoggingOut(true);

//       disconnectSocket();

//       await logoutUser();

//       setCurrentUser(null);

//       router.replace("/login");
//     } catch (error) {
//       console.error(
//         "Sidebar logout failed:",
//         error.response?.data ||
//           error.message
//       );

//       disconnectSocket();

//       setCurrentUser(null);

//       router.replace("/login");
//     } finally {
//       setLoggingOut(false);
//     }
//   };

//   return (
//     <aside
//       className={`sidebar ${
//         isMobileOpen
//           ? "sidebar-mobile-open"
//           : ""
//       }`}
//     >
//       {/* =========================
//           MOBILE CLOSE BUTTON
//       ========================= */}

//       <button
//         type="button"
//         className="sidebar-mobile-close"
//         onClick={onClose}
//         aria-label="Close navigation menu"
//       >
//         <X size={21} />
//       </button>

//       {/* =========================
//           NAVIGATION
//       ========================= */}

//       <div className="sidebar-nav">
//         <p className="sidebar-label">
//           Workspace
//         </p>

//         {navigation.map((item) => {
//           const Icon = item.icon;

//           return (
//             <button
//               key={item.id}
//               type="button"
//               className={`sidebar-item ${
//                 activeSection === item.id
//                   ? "active"
//                   : ""
//               }`}
//               onClick={() =>
//                 handleNavigation(
//                   item.id
//                 )
//               }
//             >
//               <Icon size={19} />

//               <span>
//                 {item.label}
//               </span>

//               {item.badge > 0 && (
//                 <span className="sidebar-badge">
//                   {item.badge}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* =========================
//           SIDEBAR BOTTOM
//       ========================= */}

//       <div className="sidebar-bottom">
//         {/* LOGOUT */}

//         <button
//           type="button"
//           className="sidebar-item logout"
//           onClick={handleLogout}
//           disabled={loggingOut}
//         >
//           <LogOut size={19} />

//           <span>
//             {loggingOut
//               ? "Logging out..."
//               : "Logout"}
//           </span>
//         </button>

//         {/* CURRENT USER */}

//         <div className="sidebar-user">
//           <span className="avatar purple">
//             {currentUser?.avatar ? (
//               <img
//                 src={currentUser.avatar}
//                 alt={userName}
//               />
//             ) : (
//               avatar
//             )}
//           </span>

//           <div>
//             <strong>
//               {userName}
//             </strong>

//             <small>
//               {userStatus}
//             </small>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }


"use client";

import {
  MessageCircle,
  Search,
  Users,
  UserRoundPlus,
  LogOut,
  X,
  Bot,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { logoutUser } from "@/services/authApi";
import { getFriendRequests } from "@/services/friendApi";
import { disconnectSocket } from "@/socket/socket";

import useChatStore from "@/store/chatStore";

export default function Sidebar({
  activeSection,
  setActiveSection,
  isMobileOpen,
  onClose,
}) {
  const router = useRouter();

  const currentUser = useChatStore(
    (state) => state.currentUser
  );

  const setCurrentUser = useChatStore(
    (state) => state.setCurrentUser
  );

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [requestCount, setRequestCount] =
    useState(0);

  /*
   * =========================
   * GET FRIEND REQUEST COUNT
   * =========================
   */

  useEffect(() => {
    const fetchRequestCount = async () => {
      try {
        const data =
          await getFriendRequests();

        const requests =
          data?.requests || [];

        setRequestCount(
          requests.length
        );
      } catch (error) {
        console.error(
          "Failed to get friend requests:",
          error.response?.data ||
            error.message
        );

        setRequestCount(0);
      }
    };

    fetchRequestCount();
  }, [activeSection]);

  /*
   * =========================
   * USER DISPLAY
   * =========================
   */

  const userName =
    currentUser?.name || "User";

  const avatar =
    currentUser?.avatar ||
    userName
      .charAt(0)
      .toUpperCase();

  const userStatus =
    currentUser?.isOnline === false
      ? "Offline"
      : "Available";

  /*
   * =========================
   * NAVIGATION
   * =========================
   */

  const navigation = [
    {
      id: "messages",
      label: "Messages",
      icon: MessageCircle,
    },
    {
      id: "search",
      label: "Discover",
      icon: Search,
    },
    {
      id: "friends",
      label: "Friends",
      icon: Users,
    },
    {
      id: "requests",
      label: "Requests",
      icon: UserRoundPlus,
      badge: requestCount,
    },
  ];

  /*
   * =========================
   * NAVIGATION CLICK
   * =========================
   */

  const handleNavigation = (section) => {
    setActiveSection(section);

    /*
     * Close mobile sidebar
     * after selecting a section.
     */

    if (onClose) {
      onClose();
    }
  };

  /*
   * =========================
   * AI CHAT NAVIGATION
   * =========================
   */

  const handleAIChat = () => {
    router.push("/ai-chat");

    if (onClose) {
      onClose();
    }
  };

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
        "Sidebar logout failed:",
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

  return (
    <aside
      className={`sidebar ${
        isMobileOpen
          ? "sidebar-mobile-open"
          : ""
      }`}
    >
      {/* =========================
          MOBILE CLOSE BUTTON
      ========================= */}

      <button
        type="button"
        className="sidebar-mobile-close"
        onClick={onClose}
        aria-label="Close navigation menu"
      >
        <X size={21} />
      </button>

      {/* =========================
          NAVIGATION
      ========================= */}

      <div className="sidebar-nav">
        <p className="sidebar-label">
          Workspace
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${
                activeSection === item.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigation(
                  item.id
                )
              }
            >
              <Icon size={19} />

              <span>
                {item.label}
              </span>

              {item.badge > 0 && (
                <span className="sidebar-badge">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* =========================
            AI CHAT
        ========================= */}

        <button
          type="button"
          className="sidebar-item"
          onClick={handleAIChat}
          style={{
            marginTop: "28px",
          }}
        >
          <Bot size={19} />

          <span>
            AI Chat
          </span>
        </button>
      </div>

      {/* =========================
          SIDEBAR BOTTOM
      ========================= */}

      <div className="sidebar-bottom">
        {/* LOGOUT */}

        <button
          type="button"
          className="sidebar-item logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={19} />

          <span>
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </span>
        </button>

        {/* CURRENT USER */}

        <div className="sidebar-user">
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
              {userStatus}
            </small>
          </div>
        </div>
      </div>
    </aside>
  );
}