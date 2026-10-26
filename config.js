/* =====================================================================
   config.js — where the live features connect
   ===================================================================== */
window.VISHNUSTRA_CONFIG = {
  /* The Vishnustra backend (server/server.js). When the site is opened from
     "npm start", every page uses it automatically: the QR room, saving data,
     Rishi AI and Snap the Sky. */
  api: "/api",

  /* Optional: only if you ever host the site WITHOUT the Node server
     (e.g. as plain files on Netlify), the QR room can use Firebase instead.
     Leave as null when using the Node server. */
  firebase: null,

  rishiEndpoint: "/api/rishi",
  snapEndpoint: "/api/snap",
};
