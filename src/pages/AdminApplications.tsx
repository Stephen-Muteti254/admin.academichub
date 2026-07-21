import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Filter, RefreshCw, UserCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MoreVertical } from "lucide-react";

interface ApplicationSummary {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  submitted_at: string;
}

const AdminApplications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationSummary | null>(null);
  const [actionLoading, setActionLoading] = useState(false);


  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [searchQuery, statusFilter]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/applications/all", {
        params: {
          status: statusFilter,
          search: searchQuery || "",
        },
      });
      // console.log(res.data.data);
      setApplications(res.data.data || []);
      console.log(applications);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to load applications",
        variant: "destructive",
      });
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };


  const filterApplications = () => {
    let filtered = applications;

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (app) =>
          app.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApplications(filtered);

    console.log("filtered" + filteredApplications);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      pending: { variant: "secondary", label: "Pending Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusCounts = () => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };
  };


  const handleConfirmDeposit = async () => {
    if (!selectedApplication) return;

    setActionLoading(true);
    try {
      await api.post(
        `/applications/${selectedApplication.user_id}/confirm-deposit`
      );

      // Update local state safely
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplication.id
            ? { ...app, account_status: "active" }
            : app
        )
      );

      toast({
        title: "Deposit Confirmed",
        description: "Initial deposit verified. Writer account activated.",
      });
    } catch (err: any) {
      toast({
        title: "Confirmation Failed",
        description:
          err.response?.data?.error?.message || "Could not confirm deposit",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setDepositDialogOpen(false);
      setSelectedApplication(null);
    }
  };


  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Writer Applications</h1>
      </div>
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchApplications} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Applicant Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-sm">{app.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{app.user_name}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{formatDate(app.submitted_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            {/* REVIEW APPLICATION */}
                            <DropdownMenuItem
                              onClick={() => navigate(`/admin/applications/${app.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Application
                            </DropdownMenuItem>

                            {/* CONFIRM DEPOSIT — ONLY WHEN VALID */}
                            {app.status === "approved" &&
                              app.account_status === "awaiting_initial_deposit" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-emerald-600"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setDepositDialogOpen(true);
                                    }}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Confirm Initial Deposit
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Initial Deposit</DialogTitle>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium">{selectedApplication.user_name}</p>
                  <p className="text-sm text-muted-foreground">
                    User ID: {selectedApplication.user_id}
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 rounded-lg">
                  <UserCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Confirm Deposit Verification
                    </p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      This will activate the writer’s account and allow them to receive orders.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDepositDialogOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleConfirmDeposit}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    Confirm Deposit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

    </div>
  );
};

export default AdminApplications;
