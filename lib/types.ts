export type ReplyPreview = {
  msgId: string;
  name: string;
  preview: string;
};

export type Reactions = Record<string, string[]>;

export type EncryptedEnvelope = {
  ciphertext: string;
  iteration: number;
  signingKey: string;
  signature: string;
};

export type SenderKeyDistribution = {
  ephemeralPublicKey: string;
  senderIdentityKey: string;
  encryptedState: string;
};

export type ChatMessage =
  | { type: "msg"; msgId: string; name: string; text: string; time: string; reactions?: Reactions; replyTo?: ReplyPreview }
  | { type: "encrypted_msg"; msgId: string; name: string; envelope: EncryptedEnvelope; time: string; reactions?: Reactions }
  | { type: "system"; text: string; time: string };

export type Room = { name: string; userCount: number };

export type DisplayMessage =
  | { type: "msg"; msgId: string; name: string; text: string; time: string; replyTo?: ReplyPreview; reactions: Reactions }
  | { type: "pending"; msgId: string; name: string; time: string; reactions: Reactions }
  | { type: "system"; text: string; time: string };

export type ServerEvent =
  | { type: "msg"; msgId: string; name: string; text: string; time: string; reactions?: Reactions; replyTo?: ReplyPreview }
  | { type: "encrypted_msg"; msgId: string; name: string; envelope: EncryptedEnvelope; time: string; reactions?: Reactions }
  | { type: "system"; text: string; time: string }
  | { type: "history"; messages: ChatMessage[] }
  | { type: "user_list"; users: string[] }
  | { type: "room_list"; rooms: Room[] }
  | { type: "room_changed"; room: string }
  | { type: "typing"; name: string }
  | { type: "reaction"; msgId: string; emoji: string; users: string[] }
  | { type: "key_distribution"; from: string; room: string; payload: SenderKeyDistribution }
  | { type: "notify"; room: string };
