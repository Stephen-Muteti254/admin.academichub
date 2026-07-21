import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreVertical,
  Star,
  CheckCircle,
  AlertTriangle,
  Loader2,
  UserCheck,
  Ban,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

interface Writer {
  id: string;
  application_id?: string;
  full_name: string;
  email: string;
  rating: number;
  completed_orders: number;
  total_earned: number;
  joined_at?: string;
  account_status:
    | "awaiting_initial_deposit"
    | "paid_initial_deposit"
    | "active"
    | "pending"
    | "suspended-temporary"
    | "suspended-permanent";
}


export default function AdminWriters() {
  const { toast } = useToast();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWriter, setSelectedWriter] = useState<Writer | null>(null);
  const [suspensionDialogOpen, setSuspensionDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [suspensionDays, setSuspensionDays] = useState<number>(7);


  // Suspension form
  const [suspensionType, setSuspensionType] = useState<"temporary" | "permanent">("temporary");
  const [suspensionReasons, setSuspensionReasons] = useState({
    blindBidding: false,
    erroneousSubmissions: false,
    lowRating: false,
    clientComplaints: false,
  });
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    const fetchWriters = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/writers");
        setWriters(res.data.writers || []);
        console.log(res.data);
      } catch (err) {
        toast({
          title: "Error Loading Writers",
          description: "Could not fetch writer data. Try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchWriters();
  }, [toast]);

  const handleSuspendWriter = async () => {
    if (!selectedWriter) return;
    const id = selectedWriter.id;

    const selectedReasons = Object.entries(suspensionReasons)
      .filter(([_, v]) => v)
      .map(([k]) => k);

    if (selectedReasons.length === 0 && !additionalNotes.trim()) {
      toast({
        title: "Reason Required",
        description: "Please select at least one reason or write additional notes.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading((prev) => ({ ...prev, [id]: true }));

    try {
      await api.patch(`/admin/writers/${id}/suspend`, {
        type: suspensionType,
        reasons: selectedReasons,
        notes: additionalNotes,
        duration_days: suspensionType === "temporary" ? suspensionDays : null,
      });

      setWriters((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, account_status: `suspended-${suspensionType}` as const }
            : w
        )
      );

      toast({
        title: "Writer Suspended",
        description:
          suspensionType === "temporary"
            ? `The writer has been suspended for ${suspensionDays} days.`
            : "The writer has been permanently suspended.",
      });
    } catch {
      toast({
        title: "Suspension Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
      setSuspensionDialogOpen(false);
      resetSuspensionForm();
    }
  };


  const handleActivateWriter = async (id: string) => {
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await api.patch(`/admin/writers/${id}/activate`);
      setWriters((prev) =>
        prev.map((w) => (w.id === id ? { ...w, account_status: "Paid_initial_deposit" } : w))
      );
      toast({ title: "Writer Activated", description: "Account reactivated successfully." });
    } catch {
      toast({
        title: "Activation Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleApproveDeposit = async () => {
    if (!selectedWriter) return;
    const id = selectedWriter.id;

    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await api.post(`/applications/${id}/confirm-deposit`);
      setWriters((prev) =>
        prev.map((w) => (w.id === id ? { ...w, account_status: "active" } : w))
      );
      toast({
        title: "Deposit Approved",
        description: "Writer deposit verified. Account activated.",
      });
    } catch {
      toast({
        title: "Approval Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
      setDepositDialogOpen(false);
    }
  };

  const resetSuspensionForm = () => {
    setSuspensionType("temporary");
    setSuspensionDays(7);
    setSuspensionReasons({
      blindBidding: false,
      erroneousSubmissions: false,
      lowRating: false,
      clientComplaints: false,
    });
    setAdditionalNotes("");
  };


  const filteredWriters = writers.filter(
    (w) =>
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBadgeVariant = (status: Writer["account_status"]) => {
    switch (status) {
      case "awaiting_initial_deposit":
        return "warning";
      case "paid_initial_deposit":
        return "info";
      case "active":
        return "success";
      case "suspended-temporary":
        return "outline";
      case "suspended-permanent":
        return "destructive";
      default:
        return "secondary";
    }
  };


  const formatStatus = (status: string) => {
    return status.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatReasonLabel = (key: string) => {
    const labels: Record<string, string> = {
      blindBidding: "Blind Bidding Violation",
      erroneousSubmissions: "Erroneous Submissions",
      lowRating: "Consistently Low Rating",
      clientComplaints: "Multiple Client Complaints",
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">Writer Management</h1>

      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search writers by name, email, or ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredWriters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No approved writers found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Writer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWriters.map((writer) => (
                  <TableRow key={writer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{writer.full_name}</p>
                        <p className="text-xs text-muted-foreground">{writer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span>{writer.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>{writer.completed_orders}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${writer.total_earned.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {writer.joined_at?.split("T")[0]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {actionLoading[writer.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Badge variant={getBadgeVariant(writer.account_status)}>
                          {formatStatus(writer.account_status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          
                          {writer.account_status === "awaiting_initial_deposit" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedWriter(writer);
                                  setDepositDialogOpen(true);
                                }}
                                className="text-emerald-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Mark Initial Deposit Paid
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Show Suspend ONLY if paid_initial_deposit */}
                          {writer.account_status === "paid_initial_deposit" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedWriter(writer);
                                  setSuspensionDialogOpen(true);
                                }}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Show Reactivate ONLY if suspended */}
                          {writer.account_status.startsWith("suspended") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleActivateWriter(writer.id)}
                                className="text-emerald-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approve Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Writer Deposit</DialogTitle>
          </DialogHeader>
          {selectedWriter && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-medium">{selectedWriter.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedWriter.email}</p>
              </div>

              <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Confirm Deposit Verification
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Approving this deposit will activate the writer's account and allow them to receive orders.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setDepositDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleApproveDeposit}
                  disabled={actionLoading[selectedWriter.id]}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {actionLoading[selectedWriter.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Approve Deposit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspension Dialog */}
      <Dialog open={suspensionDialogOpen} onOpenChange={(open) => {
        setSuspensionDialogOpen(open);
        if (!open) resetSuspensionForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suspend Writer</DialogTitle>
          </DialogHeader>
          {selectedWriter && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-medium">{selectedWriter.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedWriter.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Suspension Type</label>
                <Select
                  value={suspensionType}
                  onValueChange={(val: "temporary" | "permanent") => setSuspensionType(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select suspension type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="temporary">Temporary Suspension</SelectItem>
                    <SelectItem value="permanent">Permanent Suspension</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of days input - shown only for temporary suspension */}
              {suspensionType === "temporary" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Suspension Duration (days)</label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Enter number of days"
                  />
                  <p className="text-xs text-muted-foreground">
                    The writer will be suspended for {suspensionDays} day{suspensionDays !== 1 ? 's' : ''}.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium">Reason for suspension: <span className="text-destructive">*</span></p>
                {Object.entries(suspensionReasons).map(([key, val]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={val}
                      onCheckedChange={(checked) =>
                        setSuspensionReasons((r) => ({ ...r, [key]: checked as boolean }))
                      }
                    />
                    <label htmlFor={key} className="text-sm cursor-pointer">
                      {formatReasonLabel(key)}
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes</label>
                <Textarea
                  placeholder="Provide additional context or details about the suspension..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {suspensionType === "permanent"
                    ? "This will permanently suspend the account. This action cannot be undone."
                    : `This will suspend the writer for ${suspensionDays} day${suspensionDays !== 1 ? 's' : ''}. You can reactivate their account later.`}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setSuspensionDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSuspendWriter}
                  disabled={actionLoading[selectedWriter.id]}
                  className="flex-1"
                >
                  {actionLoading[selectedWriter.id] && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Suspend Writer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
