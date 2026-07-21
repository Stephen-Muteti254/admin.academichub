import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  User,
  GraduationCap,
  MapPin,
  Clock,
  AlertCircle,
  Briefcase,
  Eye,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/lib/api";

interface WriterApplicationDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  country: string;
  city: string;
  education: string;
  specialization: string;
  years_experience: string;
  proficiency_answers: Record<number | string, string>;
  proficiency_score?: number;
  selected_prompt: string;
  prompt_response: string;
  selected_essay_topic: string;
  essay_file_url?: string;
  work_samples: string[];
  cv_file_url?: string;
  degree_certificates: string[];
  status: string;
  admin_feedback?: string;
  submitted_at: string;
}

const AdminApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState<WriterApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  useEffect(() => {
    fetchApplicationDetail();
  }, [id]);

  const fetchApplicationDetail = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/applications/${id}`);
      const data = response.data?.data || response.data;
      let parsedAnswers = {};
      if (data.proficiency_answers) {
        try {
          parsedAnswers =
            typeof data.proficiency_answers === "string"
              ? JSON.parse(data.proficiency_answers)
              : data.proficiency_answers;
        } catch (e) {
          console.error("Failed to parse proficiency_answers:", e);
          parsedAnswers = {}; // fallback to empty object
        }
      }

      setApplication({
        ...data,
        proficiency_answers: parsedAnswers,
      });
      console.log(response.data);
      setFeedback(response.data.admin_feedback || "");
    } catch (error: any) {
      console.log(error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to load application details";

      if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to view this page.",
          variant: "destructive",
        });
        navigate("/unauthorized");
        return;
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!application) return;
    setIsProcessing(true);
    try {
      const response = await api.post(`/applications/${application.id}/approve`, { feedback });
      toast({
        title: "Application Approved",
        description: response.data?.message || "The writer application has been approved successfully.",
      });
      navigate("/admin/applications");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to approve application";

      if (error.response?.status === 403) {
        toast({
          title: "Admin Privileges Required",
          description: "You do not have permission to approve this application.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback explaining the rejection reason.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post(`/applications/${application.id}/reject`, { feedback });
      toast({
        title: "Application Rejected",
        description: response.data?.message || "The writer application has been rejected.",
      });
      navigate("/admin/applications");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to reject application";

      if (error.response?.status === 403) {
        toast({
          title: "Admin Privileges Required",
          description: "You do not have permission to reject this application.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
      setShowRejectDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      pending: { variant: "secondary", label: "Pending Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['doc', 'docx'].includes(extension)) return 'document';
    return 'other';
  };

  const handlePreviewFile = (url: string, name: string) => {
    const token = localStorage.getItem("access_token");
    const secureUrl = `${url}?token=${token}`;
    const type = getFileType(url);
    setPreviewFile({ url: secureUrl, name, type });
  };

  const proficiencyQuestions = [
    "Neither the teacher nor the students ___ willing to postpone the exam.",
    "If I ___ earlier, I wouldn't have missed the train.",
    "Each of the reports ___ to be submitted before Friday.",
    "Hardly ___ the announcement when the crowd started cheering.",
    "She acted as if she ___ everything about the project.",
    "I wish I ___ to the meeting yesterday.",
    "The manager insisted that the report ___ completed immediately.",
    "Not only ___ late, but he also forgot his notes.",
    "If she ___ harder, she would have passed the test.",
    "I'm looking forward to ___ you next week.",
    "By the time we arrived, the movie ___.",
    "The committee has reached ___ decision after several meetings.",
    "The book, together with the notes, ___ on the table.",
    "The fewer mistakes you make, the ___ your grade will be.",
    "Scarcely had I entered the room ___ the lights went out.",
    "I prefer tea ___ coffee.",
    "The doctor suggested that he ___ more rest.",
    "Neither of them ___ attending the conference this year.",
    "The report must be finished ___ Friday.",
    "If only he ___ the truth earlier!",
    "You'd better ___ your assignment before midnight.",
    "She has been working here ___ 2018.",
    "The film was so boring that we wished we ___ stayed home.",
    "The more you practice, ___ you will perform.",
    "He arrived late, ___ surprised everyone.",
    "We would rather you ___ the truth now.",
    "Not until last year ___ how important time management is.",
    "No sooner had they finished dinner ___ the phone rang.",
    "The house whose windows ___ broken needs urgent repair.",
    "She is one of those people who ___ always on time.",
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Application not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/applications")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Application Review</h1>
              {/*<p className="text-muted-foreground">Review writer application details</p>*/}
            </div>
          </div>
          {getStatusBadge(application.status)}
        </div>

        {/* Applicant Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="font-medium">{application.user_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{application.user_email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <p className="font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {application.city}, {application.country}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Submitted At</Label>
              <p className="font-medium flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(application.submitted_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="education" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="proficiency">Proficiency</TabsTrigger>
            <TabsTrigger value="writing">Writing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {/*<GraduationCap className="h-5 w-5 mr-2" />*/}
                  Educational Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Education Level</Label>
                  <p className="font-medium text-lg">{application.education}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Area of Specialization</Label>
                  <p className="font-medium text-lg">{application.specialization}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Years of Writing Experience
                  </Label>
                  <p className="font-medium text-lg">{application.years_experience} years</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proficiency Test Tab */}
          <TabsContent value="proficiency" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>English Proficiency Test Results</CardTitle>
                <CardDescription>{Object.keys(application.proficiency_answers || {}).length} questions completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                {proficiencyQuestions.map((question, index) => {
                  const answer = application.proficiency_answers?.[String(index)] || "N/A";
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <p className="font-medium text-sm">
                        {index + 1}. {question}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Answer: {answer}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Writing Samples Tab */}
          <TabsContent value="writing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Writing Prompt Response</CardTitle>
                <CardDescription>Selected Prompt: {application.selected_prompt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{application.prompt_response}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Word count: {application.prompt_response.trim().split(/\s+/).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Essay Submission</CardTitle>
                <CardDescription>Topic: {application.selected_essay_topic}</CardDescription>
              </CardHeader>
              <CardContent>
                {application.essay_file_url ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={() => handlePreviewFile(application.essay_file_url!, "Essay Submission")}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Essay
                    </Button>
                    {/*<Button variant="outline" asChild>
                      <a href={application.essay_file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>*/}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No essay file uploaded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {/*<FileText className="h-5 w-5 mr-2" />*/}
                  CV/Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.cv_file_url ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Curriculum Vitae</p>
                        <p className="text-xs text-muted-foreground">Professional resume</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreviewFile(application.cv_file_url!, "CV/Resume")}
                      className="hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No CV uploaded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Degree Certificates</CardTitle>
                <CardDescription>{application.degree_certificates.length} file(s) uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                {application.degree_certificates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {application.degree_certificates.map((cert, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewFile(cert, `Certificate ${index + 1}`)}
                        className="group relative overflow-hidden hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <span className="text-xs font-semibold text-primary">{index + 1}</span>
                          </div>
                          <Eye className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No certificates uploaded</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Samples (Optional)</CardTitle>
                <CardDescription>{application.work_samples.length} file(s) uploaded</CardDescription>
              </CardHeader>
              <CardContent>
                {application.work_samples.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {application.work_samples.map((sample, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewFile(sample, `Work Sample ${index + 1}`)}
                        className="group relative overflow-hidden hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <span className="text-xs font-semibold text-primary">{index + 1}</span>
                          </div>
                          <Eye className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No work samples uploaded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Admin Review & Feedback</CardTitle>
                {/*<CardDescription>Provide feedback and take action on this application</CardDescription>*/}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback / Notes</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Enter your review feedback here..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={6}
                    disabled={application.status !== "pending"}
                  />
                  <p className="text-sm text-muted-foreground">
                    {application.status !== "pending"
                      ? "This application has already been reviewed."
                      : "Feedback is required when rejecting an application."}
                  </p>
                </div>

                {application.status === "pending" && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => setShowApproveDialog(true)}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                )}

                {application.status !== "pending" && application.admin_feedback && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Previous Feedback:</strong>
                      <p className="mt-2">{application.admin_feedback}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this writer application? The applicant will be notified and granted
              access to the writer platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this writer application? Please ensure you've provided feedback
              explaining the rejection reason. The applicant will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing || !feedback.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Processing..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent
          forceMount
          className="fixed left-0 top-0 z-50 w-screen h-screen max-w-none max-h-none p-0 bg-background border-none rounded-none overflow-hidden translate-x-0 translate-y-0 transform-none"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            maxWidth: "none",
            maxHeight: "none",
            transform: "none",
          }}
        >
          {/* Header */}
          <DialogHeader className="flex items-center justify-between border-b bg-background/90 backdrop-blur-md">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              {previewFile?.name}
            </DialogTitle>

            {/*<DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted absolute right-6 top-6 z-50"
              >
                <X className="h-5 w-5" />
              </Button>*/}
            <DialogClose />
          </DialogHeader>

          {/* Content */}
          <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-muted/10">
            {previewFile?.type === "pdf" && (
              <iframe
                src={`${previewFile.url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full rounded-lg border bg-white"
                title={previewFile.name}
              />
            )}

            {previewFile?.type === "image" && (
              <div className="flex items-center justify-center w-full h-full bg-background">
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            )}

            {(previewFile?.type === "document" || previewFile?.type === "other") && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Preview is only available for PDF files. This file appears to be a {previewFile.type === "document" ? "Word document (.doc/.docx)" : "non-PDF file"}.
                  <div className="mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <a href={previewFile.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download to view
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminApplicationDetail;