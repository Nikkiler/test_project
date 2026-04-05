export type ThemeId = "default" | "wh40k";

export interface ThemeStrings {
  appTitle: string;
  loginTitle: string;
  loginSubtitle: string;
  loginUserLabel: string;
  loginPassLabel: string;
  loginButton: (loading: boolean) => string;
  loginFooter: string;
  channelsHeader: string;
  dmHeader: string;
  usersHeader: (count: number) => string;
  newChannelPlaceholder: string;
  newDmTitle: string;
  searchDmPlaceholder: string;
  noDmText: string;
  noDmFound: string;
  disconnected: string;
  sendButton: string;
  logoutButton: string;
  adminLink: string;
  inputPlaceholderChannel: (room: string) => string;
  inputPlaceholderDm: (peer: string) => string;
  channelPrefix: string;
  dmPrefix: string;
  typingOne: (name: string) => string;
  typingMany: (names: string) => string;
  typingLots: string;
  pendingDecrypt: string;
  dismissButton: string;
}

export const THEMES: Record<ThemeId, ThemeStrings> = {
  default: {
    appTitle: "Nexus — Secure Communications",
    loginTitle: "NEXUS",
    loginSubtitle: "Secure Communications Protocol",
    loginUserLabel: "Username",
    loginPassLabel: "Password",
    loginButton: (loading) => (loading ? "Connecting…" : "Connect"),
    loginFooter: "End-to-end encrypted",
    channelsHeader: "Channels",
    dmHeader: "Direct Messages",
    usersHeader: (n) => `Online — ${n}`,
    newChannelPlaceholder: "New channel…",
    newDmTitle: "New Message",
    searchDmPlaceholder: "Search users…",
    noDmText: "No direct messages yet",
    noDmFound: "No users found",
    disconnected: "Disconnected",
    sendButton: "Send",
    logoutButton: "Log Out",
    adminLink: "Admin",
    inputPlaceholderChannel: (room) => `Message #${room}`,
    inputPlaceholderDm: (peer) => `Message ${peer}`,
    channelPrefix: "#",
    dmPrefix: "●",
    typingOne: (name) => `${name} is typing…`,
    typingMany: (names) => `${names} are typing…`,
    typingLots: "Several people are typing…",
    pendingDecrypt: "decrypting message…",
    dismissButton: "Dismiss",
  },
  wh40k: {
    appTitle: "Cogitator Terminus — Imperial Network",
    loginTitle: "COGITATOR TERMINUS",
    loginSubtitle: "Adeptus Mechanicus Authentication Protocol",
    loginUserLabel: "Identity",
    loginPassLabel: "Cipher Key",
    loginButton: (loading) => (loading ? "Authenticating..." : "Authenticate"),
    loginFooter: "— The Emperor Protects —",
    channelsHeader: "Data Nodes",
    dmHeader: "Private Vox",
    usersHeader: (n) => `Operatives — ${n}`,
    newChannelPlaceholder: "Designate new node...",
    newDmTitle: "Open Vox Channel",
    searchDmPlaceholder: "Search operatives...",
    noDmText: "No transmissions on record",
    noDmFound: "Operative not found",
    disconnected: "Link Severed",
    sendButton: "Transmit",
    logoutButton: "Terminate Session",
    adminLink: "Command",
    inputPlaceholderChannel: (room) => `Transmit to ${room}`,
    inputPlaceholderDm: (peer) => `Vox ${peer}`,
    channelPrefix: "⚔",
    dmPrefix: "◆",
    typingOne: (name) => `${name} is transmitting...`,
    typingMany: (names) => `${names} are transmitting...`,
    typingLots: "Multiple operatives transmitting...",
    pendingDecrypt: "Cogitator decrypting...",
    dismissButton: "Dismiss",
  },
};

// Avatar palettes — warm/WH40K vs cool/futuristic
export const AVATAR_COLORS: Record<ThemeId, string[]> = {
  default: [
    "#BB831B", "#0EA2C9", "#E55D02", "#503A1D",
    "#EDA622", "#0EA2C9", "#BB831B", "#E55D02",
  ],
  wh40k: [
    "#C8AA50", "#8B1A1A", "#A07830", "#6B4E20",
    "#B89040", "#7A1515", "#9A6820", "#C05010",
  ],
};
