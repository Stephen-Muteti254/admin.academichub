import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  joined_at: string;
  totalOrders?: number;
  totalSpent?: number;
  status: "active" | "suspended";
}

export default function AdminClients() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/clients`, {
          params: searchQuery ? { search: searchQuery } : {},
        });

        const clientsData = Array.isArray(res.data.clients)
          ? res.data.clients.map((c) => ({
              id: c.id,
              full_name: c.name || c.full_name,
              email: c.email,
              phone: c.phone || "",
              joined_at: c.joinedDate || c.joined_at || "",
              totalOrders: c.totalOrders || 0,
              totalSpent: c.totalSpent || 0,
              status: c.status || "active",
            }))
          : [];

        setClients(clientsData);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [searchQuery, toast]);

  const handleSuspendClient = async (id: string) => {
    setStatusLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/admin/clients/${id}/suspend`);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "suspended" } : c))
      );
      toast({ title: "Client Suspended" });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to suspend client",
        variant: "destructive",
      });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleActivateClient = async (id: string) => {
    setStatusLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/admin/clients/${id}/activate`);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "active" } : c))
      );
      toast({ title: "Client Activated" });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to activate client",
        variant: "destructive",
      });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredClients = clients.filter((client) =>
    client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Client Management</h1>
      </div>

      {/* Search bar */}
      <Card className="border-0">
        <CardContent className="p-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredClients.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No clients found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{client.full_name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={client.status === "active" ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {statusLoading[client.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        client.status
                      )}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {client.status === "active" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleSuspendClient(client.id)}
                          >
                            Suspend Account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleActivateClient(client.id)}
                          >
                            Activate Account
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined{" "}
                    {client.joined_at
                      ? client.joined_at.split("T")[0]
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
