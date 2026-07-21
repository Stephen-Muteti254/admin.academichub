import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useSupportChat } from "@/contexts/SupportChatContext";
import api from "@/lib/api";
import { useFileViewer } from "@/hooks/useFileViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  sender: "user" | "admin" | { role: string };
  content: string;
  timestamp?: string;
  sending?: boolean;
  failed?: boolean;
  attachments?: {
    id: string;
    url: string;
    filename: string;
    mime: string;
  }[];
}


interface SupportChat {
  id: string;
  user: {
    id: string;
    name: string;
    role: "client" | "writer";
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: "open" | "resolved";
}


export default function AdminSupport() {
  const { toast } = useToast();
  const { chats, setChats, refreshChats } = useSupportChat();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const scrollAreaRef = useRef<any>(null);
  const selectedChat = chats.find(c => c.id === selectedChatId) || null;
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loadingChats, setLoadingChats] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const chatListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    previewFile,
    openPreview,
    closePreview,
    downloadFile,
  } = useFileViewer();

  const filteredChats = chats.filter(
    (chat) =>
      chat.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedChatId) return;

    const tempId = "temp-" + Date.now();

    const tempMsg = {
      id: tempId,
      sender: { role: "admin" },
      content: replyMessage,
      sending: true,
    };

    setMessages(prev => [...prev, tempMsg]);
    setReplyMessage("");

    try {
      const res = await api.post(
        `/support-chat/${selectedChatId}/messages`,
        { content: replyMessage }
      );

      setMessages(prev =>
        prev.map(m => (m.id === tempId ? res.data : m))
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, failed: true } : m
        )
      );
    }
  };


  const handleResolveChat = async (chatId: string) => {
    await api.post(`/support-chat/${chatId}/resolve`);

    setChats(prev =>
      prev.map(c =>
        c.id === chatId ? { ...c, status: "resolved" } : c
      )
    );
  };


  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "high":
      case "open":
        return "destructive";
      case "medium":
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    fetchMessages(chatId);
  };

  useEffect(() => {
    loadChats(1);
  }, []);


  useEffect(() => {
    const viewport = scrollAreaRef.current?.getElement?.();
    const end = messagesEndRef.current;
    if (!viewport || !end) return;

    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [messages, selectedChatId]);



  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.getElement();
    if (!viewport) return;
    requestAnimationFrame(() => viewport.scrollTop = viewport.scrollHeight);
  }, [messages, selectedChatId]);



  const handleScroll = () => {
    const el = chatListRef.current;
    if (!el || loadingChats || !hasNextPage) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      loadChats(page + 1);
    }
  };


  const loadChats = async (nextPage = 1) => {
    if (loadingChats || !hasNextPage) return;

    setLoadingChats(true);
    try {
      const res = await api.get("/support-chat", {
        params: { page: nextPage, limit: 20 }
      });

      console.log(res.data);

      const newChats = res.data.chats || [];
      setChats(prev => nextPage === 1 ? newChats : [...prev, ...newChats]);

      const pagination = res.data?.data?.pagination;
      setHasNextPage(pagination?.has_next ?? false);
      setPage(nextPage);
    } catch (err) {
      toast({ title: "Error loading chats", description: err.message, variant: "destructive" });
    } finally {
      setLoadingChats(false);
    }
  };


  const renderAttachment = (att: Message["attachments"][0]) => {
    const isImage = att.mime.startsWith("image/");
    const isPdf = att.mime === "application/pdf";

    const handleClick = () => {
      if (isImage || isPdf) {
        openPreview(att.url, att.filename);
      } else {
        downloadFile(att.url, att.filename);
      }
    };

    return (
      <button
        key={att.id}
        onClick={handleClick}
        className="mt-1 w-full flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-left text-xs hover:bg-muted transition-colors"
      >
        <span className="flex-1 truncate underline underline-offset-2 text-primary/70">
          {att.filename}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {isImage ? "Image" : isPdf ? "PDF" : "File"}
        </span>
      </button>
    );
  };



  const fetchMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/support-chat/${chatId}/messages`);
      setMessages(res.data?.messages || []);

      await api.post(`/support-chat/${chatId}/mark-read`);

      setChats(prev =>
        prev.map(c =>
          c.id === chatId ? { ...c, unread_count: 0 } : c
        )
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const viewport = scrollAreaRef.current?.getElement?.();
    if (!viewport) return;

    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [messages, selectedChatId]);

  return (
    <div className="flex h-[100vh] overflow-hidden">
      {/* Chat List */}
      <Card className="flex flex-col w-1/3 border-0 border-r border-border rounded-none h-full">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-lg text-3xl font-bold text-foreground">
            Support
          </CardTitle>
          {/* <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea ref={chatListRef} onScroll={handleScroll} className="h-full">
            <div className="space-y-1 p-3">
              {loadingChats && (
                <div className="text-center text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  Loading chats...
                </div>
              )}
              {chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedChatId === chat.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="font-medium">
                      {chat.user.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({chat.user.role})
                      </span>
                    </p>
                    {chat.unread_count > 0 && (
                      <Badge variant="destructive">{chat.unread_count}</Badge>
                    )}
                  </div>
                  <p className="text-xs opacity-70">{chat.last_message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col rounded-none border-0 overflow-hidden min-h-0">
        {selectedChat ? (
          <>
            {/* Header */}
            <CardHeader className="border-b shrink-0">
              <div>
                <CardTitle>{selectedChat.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedChat.user.name} ({selectedChat.user.role})
                </p>
              </div>
            </CardHeader>

            {/* Main content area */}
            <div className="flex flex-col flex-1 min-h-0">
              <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground">No messages</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => {
                      const isAdmin = m.sender?.role === "admin" || m.sender?.role === "super_admin";
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                          {/*<div className={`p-3 rounded-lg max-w-[70%] ${
                            isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}>
                            <p>{m.content}</p>
                            {m.sending && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                          </div>*/}
                          <div className={`p-3 rounded-lg max-w-[70%] ${isAdmin ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                            {m.attachments?.map(renderAttachment)}
                            {m.sending && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                            {m.failed && <p className="text-[10px] text-red-400 mt-1">Failed to send</p>}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input bar */}
              <div className="border-t p-4 flex gap-2 shrink-0">
                <Textarea
                  placeholder="Type your reply..."
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a chat to view messages</p>
          </CardContent>
        )}
      </Card>
      <Dialog open={!!previewFile} onOpenChange={closePreview}>
        <DialogContent
          forceMount
          className="z-50 m-0 p-0 gap-0 w-full h-full max-w-none bg-background border-none rounded-none overflow-hidden flex flex-col"
        >
          <DialogHeader className="flex items-center justify-between border-b bg-background/90 backdrop-blur-md px-6 py-2 shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {previewFile?.name || "Preview"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-muted/10 relative">
            {previewFile?.type === "loading" && (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}

            {previewFile?.type === "pdf" && previewFile.url && (
              <iframe
                src={`${previewFile.url}#toolbar=0`}
                className="w-full h-full border-0 bg-white"
              />
            )}

            {previewFile?.type === "image" && previewFile.url && (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {(previewFile?.type === "document" ||
              previewFile?.type === "other") && (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  Preview unavailable for this file type.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadFile(previewFile.rawUrl, previewFile.name)
                  }
                >
                  Download
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
