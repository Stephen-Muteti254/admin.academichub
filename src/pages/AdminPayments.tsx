import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const TABS = ["all", "pending", "approved", "rejected"];
const LIMIT = 10;

export default function AdminPayments() {
  const { tab = "pending" } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!TABS.includes(tab)) {
    return <Navigate to="/admin/payments/pending" replace />;
  }

  // State
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Refs
  const loadingRef = useRef(false);
  const searchTimeout = useRef<number | null>(null);
  const scrollRef = useRef<{
    getElement: () => HTMLDivElement | null;
    scrollTop: () => number;
    scrollHeight: () => number;
    clientHeight: () => number;
  }>(null);
  const nextPageRef = useRef(1);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Fetch withdrawals
  const fetchWithdrawals = useCallback(
    async (p = 1, s = "", reset = false) => {
      if (!reset && loadingRef.current) return;

      loadingRef.current = true;
      try {
        reset ? setInitialLoading(true) : setLoading(true);

        const params: Record<string, any> = { page: p, limit: LIMIT };
        if (tab !== "all") params.status = tab;
        if (s.trim()) params.search = s.trim();

        const res = await api.get("/admin/withdrawals", { params });
        const data = res.data || {};
        const list = Array.isArray(data.withdrawals) ? data.withdrawals : [];
        const pagination = data.pagination || {};

        setWithdrawals(prev => (reset ? list : [...prev, ...list]));
        setPage(pagination.page || p);
        nextPageRef.current = (pagination.page || p) + 1;
        setHasMore((pagination.page || p) < (pagination.total_pages || 1));
      } catch (err: any) {
        const message = err?.response?.data?.error?.message || err?.message || "Failed to load withdrawals";
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
        if (reset) setInitialLoading(false);
        loadingRef.current = false;
      }
    },
    [tab, toast]
  );

  // Reset when tab or search changes
  useEffect(() => {
    setWithdrawals([]);
    setPage(1);
    setHasMore(true);
    fetchWithdrawals(1, searchTerm, true);
  }, [tab, searchTerm, fetchWithdrawals]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      setWithdrawals([]);
      setPage(1);
      setHasMore(true);
      fetchWithdrawals(1, searchTerm, true);
    }, 400);

    return () => searchTimeout.current && clearTimeout(searchTimeout.current);
  }, [searchTerm, fetchWithdrawals]);

  // handleScroll: rely only on fetchWithdrawals
  const handleScroll = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    const el = scrollRef.current?.getElement();
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    if (nearBottom) {
      fetchWithdrawals(nextPageRef.current, searchTerm);
    }
  }, [fetchWithdrawals, hasMore, searchTerm]);

  // Approve / Reject
  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this withdrawal?")) return;

    setProcessingIds(prev => new Set(prev).add(id));

    try {
      await api.patch(`/admin/withdrawals/${id}/approve`);
      setWithdrawals(prev => prev.filter(w => w.id !== id));
      toast({ title: "Approved", description: "Withdrawal has been approved." });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || "Failed to approve withdrawal";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setProcessingIds(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejection (optional):", "");

    setProcessingIds(prev => new Set(prev).add(id));

    try {
      await api.patch(`/admin/withdrawals/${id}/reject`, { reason });
      setWithdrawals(prev => prev.filter(w => w.id !== id));
      toast({ title: "Rejected", description: "Withdrawal has been rejected." });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || "Failed to reject withdrawal";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setProcessingIds(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };


  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Withdrawals</h1>
      </div>

      <Card className="border-0 h-[calc(100dvh-7rem)] overflow-hidden mt-2 relative">
        {initialLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 rounded-lg pointer-events-none">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <CardContent className="p-0 h-full flex flex-col">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3">
            <div className="flex border-b sm:border-0 border-border">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => navigate(`/admin/payments/${t}`)}
                  className={`pb-1 px-3 text-sm font-medium transition-colors ${
                    tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-[360px] mt-2 sm:mt-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search writer name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <ScrollArea ref={scrollRef} onScroll={handleScroll}>
            <div className="flex flex-col flex-1 border rounded-md">
              <Table className="min-w-full font-sans">
                <TableHeader>
                  <TableRow>
                    <TableHead>Writer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length > 0 ? (
                    withdrawals.map(w => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.writer?.name}</TableCell>
                        <TableCell className="text-right font-medium">${Number(w.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={w.status === "pending" ? "default" : w.status === "approved" ? "success" : "destructive"}
                          >
                            {w.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(w.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {w.status === "pending" ? (
                            processingIds.has(w.id) ? (
                              <div className="flex items-center justify-end text-muted-foreground gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Processing...</span>
                              </div>
                            ) : (
                              <div className="inline-flex gap-3">
                                <button
                                  onClick={() => handleApprove(w.id)}
                                  className="text-primary hover:underline text-sm font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(w.id)}
                                  className="text-destructive hover:underline text-sm font-medium"
                                >
                                  Reject
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="text-right text-sm text-muted-foreground">
                              {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    !initialLoading && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          No withdrawals found.
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>

              {loading && !initialLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
