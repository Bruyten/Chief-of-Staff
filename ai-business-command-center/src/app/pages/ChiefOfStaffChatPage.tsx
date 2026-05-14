import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../AppContext";
import { AppShell } from "../layout/AppShell";
import { Badge, Button, Card, EmptyState, Input, Textarea } from "../ui/Primitives";
import {
  brandVoices,
  chiefChat,
  friendlyError,
  type BrandVoiceProfile,
  type ChatConversation,
  type ChatMessage,
} from "../lib/apiClient";

const STARTER_PROMPTS = [
  "What should I market this week?",
  "Build a campaign around this offer.",
  "What content should I create next?",
  "Review this project and tell me what is missing.",
];

export function ChiefOfStaffChatPage() {
  const {
    mode,
    toast,
    params,
    projects,
    user,
    setCreditsLocal,
  } = useApp();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [brandProfiles, setBrandProfiles] = useState<BrandVoiceProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    typeof params.projectId === "string" ? params.projectId : ""
  );
  const [selectedBrandProfileId, setSelectedBrandProfileId] = useState(
    typeof params.brandVoiceProfileId === "string" ? params.brandVoiceProfileId : ""
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mode === "mock") {
      setConversations([]);
      setBrandProfiles([]);
      return;
    }

    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, sending]);

  async function loadInitialData() {
    setLoading(true);

    try {
      const [chatResponse, brandResponse] = await Promise.all([
        chiefChat.list(),
        brandVoices.list(),
      ]);

      setConversations(chatResponse.conversations);
      setBrandProfiles(brandResponse.profiles);

      if (chatResponse.conversations.length > 0) {
        await openConversation(chatResponse.conversations[0].id);
      }
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(id: string) {
    try {
      const response = await chiefChat.get(id);
      setActiveConversation(response.conversation);
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  async function createConversation() {
    if (creatingConversation) return;

    setCreatingConversation(true);

    try {
      if (mode === "mock") {
        const now = new Date().toISOString();

        const conversation: ChatConversation = {
          id: `chat_${Date.now()}`,
          userId: "u_demo",
          projectId: selectedProjectId || null,
          brandVoiceProfileId: selectedBrandProfileId || null,
          title: newTitle.trim() || "New Chief of Staff Chat",
          archivedAt: null,
          lastMessageAt: null,
          createdAt: now,
          updatedAt: now,
          project: projects.find((project) => project.id === selectedProjectId)
            ? {
                id: selectedProjectId,
                name: projects.find((project) => project.id === selectedProjectId)?.name ?? "",
                emoji: projects.find((project) => project.id === selectedProjectId)?.emoji ?? null,
              }
            : null,
          brandVoiceProfile: null,
          messages: [],
        };

        setConversations((current) => [conversation, ...current]);
        setActiveConversation(conversation);
        setNewTitle("");
        toast("Mock conversation created");
        return;
      }

      const response = await chiefChat.create({
        title: newTitle.trim() || undefined,
        projectId: selectedProjectId || null,
        brandVoiceProfileId: selectedBrandProfileId || null,
      });

      setConversations((current) => [response.conversation, ...current]);
      setActiveConversation(response.conversation);
      setNewTitle("");
      toast("Conversation created");
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setCreatingConversation(false);
    }
  }

  async function sendMessage(contentOverride?: string) {
    const finalMessage = (contentOverride ?? message).trim();
    if (!finalMessage || sending || !activeConversation) return;

    setSending(true);

    try {
      if (mode === "mock") {
        const now = new Date().toISOString();
        const userMessage: ChatMessage = {
          id: `msg_user_${Date.now()}`,
          conversationId: activeConversation.id,
          role: "user",
          content: finalMessage,
          tokensUsed: 0,
          model: null,
          createdAt: now,
        };

        const assistantMessage: ChatMessage = {
          id: `msg_assistant_${Date.now()}`,
          conversationId: activeConversation.id,
          role: "assistant",
          content:
            "Mock Chief of Staff response: focus this week on one campaign goal, one offer angle, and one repeatable content rhythm. In live mode, this reply will use your selected campaign and brand profile context.",
          tokensUsed: 0,
          model: "mock",
          createdAt: now,
        };

        const updatedConversation: ChatConversation = {
          ...activeConversation,
          lastMessageAt: now,
          updatedAt: now,
          title: activeConversation.title || finalMessage.slice(0, 80),
          messages: [...(activeConversation.messages ?? []), userMessage, assistantMessage],
        };

        setActiveConversation(updatedConversation);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === updatedConversation.id ? updatedConversation : conversation
          )
        );
        setMessage("");
        setCreditsLocal(Math.max(user.credits - 1, 0));
        return;
      }

      const response = await chiefChat.sendMessage(activeConversation.id, finalMessage);

      const updatedConversation: ChatConversation = {
        ...activeConversation,
        updatedAt: new Date().toISOString(),
        lastMessageAt: response.assistantMessage.createdAt,
        messages: [
          ...(activeConversation.messages ?? []),
          response.userMessage,
          response.assistantMessage,
        ],
      };

      setActiveConversation(updatedConversation);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === updatedConversation.id
            ? {
                ...conversation,
                updatedAt: updatedConversation.updatedAt,
                lastMessageAt: updatedConversation.lastMessageAt,
                title: conversation.title || finalMessage.slice(0, 80),
              }
            : conversation
        )
      );

      setCreditsLocal(response.creditsRemaining);
      setMessage("");
    } catch (error) {
      toast(friendlyError(error), "danger");
    } finally {
      setSending(false);
    }
  }

  async function deleteConversation(conversation: ChatConversation) {
    const confirmed = window.confirm(`Delete "${conversation.title || "Untitled conversation"}"?`);
    if (!confirmed) return;

    try {
      if (mode === "live") {
        await chiefChat.delete(conversation.id);
      }

      setConversations((current) => current.filter((entry) => entry.id !== conversation.id));
      if (activeConversation?.id === conversation.id) {
        setActiveConversation(null);
      }

      toast("Conversation deleted", "info");
    } catch (error) {
      toast(friendlyError(error), "danger");
    }
  }

  const conversationMessages = activeConversation?.messages ?? [];

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const selectedBrandProfile = useMemo(
    () => brandProfiles.find((profile) => profile.id === selectedBrandProfileId),
    [brandProfiles, selectedBrandProfileId]
  );

  return (
    <AppShell
      title="Chief of Staff Chat"
      subtitle="Strategic marketing guidance with optional campaign and brand context."
      action={<Badge>{user.credits} text credits left</Badge>}
    >
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold">Start a New Conversation</h2>
            <p className="mt-1 text-sm text-white/45">
              Attach project and brand context before the first message.
            </p>

            <div className="mt-4 space-y-4">
              <Input
                label="Optional conversation title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="e.g. Weekly campaign planning"
              />

              <label className="space-y-2 block">
                <div className="text-sm text-white/70">Project / Campaign</div>
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">No project selected</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.emoji} {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 block">
                <div className="text-sm text-white/70">Brand Voice Profile</div>
                <select
                  value={selectedBrandProfileId}
                  onChange={(event) => setSelectedBrandProfileId(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">No brand profile selected</option>
                  {brandProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.brandName}
                    </option>
                  ))}
                </select>
              </label>

              {(selectedProject || selectedBrandProfile) && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/60">
                  {selectedProject ? <div>Project: {selectedProject.name}</div> : null}
                  {selectedBrandProfile ? <div>Brand: {selectedBrandProfile.brandName}</div> : null}
                </div>
              )}

              <Button className="w-full" loading={creatingConversation} onClick={() => void createConversation()}>
                Start Conversation
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Previous Conversations</h2>
              <Badge>{conversations.length}</Badge>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-white/55">Loading conversations…</div>
            ) : conversations.length === 0 ? (
              <div className="mt-4 text-sm text-white/45">No conversations yet.</div>
            ) : (
              <div className="mt-4 space-y-2">
                {conversations.map((conversation) => {
                  const active = activeConversation?.id === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      className={`rounded-2xl border p-3 transition ${
                        active
                          ? "border-violet-400/40 bg-violet-400/[0.08]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void openConversation(conversation.id)}
                        className="w-full text-left"
                      >
                        <div className="truncate font-medium">
                          {conversation.title || "Untitled conversation"}
                        </div>
                        <div className="mt-1 truncate text-xs text-white/45">
                          {conversation.project?.name ?? "No project"} ·{" "}
                          {conversation.brandVoiceProfile?.brandName ?? "No brand profile"}
                        </div>
                      </button>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void deleteConversation(conversation)}
                          className="text-xs text-white/45 hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="min-h-[720px] flex flex-col">
          {!activeConversation ? (
            <EmptyState
              icon="🧠"
              title="Start or select a conversation"
              description="This chat is designed to help with campaigns, priorities, offer positioning, and next-best marketing moves."
            />
          ) : (
            <>
              <div className="border-b border-white/10 pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {activeConversation.title || "Chief of Staff Conversation"}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeConversation.project ? <Badge>{activeConversation.project.name}</Badge> : null}
                      {activeConversation.brandVoiceProfile ? (
                        <Badge>{activeConversation.brandVoiceProfile.brandName}</Badge>
                      ) : null}
                    </div>
                  </div>

                  <Badge>1 text credit per assistant reply</Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-5 space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-white/55">
                      Try one of these strategic starting prompts:
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          type="button"
                          key={prompt}
                          onClick={() => void sendMessage(prompt)}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm text-white/75 hover:bg-white/[0.07] transition"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  conversationMessages.map((chatMessage) => (
                    <MessageBubble key={chatMessage.id} message={chatMessage} />
                  ))
                )}

                {sending ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
                    Chief of Staff is thinking…
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>

              <div className="border-t border-white/10 pt-4">
                <Textarea
                  label="Message"
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask for a campaign plan, next-best marketing action, project review, or content priorities..."
                />
                <div className="mt-3 flex justify-end">
                  <Button disabled={!message.trim() || sending} loading={sending} onClick={() => void sendMessage()}>
                    Send Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const userMessage = message.role === "user";

  return (
    <div className={`flex ${userMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl rounded-2xl border px-4 py-3 ${
          userMessage
            ? "border-violet-400/30 bg-violet-500/20"
            : "border-white/10 bg-white/[0.03]"
        }`}
      >
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
          {userMessage ? "You" : "Chief of Staff"}
        </div>
        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">{message.content}</div>
      </div>
    </div>
  );
}
