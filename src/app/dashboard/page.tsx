"use client";

import {
  FileText,
  Clock,
  CheckCircle2,
  School,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import {
  ListItemNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $getRoot, FORMAT_TEXT_COMMAND } from "lexical";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// MOCK DATA - Replace with real Supabase data fetch
const MOCK_USER_ROLE = "FACULTY"; // Change to 'STUDENT' to see the other view
// const MOCK_USER_ROLE = "STUDENT";

type RecommenderProfile = {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  department?: string;
  title?: string;
  relationship?: string;
  email?: string;
  phone?: string;
  country?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

type RecommenderForm = Required<RecommenderProfile>;

const EMPTY_RECOMMENDER_FORM: RecommenderForm = {
  prefix: "",
  firstName: "",
  lastName: "",
  organization: "",
  department: "",
  title: "",
  relationship: "",
  email: "",
  phone: "",
  country: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
};

const MOCK_RECOMMENDER_PROFILE: RecommenderProfile = {
  prefix: "Dr.",
  firstName: "Prosenjit",
  lastName: "Chatterjee",
  organization: "Southern Utah University",
  department: "Biology",
  title: "Professor",
  relationship: "Professor",
  email: "faculty@university.edu",
  phone: "(555) 555-5555",
  country: "United States",
  street: "351 W University Blvd",
  city: "Cedar City",
  state: "Utah",
  postalCode: "84720",
};

function buildRecommenderForm(profile?: RecommenderProfile): RecommenderForm {
  return {
    ...EMPTY_RECOMMENDER_FORM,
    ...profile,
  };
}

export default function DashboardPage() {
  // In real app: const { user } = useAuth();
  const role = MOCK_USER_ROLE;

  return (
    <div className='min-h-screen bg-[#fbfbf8] p-6 md:p-10'>
      <div className='mx-auto max-w-6xl space-y-8'>
        {/* Header Section */}
        <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='font-serif text-3xl font-semibold text-green-900'>
              {role === "STUDENT" ? "Student Dashboard" : "Faculty Dashboard"}
            </h1>
            <p className='text-green-900/70'>
              {role === "STUDENT"
                ? "Manage your requests and send letters to institutions."
                : "Review pending requests and draft recommendations."}
            </p>
          </div>
          {role === "STUDENT" && (
            <Dialog>
              <DialogTrigger className='bg-amber-400 text-green-900 hover:bg-yellow-500 font-semibold rounded-xl'>
                <Plus className='mr-2 h-4 w-4' /> New Send Request
                <DialogContent className='sm:max-w-[425px] rounded-2xl'>
                  <DialogHeader>
                    <DialogTitle className='font-serif text-green-900'>
                      Send New Recommendation
                    </DialogTitle>
                    <DialogDescription>
                      Enter the professor&apos;s email and details for the
                      request.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </DialogTrigger>
            </Dialog>
          )}
        </div>

        {/* Dynamic Dashboard Content */}
        {role === "STUDENT" ? <StudentView /> : <FacultyView />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STUDENT VIEW                                */
/* -------------------------------------------------------------------------- */

function StudentView() {
  return (
    <div className='grid gap-6 grid-cols-1 md:grid-cols-12'>
      {/* LEFT COL: Request Form */}
      <div className='md:col-span-4'>
        <Card className='rounded-2xl border-black/5 shadow-lg shadow-black/5'>
          <CardHeader>
            <CardTitle className='text-xl font-serif text-green-900'>
              Request a Letter
            </CardTitle>
            <CardDescription>
              Ask a professor for a recommendation.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='prof-email'>Professor&apos;s Email</Label>
              <Input
                id='prof-email'
                placeholder='professor@university.edu'
                className='rounded-xl border-black/10 focus-visible:ring-green-900'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='course'>Course / Context (Optional)</Label>
              <Input
                id='course'
                placeholder='e.g. BIO 101, Fall 2023'
                className='rounded-xl border-black/10 focus-visible:ring-green-900'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='message'>Personal Note</Label>
              <Textarea
                id='message'
                placeholder="Hi Professor, I'm applying to med school..."
                className='rounded-xl border-black/10 min-h-[100px] focus-visible:ring-green-900'
              />
            </div>
            <Button className='w-full rounded-xl bg-green-900 hover:bg-[#093820]'>
              Send Request
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COL: Status Tabs */}
      <div className='md:col-span-8'>
        <Tabs defaultValue='completed' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 rounded-xl bg-green-900/5 p-1'>
            <TabsTrigger
              value='completed'
              className='rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm'
            >
              Ready to Send
            </TabsTrigger>
            <TabsTrigger
              value='pending'
              className='rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-900 data-[state=active]:shadow-sm'
            >
              Pending
            </TabsTrigger>
          </TabsList>

          {/* COMPLETED REQUESTS (Ready to send to schools) */}
          <TabsContent value='completed' className='mt-4 space-y-4'>
            <Card className='rounded-2xl border-black/5'>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead>Professor</TableHead>
                      <TableHead>Date Signed</TableHead>
                      <TableHead className='text-right'>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2].map((i) => (
                      <TableRow key={i} className='group'>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-3'>
                            <div className='h-8 w-8 rounded-full bg-green-900/10 grid place-items-center text-green-900 font-bold text-xs'>
                              JD
                            </div>
                            <span>Dr. Jane Doe</span>
                          </div>
                        </TableCell>
                        <TableCell className='text-gray-500'>
                          Oct 24, 2024
                        </TableCell>
                        <TableCell className='text-right'>
                          <SendToSchoolDialog />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PENDING REQUESTS */}
          <TabsContent value='pending' className='mt-4'>
            <Card className='rounded-2xl border-black/5'>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead>Professor</TableHead>
                      <TableHead>Sent On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>
                        Dr. Alan Grant
                      </TableCell>
                      <TableCell className='text-gray-500'>
                        Nov 1, 2024
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='secondary'
                          className='bg-amber-100 text-amber-800 hover:bg-amber-100'
                        >
                          <Clock className='mr-1 h-3 w-3' /> Awaiting
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FACULTY VIEW                                */
/* -------------------------------------------------------------------------- */

function FacultyView() {
  return (
    <div className='space-y-6'>
      {/* Stats Row */}
      <div className='grid gap-4 md:grid-cols-3'>
        <StatsCard
          title='Pending Requests'
          value='3'
          icon={Clock}
          color='text-amber-600'
        />
        <StatsCard
          title='Letters Finalized'
          value='24'
          icon={FileText}
          color='text-emerald-600'
        />
        <StatsCard
          title='Avg. Response Time'
          value='2 Days'
          icon={CheckCircle2}
          color='text-blue-600'
        />
      </div>

      <Card className='rounded-2xl border-black/5 bg-green-900/5'>
        <CardContent className='flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <div className='mt-0.5 rounded-full bg-white p-2 text-green-900'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <div>
              <p className='font-semibold text-green-900'>
                Secure letter workflow
              </p>
              <p className='text-sm text-green-900/70'>
                Students never see letter contents. Finalized letters are sealed
                and signed for verification.
              </p>
            </div>
          </div>
          <Button
            variant='outline'
            className='mt-2 rounded-xl border-green-900 text-green-900 hover:bg-green-900/10 sm:mt-0'
          >
            View Verification Settings
          </Button>
        </CardContent>
      </Card>

      <Card className='rounded-2xl border-black/5 shadow-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-xl text-green-900'>
            Incoming Requests
          </CardTitle>
          <CardDescription>
            Students requesting a letter of recommendation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class / Context</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <div className='font-medium'>Alex Smith</div>
                      <div className='text-xs text-gray-500'>
                        alex@university.edu
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>BIO 201 (Fall 23)</TableCell>
                  <TableCell className='text-gray-500'>2 days ago</TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <WriteLetterDialog studentName='Alex Smith' />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='rounded-2xl border-black/5 shadow-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-xl text-green-900'>
            Finalized Letters
          </CardTitle>
          <CardDescription>
            Sealed recommendations ready for secure delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Finalized</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <div className='font-medium'>Jasmine Lee</div>
                      <div className='text-xs text-gray-500'>
                        jasmine@university.edu
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-gray-500'>Nov 4, 2024</TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className='bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                    >
                      <CheckCircle2 className='mr-1 h-3 w-3' /> Sealed
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='rounded-lg border-green-900 text-green-900 hover:bg-green-900/5'
                    >
                      Copy Verification Link
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DIALOG COMPONENTS                               */
/* -------------------------------------------------------------------------- */

function SendToSchoolDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size='sm'
          className='rounded-lg bg-amber-400 text-green-900 hover:bg-yellow-500 font-semibold'
        >
          <School className='mr-2 h-4 w-4' /> Send to School
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-green-900'>
            Send Recommendation
          </DialogTitle>
          <DialogDescription>
            Enter the destination email for the admissions office.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='school-name'>Institution Name</Label>
            <Input
              id='school-name'
              placeholder='e.g. Harvard Medical School'
              className='rounded-xl'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='school-email'>Admissions Email</Label>
            <Input
              id='school-email'
              placeholder='admissions@harvard.edu'
              className='rounded-xl'
            />
          </div>
          <div className='rounded-lg bg-slate-50 p-3 text-xs text-gray-500'>
            <span className='font-bold text-green-900'>Note:</span> This will
            generate a secure, one-time view link for the institution.
          </div>
        </div>
        <DialogFooter>
          <Button
            type='submit'
            className='w-full rounded-xl bg-green-900 hover:bg-[#093820]'
          >
            Send Secure Link ($5.00)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WriteLetterDialog({ studentName }: { studentName: string }) {
  const [step, setStep] = useState<
    "details" | "letterhead" | "letter" | "preview"
  >("details");
  const [recommenderForm, setRecommenderForm] = useState<RecommenderForm>(() =>
    buildRecommenderForm(MOCK_RECOMMENDER_PROFILE),
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    null,
  );
  const [letterHtml, setLetterHtml] = useState<string>("");
  const [letterPlainText, setLetterPlainText] = useState<string>("");
  const [signatureHasTransparency, setSignatureHasTransparency] = useState<
    boolean | null
  >(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  const handleRecommenderChange = (
    field: keyof RecommenderForm,
    value: string,
  ) => {
    setRecommenderForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [logoFile]);

  useEffect(() => {
    if (!signatureFile) {
      setSignaturePreviewUrl(null);
      setSignatureHasTransparency(null);
      setSignatureError(null);
      return;
    }

    const previewUrl = URL.createObjectURL(signatureFile);
    setSignaturePreviewUrl(previewUrl);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        setSignatureHasTransparency(null);
        setSignatureError("Unable to validate transparency.");
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);

      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let hasTransparency = false;

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          hasTransparency = true;
          break;
        }
      }

      setSignatureHasTransparency(hasTransparency);
      setSignatureError(
        hasTransparency ? null : "Signature needs a transparent background.",
      );
    };

    image.onerror = () => {
      setSignatureHasTransparency(null);
      setSignatureError("Unable to read the signature image.");
    };

    image.src = previewUrl;

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [signatureFile]);

  const requiredDetailsFields: Array<keyof RecommenderForm> = [
    "firstName",
    "lastName",
    "organization",
    "title",
    "relationship",
    "email",
    "country",
    "street",
    "city",
    "state",
    "postalCode",
  ];

  const missingDetailFields = useMemo(
    () =>
      requiredDetailsFields.filter((field) => !recommenderForm[field].trim()),
    [recommenderForm],
  );

  const isDetailsComplete = missingDetailFields.length === 0;
  const isLetterheadComplete =
    Boolean(signatureFile) && signatureHasTransparency !== false;
  const isLetterComplete = letterPlainText.trim().length > 0;

  const missingDetailsHint = missingDetailFields.length
    ? `Missing: ${missingDetailFields
        .map((field) =>
          field
            .replace(/([A-Z])/g, " $1")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
        )
        .join(", ")}`
    : null;

  const footerHint =
    step === "details"
      ? missingDetailsHint
      : step === "letterhead"
        ? (signatureError ??
          (signatureFile ? null : "Upload a transparent PNG signature."))
        : step === "letter"
          ? isLetterComplete
            ? null
            : "Add letter content to continue."
          : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size='sm'
          className='rounded-lg bg-green-900 text-white hover:bg-[#093820]'
        >
          Write Letter
        </Button>
      </DialogTrigger>
      <DialogContent className='flex max-h-[85vh] w-full flex-col rounded-2xl sm:max-w-[860px]'>
        <DialogHeader>
          <DialogTitle className='font-serif text-green-900'>
            Draft Letter for {studentName}
          </DialogTitle>
          <DialogDescription>
            <div className='flex justify-between'>
              <span>
                Draft your recommendation. Students will never see the contents.
              </span>

              <div className='flex items-center gap-2 text-green-900/70'>
                <span className='text-xs uppercase tracking-[0.2em]'>Step</span>
                <span className='font-semibold'>
                  {step === "details" ? "1" : step === "letterhead" ? "2" : "3"}{" "}
                  / 3
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto'>
          <div className='grid gap-4 py-4'>
            <div className='flex items-center justify-between rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm'>
              <div className='flex items-center gap-2'>
                <span
                  className={`h-2 w-2 rounded-full ${
                    step === "details" ? "bg-green-900" : "bg-yellow-600/40"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    step === "details" ? "text-green-900" : "text-yellow-600"
                  }`}
                >
                  Recommender details
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span
                  className={`h-2 w-2 rounded-full ${
                    step === "details"
                      ? "bg-green-900/40"
                      : step === "letter" || step === "preview"
                        ? "bg-yellow-600/40"
                        : "bg-green-900"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    step === "details"
                      ? "text-green-900/40"
                      : step === "letter" || step === "preview"
                        ? "text-yellow-600"
                        : "text-green-900"
                  }`}
                >
                  Letterhead + signature
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span
                  className={`h-2 w-2 rounded-full ${
                    step === "letter" || step === "preview"
                      ? "bg-green-900"
                      : "bg-green-900/40"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    step === "letter" || step === "preview"
                      ? "text-green-900"
                      : "text-green-900/40"
                  }`}
                >
                  Letter
                </span>
              </div>
            </div>

            {step === "details" ? (
              <div className='grid gap-4 rounded-2xl border border-black/5 bg-white p-4'>
                <div>
                  <h3 className='text-base font-semibold text-green-900'>
                    Recommender information
                  </h3>
                  <p className='text-sm text-green-900/70'>
                    Used for letterhead and verification details.
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label htmlFor='prefix'>Prefix</Label>
                    <Input
                      id='prefix'
                      placeholder='Dr.'
                      className='rounded-xl'
                      value={recommenderForm.prefix}
                      onChange={(event) =>
                        handleRecommenderChange("prefix", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='title'>Position / Title</Label>
                    <Input
                      id='title'
                      placeholder='Professor'
                      className='rounded-xl'
                      value={recommenderForm.title}
                      onChange={(event) =>
                        handleRecommenderChange("title", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='first-name'>First Name</Label>
                    <Input
                      id='first-name'
                      placeholder='First name'
                      className='rounded-xl'
                      value={recommenderForm.firstName}
                      onChange={(event) =>
                        handleRecommenderChange("firstName", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='last-name'>Last Name</Label>
                    <Input
                      id='last-name'
                      placeholder='Last name'
                      className='rounded-xl'
                      value={recommenderForm.lastName}
                      onChange={(event) =>
                        handleRecommenderChange("lastName", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='organization'>Organization</Label>
                    <Input
                      id='organization'
                      placeholder='University name'
                      className='rounded-xl'
                      value={recommenderForm.organization}
                      onChange={(event) =>
                        handleRecommenderChange(
                          "organization",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='department'>Department / School</Label>
                    <Input
                      id='department'
                      placeholder='Department or school'
                      className='rounded-xl'
                      value={recommenderForm.department}
                      onChange={(event) =>
                        handleRecommenderChange(
                          "department",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='relationship'>Relationship</Label>
                    <Input
                      id='relationship'
                      placeholder='Professor, Advisor, Mentor'
                      className='rounded-xl'
                      value={recommenderForm.relationship}
                      onChange={(event) =>
                        handleRecommenderChange(
                          "relationship",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='recommender-email'>Email</Label>
                    <Input
                      id='recommender-email'
                      type='email'
                      placeholder='faculty@university.edu'
                      className='rounded-xl'
                      value={recommenderForm.email}
                      onChange={(event) =>
                        handleRecommenderChange("email", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='recommender-phone'>Phone</Label>
                    <Input
                      id='recommender-phone'
                      placeholder='(555) 555-5555'
                      className='rounded-xl'
                      value={recommenderForm.phone}
                      onChange={(event) =>
                        handleRecommenderChange("phone", event.target.value)
                      }
                    />
                  </div>
                </div>
                <div className='grid gap-4 sm:grid-cols-3'>
                  <div className='grid gap-2'>
                    <Label htmlFor='country'>Country</Label>
                    <Input
                      id='country'
                      placeholder='United States'
                      className='rounded-xl'
                      value={recommenderForm.country}
                      onChange={(event) =>
                        handleRecommenderChange("country", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2 sm:col-span-2'>
                    <Label htmlFor='street'>Street</Label>
                    <Input
                      id='street'
                      placeholder='123 University Ave'
                      className='rounded-xl'
                      value={recommenderForm.street}
                      onChange={(event) =>
                        handleRecommenderChange("street", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='city'>City</Label>
                    <Input
                      id='city'
                      placeholder='City'
                      className='rounded-xl'
                      value={recommenderForm.city}
                      onChange={(event) =>
                        handleRecommenderChange("city", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='state'>State / Province</Label>
                    <Input
                      id='state'
                      placeholder='State'
                      className='rounded-xl'
                      value={recommenderForm.state}
                      onChange={(event) =>
                        handleRecommenderChange("state", event.target.value)
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='postal'>Postal Code</Label>
                    <Input
                      id='postal'
                      placeholder='Postal code'
                      className='rounded-xl'
                      value={recommenderForm.postalCode}
                      onChange={(event) =>
                        handleRecommenderChange(
                          "postalCode",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ) : step === "letterhead" ? (
              <div className='grid gap-4 rounded-2xl border border-black/5 bg-white p-4'>
                <div>
                  <h3 className='text-base font-semibold text-green-900'>
                    Letterhead + signature
                  </h3>
                  <p className='text-sm text-green-900/70'>
                    Upload a logo (any image format) and a transparent PNG
                    signature. Use remove.bg or SignWell if needed.
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='grid gap-2'>
                    <Label htmlFor='letterhead-logo'>Letterhead logo</Label>
                    <Input
                      id='letterhead-logo'
                      type='file'
                      accept='image/*'
                      className='rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-green-900/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-green-900 hover:file:bg-green-900/20'
                      onChange={(event) =>
                        setLogoFile(event.target.files?.[0] ?? null)
                      }
                    />
                    <p className='text-xs text-gray-500'>
                      {logoFile ? `Selected: ${logoFile.name}` : "Optional"}
                    </p>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='signature-upload'>Signature (PNG)</Label>
                    <Input
                      id='signature-upload'
                      type='file'
                      accept='image/png'
                      className='rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-green-900/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-green-900 hover:file:bg-green-900/20'
                      onChange={(event) =>
                        setSignatureFile(event.target.files?.[0] ?? null)
                      }
                    />
                    <p className='text-xs text-gray-500'>
                      {signatureFile
                        ? `Selected: ${signatureFile.name}`
                        : "Required: transparent PNG"}
                    </p>
                    {signatureError && (
                      <p className='text-xs font-semibold text-amber-700'>
                        {signatureError}
                      </p>
                    )}
                  </div>
                </div>
                <div className='rounded-lg bg-slate-50 p-3 text-xs text-gray-600'>
                  If your PNG has a white background, use
                  <a
                    className='ml-1 font-semibold text-green-900 underline'
                    href='https://www.remove.bg/'
                    target='_blank'
                    rel='noreferrer'
                  >
                    remove.bg
                  </a>
                  <span> or create a free transparent signature using </span>
                  <a
                    className='font-semibold text-green-900 underline'
                    href='https://www.signwell.com/online-signature/'
                    target='_blank'
                    rel='noreferrer'
                  >
                    SignWell
                  </a>
                  .
                </div>
                <div className='grid gap-2 rounded-lg border border-dashed border-black/10 bg-slate-50 p-4 text-sm text-gray-500'>
                  <p className='font-semibold text-green-900'>Preview</p>
                  <p>
                    Your logo and signature will appear on the final letterhead.
                    Address data will be pulled from the recommender details.
                  </p>
                </div>
              </div>
            ) : step === "letter" ? (
              <div className='grid gap-2'>
                <Label htmlFor='letter-content'>Letter content</Label>
                <LetterEditor
                  onChange={({ html, plainText }) => {
                    setLetterHtml(html);
                    setLetterPlainText(plainText);
                  }}
                />
                <div className='rounded-lg bg-slate-50 p-3 text-xs text-gray-500 mt-8'>
                  <span className='font-bold text-green-900'>Next step: </span>
                  Review a sealed preview before finalizing.
                </div>
              </div>
            ) : (
              <div className='grid gap-4'>
                <div>
                  <h3 className='text-base font-semibold text-green-900'>
                    Preview
                  </h3>
                  <p className='text-sm text-green-900/70'>
                    This is how the letterhead and signature will appear on the
                    final letter.
                  </p>
                </div>
                <div className='rounded-2xl border border-dashed border-black/10 bg-white p-6'>
                  <div className='flex min-h-[520px] flex-col gap-6 text-sm text-gray-700'>
                    <div className='flex items-start justify-between gap-6'>
                      <div className='flex items-start gap-4'>
                        {logoPreviewUrl ? (
                          <img
                            src={logoPreviewUrl}
                            alt='Letterhead logo preview'
                            className='h-16 w-28 object-contain'
                          />
                        ) : (
                          <div className='flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-black/10 text-[10px] uppercase text-gray-400'>
                            Logo
                          </div>
                        )}
                        <div className='space-y-1'>
                          <p className='text-sm font-semibold text-green-900'>
                            {recommenderForm.department || "Department"}
                          </p>
                        </div>
                      </div>
                      <div className='text-right text-xs text-gray-500'>
                        <p>{recommenderForm.street || "Street address"}</p>
                        <p>
                          {(recommenderForm.city || "City") +
                            ", " +
                            (recommenderForm.state || "State") +
                            " " +
                            (recommenderForm.postalCode || "Postal")}
                        </p>
                        <p>{recommenderForm.country || "Country"}</p>
                      </div>
                    </div>
                    <div className='border-t border-dashed border-black/10 pt-6' />
                    <div className='flex-1 rounded-xl bg-[#fbfbf8] p-6 text-sm text-gray-700'>
                      {letterHtml ? (
                        <div
                          className='space-y-3'
                          dangerouslySetInnerHTML={{ __html: letterHtml }}
                        />
                      ) : (
                        <p className='text-xs text-gray-500'>
                          Letter content will render here using your editor
                          text.
                        </p>
                      )}
                    </div>
                    <div className='flex flex-col items-start gap-2 text-xs text-gray-500'>
                      {signaturePreviewUrl ? (
                        <img
                          src={signaturePreviewUrl}
                          alt='Signature preview'
                          className='h-12 w-40 object-contain'
                        />
                      ) : (
                        <div className='h-12 w-40 rounded-lg border border-dashed border-black/10' />
                      )}
                      <div className='text-xs text-gray-600'>
                        {recommenderForm.firstName || "First"}{" "}
                        {recommenderForm.lastName || "Last"}
                      </div>
                      <div className='text-[11px] text-gray-500'>
                        {recommenderForm.title || "Title"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            {step !== "details" && (
              <Button
                type='button'
                variant='outline'
                className='rounded-xl'
                onClick={() =>
                  setStep(
                    step === "preview"
                      ? "letter"
                      : step === "letter"
                        ? "letterhead"
                        : "details",
                  )
                }
              >
                Back
              </Button>
            )}
            {footerHint && (
              <span className='text-xs font-semibold text-amber-700'>
                {footerHint}
              </span>
            )}
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            {step === "details" && (
              <Button
                type='button'
                className='rounded-xl bg-green-900 hover:bg-[#093820]'
                onClick={() => setStep("letterhead")}
                disabled={!isDetailsComplete}
              >
                Continue to Letterhead
              </Button>
            )}
            {step === "letterhead" && (
              <Button
                type='button'
                className='rounded-xl bg-green-900 hover:bg-[#093820]'
                onClick={() => setStep("letter")}
                disabled={!isLetterheadComplete}
              >
                Continue to Letter
              </Button>
            )}
            {step === "letter" && (
              <Button
                type='button'
                className='rounded-xl bg-green-900 hover:bg-[#093820]'
                onClick={() => setStep("preview")}
                disabled={!isLetterComplete}
              >
                Review Preview
              </Button>
            )}
            {step === "preview" && (
              <>
                <div className='rounded-lg bg-slate-50 p-3 text-xs text-gray-500'>
                  <span className='font-bold text-green-900'>
                    Finalization:
                  </span>{" "}
                  Once finalized, edits are locked and the letter is sealed.
                </div>
                <Button variant='outline' className='rounded-xl'>
                  Save Draft
                </Button>
                <Button className='rounded-xl bg-green-900 hover:bg-[#093820]'>
                  Finalize & Seal Letter
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LetterEditor({
  onChange,
}: {
  onChange: (payload: { html: string; plainText: string }) => void;
}) {
  const editorConfig = {
    namespace: "letter-editor",
    onError(error: Error) {
      throw error;
    },
    nodes: [ListNode, ListItemNode],
    theme: {
      paragraph: "mb-2",
      text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
      },
      list: {
        ol: "list-decimal ml-6",
        ul: "list-disc ml-6",
        listitem: "mb-1",
      },
    },
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className='relative rounded-xl border border-black/10 bg-white'>
        <LetterEditorToolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              id='letter-content'
              className='min-h-[180px] max-h-[360px] overflow-y-auto rounded-b-xl px-4 py-3 pr-3 text-sm leading-relaxed focus:outline-none'
            />
          }
          placeholder={
            <div className='pointer-events-none absolute inset-x-0 mt-3 px-4 text-sm text-gray-400'>
              Begin writing the recommendation...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(editor);
              const plainText = $getRoot().getTextContent();
              onChange({ html, plainText });
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}

function LetterEditorToolbar() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className='flex flex-wrap items-center gap-2 border-b border-black/10 bg-slate-50 px-3 py-2 text-sm text-gray-600'>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-8 rounded-lg border-black/10'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        Bold
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-8 rounded-lg border-black/10'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        Italic
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-8 rounded-lg border-black/10'
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        Underline
      </Button>
      <div className='h-4 w-px bg-black/10' />
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-8 rounded-lg border-black/10'
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        Bullets
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        className='h-8 rounded-lg border-black/10'
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        Numbered
      </Button>
      <Button
        type='button'
        size='sm'
        variant='ghost'
        className='h-8 rounded-lg text-gray-500'
        onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
      >
        Clear List
      </Button>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className='rounded-2xl border-black/5 shadow-sm'>
      <CardContent className='flex items-center gap-4 p-6'>
        <div
          className={`rounded-full p-3 bg-opacity-10 ${color.replace("text-", "bg-")}`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className='text-sm font-medium text-gray-500'>{title}</p>
          <h4 className='text-2xl font-bold text-green-900'>{value}</h4>
        </div>
      </CardContent>
    </Card>
  );
}
