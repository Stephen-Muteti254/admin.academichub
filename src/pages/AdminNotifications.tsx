import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Send,
  Users,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "urgent";
  recipients?: "all" | "clients" | "writers";
  sentAt: string;
  sentBy?: string;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "urgent">("info");
  const [recipients, setRecipients] = useState<"all" | "clients" | "writers">("all");
  const [senderTeam, setSenderTeam] = useState("Support Team");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications", { params: { limit: 5, all: true } });
      const data = res.data?.notifications || [];
      const formatted = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: (n.type || "info") as Notification["type"],
        recipients: n.recipients || "all",
        sentAt: n.created_at,
      }));
      setNotifications(formatted);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Send new notification
  const handleSendNotification = async () => {
    if (!title || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const res = await api.post("/notifications/send", {
        title,
        message,
        type,
        recipients,
        sender_team: senderTeam,
        user_email: recipients === "user" ? userEmail : undefined,
      });

      toast({
        title: "Notification Sent",
        description: res.data?.data?.message || "Notification successfully sent.",
      });

      // Add immediately to local state
      setNotifications((prev) => [
        {
          id: `${Date.now()}`,
          title,
          message,
          type,
          recipients,
          sentAt: new Date().toISOString(),
          sentBy: "Admin",
        },
        ...prev,
      ]);

      // Reset form
      setTitle("");
      setMessage("");
      setType("info");
      setRecipients("all");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // UI helpers
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
      case "urgent":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "urgent":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getRecipientIcon = (recipient: string) =>
    recipient === "all" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">System Notifications</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <Card className="flex flex-col h-[530px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification
            </CardTitle>
            {/*<CardDescription>
              Broadcast important messages to users
            </CardDescription>*/}
          </CardHeader>

          <CardContent className="flex-1">
            {/* Make form scrollable just like the notification list */}
            <ScrollArea className="h-[430px] pr-2">
              <div className="space-y-4 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Notification Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., System Maintenance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your notification message..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Select value={recipients} onValueChange={(v: any) => setRecipients(v)}>
                      <SelectTrigger id="recipients">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="clients">Clients Only</SelectItem>
                        <SelectItem value="writers">Writers Only</SelectItem>
                        <SelectItem value="user">Specific User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>                
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender_team">Sender Team</Label>
                  <Select value={senderTeam} onValueChange={setSenderTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sender team" />
                    </SelectTrigger>

                    <SelectContent position="popper">
                      <SelectItem value="Editorial Team">Editorial Team</SelectItem>
                      <SelectItem value="HR Team">HR Team</SelectItem>
                      <SelectItem value="Technical Team">Technical Team</SelectItem>
                      <SelectItem value="Support Team">Support Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipients === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="user_id">User Email</Label>
                    <Input
                      id="user_id"
                      placeholder="Enter User Email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>
                )}


                <Separator />

                <Button
                  className="w-full mb-6"
                  onClick={handleSendNotification}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>


        {/* Notification History */}
        <Card className="flex flex-col h-[530px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
            {/*<CardDescription>View sent notification history</CardDescription>*/}
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-[430px] pr-2">
              <div className="space-y-4 pb-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No notifications found.
                </p>
              ) : (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <Badge
                            variant={getTypeColor(notification.type) as any}
                            className="flex items-center gap-1"
                          >
                            {getTypeIcon(notification.type)}
                            {notification.type}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{notification.message}</p>

                        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getRecipientIcon(notification.recipients || "all")}
                            <span className="capitalize">
                              {notification.recipients || "all"}
                            </span>
                          </div>
                          <span>{new Date(notification.sentAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
