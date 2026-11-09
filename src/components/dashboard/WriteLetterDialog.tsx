"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  type RecommenderProfile,
  type RecommenderForm,
  EMPTY_RECOMMENDER_FORM,
  buildRecommenderForm,
} from "@/lib/faculty-profile";
import { LetterEditor } from "@/components/dashboard/LetterEditor";
import {
  saveDraft,
  loadDraft,
  setStudentPreviewEnabled as setPreviewEnabledAction,
} from "@/app/actions/letters";
import { uploadFacultyAsset, getSignedAssetUrl } from "@/app/actions/faculty";
import { Check, Ellipsis, X } from "lucide-react";

export function WriteLetterDialog({
  studentName,
  requestId,
  savedProfile,
  savedSignatureUrl,
  savedLogoUrl,
  savedLogoStoragePath,
  savedSignatureStoragePath,
  onSaveProfile,
  onDraftSaved,
  onFinalized,
  accessToken,
  defaultEmail,
}: {
  studentName: string;
  /** The address the request was sent to; prefills the recommender email. */
  defaultEmail?: string | null;
  /** Emailed link token. Set on /r/[token], where the professor has no session. */
  accessToken?: string;
  /** The letter_requests row ID. When provided, drafts go to Supabase.
   *  When absent (mock data), falls back to localStorage. */
  requestId?: string;
  savedProfile?: RecommenderProfile;
  savedSignatureUrl?: string | null;
  savedLogoUrl?: string | null;
  savedLogoStoragePath?: string | null;
  savedSignatureStoragePath?: string | null;
  onSaveProfile?: (
    form: RecommenderForm,
  ) => Promise<{ success: boolean; error?: string }>;
  onDraftSaved?: () => void;
  onFinalized?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<
    "details" | "letterhead" | "letter" | "preview"
  >("details");
  const baselineForm = () => {
    const form = buildRecommenderForm(savedProfile);
    return { ...form, email: form.email || defaultEmail || "" };
  };
  const [recommenderForm, setRecommenderForm] =
    useState<RecommenderForm>(baselineForm);
  // Errors show only after the professor tries to continue, never on open.
  const [showDetailErrors, setShowDetailErrors] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  // Persisted asset URLs loaded from Supabase Storage (autofill from saved profile)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(
    savedSignatureUrl ?? null,
  );
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(
    savedLogoUrl ?? null,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    null,
  );
  const [letterHtml, setLetterHtml] = useState<string>("");
  const [letterPlainText, setLetterPlainText] = useState<string>("");
  const [letterEditorState, setLetterEditorState] = useState<string | null>(
    null,
  );
  const [signatureHasTransparency, setSignatureHasTransparency] = useState<
    boolean | null
  >(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [letterDbId, setLetterDbId] = useState<string | null>(null);
  const [studentPreviewEnabled, setStudentPreviewEnabled] = useState(false);

  // Upload state
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [signatureUploadError, setSignatureUploadError] = useState<
    string | null
  >(null);
  // Raw storage paths (distinct from signed display URLs stored in logoDataUrl/signatureDataUrl)
  // Pre-populated from profile so the finalize route can fetch images even if no new file is uploaded.
  const [logoStoragePath, setLogoStoragePath] = useState<string | null>(
    savedLogoStoragePath ?? null,
  );
  const [signatureStoragePath, setSignatureStoragePath] = useState<
    string | null
  >(savedSignatureStoragePath ?? null);

  // Draft save / autosave state
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [lastAutosaved, setLastAutosaved] = useState<Date | null>(null);

  // Finalization state
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  // Unsaved-change guard
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  const finalizeConfirmRef = useRef<HTMLDivElement | null>(null);

  // Timer ref for debounced autosave
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always points at the latest handleSaveDraft to avoid stale closures
  const handleSaveDraftRef = useRef<(silent?: boolean) => Promise<void>>(
    async () => {},
  );

  const handleRecommenderChange = (
    field: keyof RecommenderForm,
    value: string,
  ) => {
    setProfileSaved(false);
    setDraftSaved(false);
    setIsDirty(true);
    setRecommenderForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleStudentPreview = async () => {
    const next = !studentPreviewEnabled;
    setStudentPreviewEnabled(next);
    if (letterDbId) {
      await setPreviewEnabledAction(letterDbId, next, accessToken);
    }
    // If no letterId yet the value will be saved with the next draft save.
  };

  const draftStorageKey = `letterDraft:${studentName}`;

  const handleLogoSelect = async (file: File | null) => {
    setIsDirty(true);
    setLogoFile(file);
    setLogoUploadError(null);
    if (!file) {
      setLogoStoragePath(null);
      return;
    }
    setIsUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadFacultyAsset(fd, "logo", accessToken);
    setIsUploadingLogo(false);
    if (result.success && result.storagePath) {
      setLogoStoragePath(result.storagePath);
      if (result.signedUrl) setLogoDataUrl(result.signedUrl);
    } else {
      setLogoUploadError(result.error ?? "Logo upload failed.");
    }
  };

  const handleSignatureSelect = (file: File | null) => {
    setIsDirty(true);
    setSignatureFile(file);
    setSignatureUploadError(null);
    // Upload is triggered from the transparency-check effect once the PNG passes
    if (!file) setSignatureStoragePath(null);
  };

  const handleSaveDraft = async (silent = false) => {
    setDraftSaveError(null);
    if (!silent) setIsSavingDraft(true);
    if (requestId) {
      // Persist to Supabase.
      const result = await saveDraft(requestId, {
        recommenderForm,
        letterHtml,
        letterPlainText,
        letterEditorState,
        logoStoragePath: logoStoragePath ?? null,
        signatureStoragePath: signatureStoragePath ?? null,
      }, accessToken);
      if (!silent) setIsSavingDraft(false);
      if (!result.success) {
        setDraftSaveError(result.error ?? "Failed to save draft.");
        return;
      }
      if (result.letterId) setLetterDbId(result.letterId);
    } else {
      // Fallback: no real request ID yet (mock data)
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          recommenderForm,
          letterHtml,
          letterPlainText,
          letterEditorState,
        }),
      );
      if (!silent) setIsSavingDraft(false);
    }
    setDraftSaved(true);
    setIsDirty(false);
    if (silent) setLastAutosaved(new Date());
    onDraftSaved?.();
  };

  // Keep ref current so the autosave timer always calls the latest version
  handleSaveDraftRef.current = handleSaveDraft;

  const handleFinalize = async () => {
    if (!requestId || !letterDbId) return;
    setIsFinalizing(true);
    setFinalizeError(null);
    // Persist any unsaved changes before sealing
    await handleSaveDraft(true);
    try {
      const res = await fetch(`/api/letters/${letterDbId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setFinalizeError(data.error ?? "Failed to finalize letter.");
        return;
      }
    } catch {
      setFinalizeError("Network error while finalizing. Please try again.");
      return;
    } finally {
      setIsFinalizing(false);
    }
    setShowFinalizeConfirm(false);
    setIsDirty(false);
    setIsOpen(false);
    setStep("details");
    onFinalized?.();
  };

  // Load draft from localStorage — only used as fallback when there is no requestId.
  // When requestId is present, loading happens in onOpenChange via the DB action.
  useEffect(() => {
    if (showFinalizeConfirm)
      finalizeConfirmRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [showFinalizeConfirm]);

  useEffect(() => {
    if (requestId) return;
    const storedDraft = localStorage.getItem(draftStorageKey);
    if (!storedDraft) return;
    try {
      const parsed = JSON.parse(storedDraft) as {
        recommenderForm: RecommenderForm;
        letterHtml: string;
        letterPlainText: string;
        letterEditorState: string | null;
      };
      setRecommenderForm(parsed.recommenderForm ?? EMPTY_RECOMMENDER_FORM);
      setLetterHtml(parsed.letterHtml ?? "");
      setLetterPlainText(parsed.letterPlainText ?? "");
      setLetterEditorState(parsed.letterEditorState ?? null);
    } catch {
      localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, requestId]);

  // Debounced autosave — 30 s after the last content change while the dialog is open.
  // Only activates when there are unsaved changes to avoid spurious saves on draft load.
  useEffect(() => {
    if (!isOpen || !requestId || !isDirty || isLoadingDraft) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void handleSaveDraftRef.current(true);
    }, 30_000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // recommenderForm and letterEditorState are the debounce triggers;
    // handleSaveDraftRef is a stable ref so it does not need to be listed.
  }, [
    recommenderForm,
    letterEditorState,
    isOpen,
    requestId,
    isDirty,
    isLoadingDraft,
  ]);

  // Logo object URL lifecycle
  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Signature object URL lifecycle + transparency check
  useEffect(() => {
    const previewSource = signatureFile
      ? URL.createObjectURL(signatureFile)
      : null;

    if (!previewSource) {
      setSignaturePreviewUrl(null);
      setSignatureHasTransparency(null);
      setSignatureError(null);
      return;
    }

    setSignaturePreviewUrl(previewSource);

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
      // Auto-upload as soon as transparency is confirmed
      if (hasTransparency && signatureFile) {
        setIsUploadingSignature(true);
        setSignatureUploadError(null);
        const fd = new FormData();
        fd.append("file", signatureFile);
        void uploadFacultyAsset(fd, "signature", accessToken).then((res) => {
          setIsUploadingSignature(false);
          if (res.success && res.storagePath) {
            setSignatureStoragePath(res.storagePath);
            if (res.signedUrl) setSignatureDataUrl(res.signedUrl);
          } else {
            setSignatureUploadError(res.error ?? "Signature upload failed.");
          }
        });
      }
    };
    image.onerror = () => {
      setSignatureHasTransparency(null);
      setSignatureError("Unable to read the signature image.");
    };
    image.src = previewSource;

    return () => {
      if (signatureFile) URL.revokeObjectURL(previewSource);
    };
  }, [signatureFile]);

  // Only what the letterhead and signature need. The PDF skips blank address lines.
  const requiredDetailsFields: Array<keyof RecommenderForm> = [
    "firstName",
    "lastName",
    "title",
    "organization",
    "email",
  ];

  const missingDetailFields = useMemo(
    () =>
      requiredDetailsFields.filter((field) => !recommenderForm[field].trim()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recommenderForm],
  );

  const isDetailsComplete = missingDetailFields.length === 0;
  const isLetterheadComplete =
    (Boolean(signatureFile) &&
      signatureHasTransparency !== false &&
      !isUploadingSignature) ||
    (Boolean(signatureDataUrl) && !signatureFile && !isUploadingSignature);
  // Block continuing while logo is uploading (logo is optional, but if chosen it must finish)
  const isLetterheadReady = isLetterheadComplete && !isUploadingLogo;
  const isLetterComplete = letterPlainText.trim().length > 0;

  const missingDetailsHint = missingDetailFields.length
    ? `Missing: ${missingDetailFields
        .map((f) =>
          f.replace(/([A-Z])/g, " $1").replace(/\b\w/g, (c) => c.toUpperCase()),
        )
        .join(", ")}`
    : null;

  const footerHint =
    step === "details"
      ? showDetailErrors
        ? missingDetailsHint
        : null
      : step === "letterhead"
        ? (signatureError ??
          (isUploadingSignature
            ? "Uploading signature..."
            : isUploadingLogo
              ? "Uploading logo..."
              : signatureFile || signatureDataUrl
                ? null
                : "Upload a transparent PNG signature."))
        : step === "letter"
          ? isLetterComplete
            ? null
            : "Add letter content to continue."
          : null;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={async (open) => {
          if (!open && isDirty) {
            setShowCloseWarning(true);
            return;
          }
          setIsOpen(open);
          if (open) {
            setIsDirty(false);
            setDraftSaveError(null);
            setFinalizeError(null);
            setShowFinalizeConfirm(false);
            setLastAutosaved(null);
            setShowDetailErrors(false);
            // Apply saved profile (and the request's email) as baseline
            setRecommenderForm(baselineForm());
            setSignatureDataUrl(savedSignatureUrl ?? null);
            setLogoDataUrl(savedLogoUrl ?? null);
            setLogoStoragePath(savedLogoStoragePath ?? null);
            setSignatureStoragePath(savedSignatureStoragePath ?? null);

            // Load draft from DB (overrides profile baseline if a draft exists)
            if (requestId) {
              setIsLoadingDraft(true);
              const draft = await loadDraft(requestId, accessToken);
              setIsLoadingDraft(false);
              if (draft) {
                if (draft.recommender_snapshot)
                  setRecommenderForm(draft.recommender_snapshot);
                setLetterHtml(draft.letter_body_html ?? "");
                setLetterPlainText(draft.letter_plain_text ?? "");
                setLetterEditorState(draft.letter_editor_state);
                if (draft.letterhead_logo_storage_path) {
                  setLogoStoragePath(draft.letterhead_logo_storage_path);
                  getSignedAssetUrl(draft.letterhead_logo_storage_path, "logo", accessToken).then(
                    (url) => { if (url) setLogoDataUrl(url); }
                  );
                }
                if (draft.signature_image_storage_path) {
                  setSignatureStoragePath(draft.signature_image_storage_path);
                  getSignedAssetUrl(draft.signature_image_storage_path, "signature", accessToken).then(
                    (url) => { if (url) setSignatureDataUrl(url); }
                  );
                }
                setLetterDbId(draft.id);
                setStudentPreviewEnabled(draft.student_preview_enabled);
                setDraftSaved(true);
              }
            }
          } else {
            setStep("details");
            setIsDirty(false);
            setLastAutosaved(null);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button size='sm' className='h-11 sm:h-9'>
            Write Letter
          </Button>
        </DialogTrigger>
        <DialogContent className='flex max-h-[90dvh] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[860px]'>
          {isLoadingDraft && (
            <div className='absolute inset-0 z-[100] flex items-center justify-center bg-white'>
              <div className='flex flex-col items-center gap-2'>
                <div className='h-8 w-8 animate-spin rounded-full border-4 border-forest border-t-transparent' />
                <p className='text-sm font-medium text-forest-ink'>
                  Loading draft…
                </p>
              </div>
            </div>
          )}
          <DialogHeader className='gap-1 border-b border-rule px-4 py-4 pr-12 sm:px-6'>
            <DialogTitle className='font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] text-forest-ink'>
              Draft Letter for {studentName}
            </DialogTitle>
            <DialogDescription asChild>
              <div className='flex flex-col gap-1 sm:flex-row sm:justify-between'>
                <span className='text-ink-2'>
                  Draft your recommendation. The student sees it only if you
                  turn on a preview.
                </span>
                <div className='flex items-center gap-2 text-ink-2'>
                  <span className='caption'>Step</span>
                  <span className='font-semibold'>
                    {step === "details"
                      ? "1"
                      : step === "letterhead"
                        ? "2"
                        : "3"}{" "}
                    / 3
                  </span>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto'>
            <div className='grid gap-4 px-4 py-4 sm:px-6'>
              {/* ── Step indicator ── */}
              <div className='grid grid-cols-3 gap-2'>
                {(["details", "letterhead", "letter"] as const).map(
                  (s, idx) => {
                    const labels = [
                      "Recommender details",
                      "Letterhead + signature",
                      "Letter",
                    ];
                    const isActive =
                      s === step || (s === "letter" && step === "preview");
                    const isPast =
                      (s === "details" && step !== "details") ||
                      (s === "letterhead" &&
                        (step === "letter" || step === "preview"));
                    return (
                      <div key={s} className='flex flex-col gap-1.5'>
                        <span
                          className={`h-1 ${
                            isActive
                              ? "bg-forest"
                              : isPast
                                ? "bg-sealed"
                                : "bg-rule"
                          }`}
                        />
                        <span
                          className={`caption ${
                            isActive
                              ? "text-ink"
                              : isPast
                                ? "text-sealed"
                                : "text-ink-2"
                          }`}
                        >
                          {idx + 1}. {labels[idx]}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>

              {/* ── Step: Recommender details ── */}
              {step === "details" && (
                <div className='grid gap-4'>
                  <div>
                    <h3 className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
                      Recommender information
                    </h3>
                    <p className='text-sm text-ink-2'>
                      Used for letterhead and verification details.
                    </p>
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {(
                      [
                        {
                          id: "prefix",
                          label: "Prefix",
                          placeholder: "Dr.",
                          field: "prefix",
                        },
                        {
                          id: "title",
                          label: "Position / Title",
                          placeholder: "Professor",
                          field: "title",
                          required: true,
                        },
                        {
                          id: "first-name",
                          label: "First Name",
                          placeholder: "First name",
                          field: "firstName",
                          required: true,
                        },
                        {
                          id: "last-name",
                          label: "Last Name",
                          placeholder: "Last name",
                          field: "lastName",
                          required: true,
                        },
                        {
                          id: "organization",
                          label: "Organization",
                          placeholder: "University name",
                          field: "organization",
                          required: true,
                        },
                        {
                          id: "department",
                          label: "Department / School",
                          placeholder: "Department or school",
                          field: "department",
                        },
                        {
                          id: "relationship",
                          label: "Relationship",
                          placeholder: "Professor, Advisor, Mentor",
                          field: "relationship",
                        },
                        {
                          id: "recommender-email",
                          label: "Email",
                          placeholder: "faculty@university.edu",
                          field: "email",
                          type: "email",
                          required: true,
                        },
                        {
                          id: "recommender-phone",
                          label: "Phone",
                          placeholder: "Include country code",
                          field: "phone",
                        },
                      ] as Array<{
                        id: string;
                        label: string;
                        placeholder: string;
                        field: keyof RecommenderForm;
                        type?: string;
                        required?: boolean;
                      }>
                    ).map(({ id, label, placeholder, field, type, required }) => (
                      <div key={id} className='grid gap-2'>
                        <Label htmlFor={id}>
                          {label}
                          {required && <span className='ml-0.5 text-declined'>*</span>}
                        </Label>
                        <Input
                          id={id}
                          type={type ?? "text"}
                          placeholder={placeholder}
                          required={required}
                          aria-invalid={
                            showDetailErrors && required && !recommenderForm[field].trim()
                              ? true
                              : undefined
                          }
                          value={recommenderForm[field]}
                          onChange={(e) =>
                            handleRecommenderChange(field, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  {/* Optional: the PDF prints only the address lines that are filled in. */}
                  <details
                    className='group border-y border-rule py-3'
                    open={Boolean(
                      recommenderForm.street || recommenderForm.city || recommenderForm.country,
                    )}
                  >
                    <summary className='flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-display text-base font-bold uppercase tracking-[0.06em] text-forest-ink'>
                      Add a mailing address to the letterhead
                      <span className='caption text-ink-2 group-open:hidden'>Optional</span>
                    </summary>
                  <div className='mt-3 grid gap-4 sm:grid-cols-3'>
                    <div className='grid gap-2'>
                      <Label htmlFor='country'>Country</Label>
                      <Input
                        id='country'
                        placeholder='Country'
                        value={recommenderForm.country}
                        onChange={(e) =>
                          handleRecommenderChange("country", e.target.value)
                        }
                      />
                    </div>
                    <div className='grid gap-2 sm:col-span-2'>
                      <Label htmlFor='street'>Street</Label>
                      <Input
                        id='street'
                        placeholder='Street and number'
                        value={recommenderForm.street}
                        onChange={(e) =>
                          handleRecommenderChange("street", e.target.value)
                        }
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='city'>City</Label>
                      <Input
                        id='city'
                        value={recommenderForm.city}
                        onChange={(e) =>
                          handleRecommenderChange("city", e.target.value)
                        }
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='state'>State or province</Label>
                      <Input
                        id='state'
                        value={recommenderForm.state}
                        onChange={(e) =>
                          handleRecommenderChange("state", e.target.value)
                        }
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='postal'>Postal or PIN code</Label>
                      <Input
                        id='postal'
                        value={recommenderForm.postalCode}
                        onChange={(e) =>
                          handleRecommenderChange("postalCode", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  </details>
                  {/* ── Sign-off ── */}
                  <div className='grid gap-2'>
                    <Label htmlFor='sign-off'>Sign-off</Label>
                    <Input
                      id='sign-off'
                      placeholder='Sincerely,'
                      value={recommenderForm.signOff}
                      onChange={(e) =>
                        handleRecommenderChange("signOff", e.target.value)
                      }
                    />
                    <p className='text-xs text-ink-2'>
                      e.g. Sincerely, Best regards, With warm regards
                    </p>
                  </div>

                  {/* ── Save-profile strip (account holders only) ── */}
                  {onSaveProfile && (
                  <div className='flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-start sm:justify-between'>
                    <p className='text-sm text-ink-2'>
                      Save your details so they autofill on your next letter.
                    </p>
                    <div className='flex flex-col gap-1 sm:items-end'>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-11'
                        disabled={
                          isSavingProfile ||
                          !isDetailsComplete ||
                          !onSaveProfile
                        }
                        onClick={async () => {
                          if (!onSaveProfile) return;
                          setIsSavingProfile(true);
                          setProfileSaved(false);
                          setProfileSaveError(null);
                          const result = await onSaveProfile(recommenderForm);
                          setIsSavingProfile(false);
                          if (result.success) {
                            setProfileSaved(true);
                          } else {
                            setProfileSaveError(
                              result.error ?? "Failed to save profile.",
                            );
                          }
                        }}
                      >
                        {isSavingProfile
                          ? "Saving…"
                          : profileSaved
                            ? "Saved ✓"
                            : "Save to profile"}
                      </Button>
                      {profileSaveError && (
                        <p className='mt-1 text-xs font-semibold text-declined flex items-center gap-1'>
                          ❌ {profileSaveError}
                        </p>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              )}

              {/* ── Step: Letterhead + signature ── */}
              {step === "letterhead" && (
                <div className='grid gap-4'>
                  <div>
                    <h3 className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
                      Letterhead + signature
                    </h3>
                    <p className='text-sm text-ink-2'>
                      Upload a logo (any image format) and a transparent PNG
                      signature.
                    </p>
                  </div>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='grid gap-2'>
                      <Label htmlFor='letterhead-logo'>Letterhead logo</Label>
                      <div className='flex items-center gap-3 border border-input bg-white px-3 py-2'>
                        <label
                          htmlFor='letterhead-logo'
                          className='inline-flex min-h-11 cursor-pointer items-center bg-paper-2 px-3 text-sm font-semibold text-forest-ink ring-1 ring-inset ring-ink/25 hover:ring-forest'
                        >
                          Choose file
                        </label>
                        <span className='min-w-0 truncate text-sm text-ink-2'>
                          {logoFile ? logoFile.name : "No file chosen"}
                        </span>
                        <Input
                          id='letterhead-logo'
                          type='file'
                          accept='image/*'
                          className='sr-only'
                          onChange={(e) =>
                            void handleLogoSelect(e.target.files?.[0] ?? null)
                          }
                        />
                      </div>
                      <p className='text-xs text-ink-2'>
                        {logoFile ? `Selected: ${logoFile.name}` : "Optional"}
                      </p>
                      {isUploadingLogo && (
                        <span className='text-xs text-waiting'>
                          Uploading...
                        </span>
                      )}
                      {logoUploadError && (
                        <span className='text-xs font-semibold text-declined flex items-center gap-1'>
                          <X /> {logoUploadError}
                        </span>
                      )}
                      {!isUploadingLogo &&
                        !logoUploadError &&
                        logoStoragePath && (
                          <>
                            <span className='text-xs font-medium text-sealed flex items-center gap-1'>
                              <Check />
                              Uploaded
                            </span>
                          </>
                        )}
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='signature-upload'>Signature (PNG)</Label>
                      <div className='flex items-center gap-3 border border-input bg-white px-3 py-2'>
                        <label
                          htmlFor='signature-upload'
                          className='inline-flex min-h-11 cursor-pointer items-center bg-paper-2 px-3 text-sm font-semibold text-forest-ink ring-1 ring-inset ring-ink/25 hover:ring-forest'
                        >
                          Choose file
                        </label>
                        <span className='min-w-0 truncate text-sm text-ink-2'>
                          {signatureFile
                            ? signatureFile.name
                            : "No file chosen"}
                        </span>
                        <Input
                          id='signature-upload'
                          type='file'
                          accept='image/png'
                          className='sr-only'
                          onChange={(e) =>
                            handleSignatureSelect(e.target.files?.[0] ?? null)
                          }
                        />
                      </div>
                      <p className='text-xs text-ink-2'>
                        {signatureFile
                          ? `Selected: ${signatureFile.name}`
                          : "Required: transparent PNG"}
                      </p>
                      {isUploadingSignature && (
                        <p className='text-xs text-waiting'>Uploading...</p>
                      )}
                      {signatureUploadError && (
                        <p className='text-xs font-semibold text-declined flex items-center gap-1'>
                          <X /> {signatureUploadError}
                        </p>
                      )}
                      {!isUploadingSignature &&
                        !signatureUploadError &&
                        signatureStoragePath && (
                          <p className='text-xs font-medium text-sealed flex items-center gap-1'>
                            <Check /> Uploaded - saved to your profile
                          </p>
                        )}
                      {signatureError && (
                        <p className='text-xs font-semibold text-declined'>
                          {signatureError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='bg-paper-2 p-3 text-xs text-ink-2'>
                    If your PNG has a white background, use{" "}
                    <a
                      className='font-semibold text-forest underline'
                      href='https://www.remove.bg/'
                      target='_blank'
                      rel='noreferrer'
                    >
                      remove.bg
                    </a>{" "}
                    or create a free transparent signature using{" "}
                    <a
                      className='font-semibold text-forest underline'
                      href='https://www.signwell.com/online-signature/'
                      target='_blank'
                      rel='noreferrer'
                    >
                      SignWell
                    </a>
                    .
                  </div>
                  <div className='grid gap-3 border-t border-rule pt-4 text-sm text-ink-2'>
                    <p className='caption text-ink-2'>Preview</p>
                    <div className='flex flex-wrap items-end gap-6'>
                      <div className='flex flex-col gap-1'>
                        <span className='caption text-ink-2'>Logo</span>
                        {(logoPreviewUrl ?? logoDataUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoPreviewUrl ?? logoDataUrl!}
                            alt='Logo preview'
                            className='h-12 w-32 border border-rule bg-white object-contain p-1'
                          />
                        ) : (
                          <div className='flex h-12 w-32 items-center justify-center border border-dashed border-rule text-[11px] text-ink-2'>
                            None
                          </div>
                        )}
                      </div>
                      <div className='flex flex-col gap-1'>
                        <span className='caption text-ink-2'>Signature</span>
                        {(signaturePreviewUrl ?? signatureDataUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={signaturePreviewUrl ?? signatureDataUrl!}
                            alt='Signature preview'
                            className='h-12 w-40 border border-rule bg-white object-contain p-1'
                          />
                        ) : (
                          <div className='flex h-12 w-40 items-center justify-center border border-dashed border-rule text-[11px] text-ink-2'>
                            None
                          </div>
                        )}
                      </div>
                    </div>
                    {signatureDataUrl && !signatureFile && (
                      <p className='text-xs font-medium text-sealed'>
                        Using your saved signature. Upload a new PNG above to
                        replace it.
                      </p>
                    )}
                    {logoDataUrl && !logoFile && (
                      <p className='text-xs font-medium text-sealed'>
                        Using your saved logo. Upload a new file above to
                        replace it.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step: Letter content ── */}
              {step === "letter" && (
                <div className='grid gap-2'>
                  <Label htmlFor='letter-content'>Letter content</Label>
                  <LetterEditor
                    initialState={letterEditorState}
                    onChange={({ html, plainText, editorState }) => {
                      setLetterHtml(html);
                      setLetterPlainText(plainText);
                      setLetterEditorState(editorState);
                      setDraftSaved(false);
                      setIsDirty(true);
                    }}
                  />
                  {/* ── Live closing preview ── */}
                  <div className='mt-4 border-t border-rule pt-4'>
                    <p className='caption mb-3 text-ink-2'>
                      Letter closing preview
                    </p>
                    <div className='flex flex-col items-start gap-2 text-xs text-ink-2'>
                      <span className='text-sm text-ink-2'>
                        {recommenderForm.signOff || "Sincerely,"}
                      </span>
                      {(signaturePreviewUrl ?? signatureDataUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signaturePreviewUrl ?? signatureDataUrl!}
                          alt='Signature preview'
                          className='h-12 w-40 object-contain'
                        />
                      ) : (
                        <div className='h-12 w-40 border border-dashed border-rule' />
                      )}
                      <div className='text-xs text-ink-2'>
                        {[
                          recommenderForm.prefix,
                          recommenderForm.firstName,
                          recommenderForm.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Your Name"}
                      </div>
                      {recommenderForm.title && (
                        <div className='text-[11px] text-ink-2'>
                          {recommenderForm.title}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='mt-2 bg-paper-2 p-3 text-xs text-ink-2'>
                    <span className='font-bold text-forest-ink'>
                      Next step:{" "}
                    </span>
                    Review a sealed preview before finalizing.
                  </div>
                </div>
              )}

              {/* ── Step: Preview ── */}
              {step === "preview" && (
                <div className='grid gap-4'>
                  <div>
                    <h3 className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
                      Preview
                    </h3>
                    <p className='text-sm text-ink-2'>
                      This is how the letterhead and signature will appear on
                      the final letter.
                    </p>
                  </div>
                  <div className='border border-rule bg-white p-4 sm:p-6'>
                    <div className='flex min-h-[520px] flex-col gap-6 text-sm text-ink'>
                      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6'>
                        <div className='flex items-start gap-4'>
                          {(logoPreviewUrl ?? logoDataUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoPreviewUrl ?? logoDataUrl!}
                              alt='Letterhead logo preview'
                              className='h-16 w-28 object-contain'
                            />
                          ) : (
                            <div className='flex h-16 w-28 items-center justify-center border border-dashed border-rule text-[10px] uppercase text-ink-2'>
                              Logo
                            </div>
                          )}
                          <div className='space-y-1 flex flex-col'>
                            <p className='text-sm font-semibold text-forest-ink'>
                              {`${recommenderForm.prefix} ${recommenderForm.firstName} ${recommenderForm.lastName}` ||
                                "Name"}
                            </p>
                            <p className='text-sm font-semibold text-forest-ink'>
                              {recommenderForm.title || "Title"}
                            </p>
                            <p className='text-sm font-semibold text-forest-ink'>
                              {recommenderForm.department || "Department"}
                            </p>
                          </div>
                        </div>
                        <div className='text-xs text-ink-2 sm:text-right'>
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
                      <div className='border-t border-dashed border-rule' />
                      <div className='flex-1 text-sm text-ink'>
                        {letterHtml ? (
                          <div
                            className='space-y-3'
                            dangerouslySetInnerHTML={{ __html: letterHtml }}
                          />
                        ) : (
                          <p className='text-xs text-ink-2'>
                            Letter content will render here using your editor
                            text.
                          </p>
                        )}
                      </div>
                      <div className='flex flex-col items-start gap-2 text-xs text-ink-2'>
                        <span className='text-sm text-ink-2'>
                          {recommenderForm.signOff || "Sincerely,"}
                        </span>
                        {(signaturePreviewUrl ?? signatureDataUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={signaturePreviewUrl ?? signatureDataUrl!}
                            alt='Signature preview'
                            className='h-12 w-40 object-contain'
                          />
                        ) : (
                          <div className='h-12 w-40 border border-dashed border-rule' />
                        )}
                        <div className='text-xs text-ink-2'>
                          {[
                            recommenderForm.prefix,
                            recommenderForm.firstName,
                            recommenderForm.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Your Name"}
                        </div>
                        {recommenderForm.title && (
                          <div className='text-[11px] text-ink-2'>
                            {recommenderForm.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student preview toggle */}
                  <div className='flex items-center justify-between gap-3 border-t border-rule pt-4'>
                    <div>
                      <p className='text-sm font-semibold text-forest-ink'>
                        Allow student preview
                      </p>
                      <p className='mt-0.5 text-xs text-ink-2'>
                        Student can view a watermarked copy in their dashboard.
                      </p>
                    </div>
                    <button
                      type='button'
                      role='switch'
                      aria-checked={studentPreviewEnabled}
                      onClick={() => void handleToggleStudentPreview()}
                      className={
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none " +
                        (studentPreviewEnabled ? "bg-forest" : "bg-ink-2/40")
                      }
                    >
                      <span
                        className={
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform " +
                          (studentPreviewEnabled
                            ? "translate-x-5"
                            : "translate-x-0")
                        }
                      />
                    </button>
                  </div>

                  {/* ── Finalize confirmation ── */}
                  {showFinalizeConfirm && (
                    <div ref={finalizeConfirmRef} className='border-t-2 border-declined pt-4'>
                      <p className='text-sm font-semibold text-declined'>
                        Confirm finalization
                      </p>
                      <p className='mt-1 text-xs text-ink'>
                        This is permanent and cannot be undone. The letter will
                        be sealed, locked, and made available for student
                        delivery.
                      </p>
                      {finalizeError && (
                        <p className='mt-2 text-xs font-semibold text-declined'>
                          ❌ {finalizeError}
                        </p>
                      )}
                      <div className='mt-3 flex gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          className='h-11'
                          onClick={() => {
                            setShowFinalizeConfirm(false);
                            setFinalizeError(null);
                          }}
                          disabled={isFinalizing}
                        >
                          Cancel
                        </Button>
                        <Button
                          type='button'
                          variant='destructive'
                          className='h-11'
                          onClick={() => void handleFinalize()}
                          disabled={isFinalizing}
                        >
                          {isFinalizing
                            ? "Finalizing…"
                            : "Yes, Finalize & Seal"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='flex flex-col gap-2 border-t border-rule px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
            <div className='flex items-center gap-2'>
              {step !== "details" && (
                <Button
                  type='button'
                  variant='outline'
                  className='h-11'
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
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              {step === "details" && (
                <div className='flex flex-col items-end gap-1'>
                  {footerHint && (
                    <span className='text-xs font-semibold text-waiting'>
                      {footerHint}
                    </span>
                  )}
                  <Button
                    type='button'
                    className='h-11'
                    onClick={() => {
                      if (isDetailsComplete) return setStep("letterhead");
                      // Show what is missing and take the professor to the first gap.
                      setShowDetailErrors(true);
                      const firstMissing = {
                        firstName: "first-name",
                        lastName: "last-name",
                        title: "title",
                        organization: "organization",
                        email: "recommender-email",
                      }[missingDetailFields[0] as string];
                      if (firstMissing) document.getElementById(firstMissing)?.focus();
                    }}
                  >
                    Continue to Letterhead
                  </Button>
                </div>
              )}
              {step === "letterhead" && (
                <div className='flex flex-col items-end gap-1'>
                  {footerHint && (
                    <span className='text-xs font-semibold text-waiting'>
                      {footerHint}
                    </span>
                  )}
                  <Button
                    type='button'
                    className='h-11'
                    onClick={() => setStep("letter")}
                    disabled={!isLetterheadReady}
                  >
                    Continue to Letter
                  </Button>
                </div>
              )}
              {step === "letter" && (
                <div className='flex flex-col items-end gap-1'>
                  {footerHint && (
                    <span className='text-xs font-semibold text-waiting'>
                      {footerHint}
                    </span>
                  )}
                  <Button
                    type='button'
                    className='h-11'
                    onClick={() => setStep("preview")}
                    disabled={!isLetterComplete}
                  >
                    Review Preview
                  </Button>
                </div>
              )}
              {step === "preview" && (
                <>
                  <div className='flex items-start gap-2 border-l border-waiting pl-3 text-xs text-ink'>
                    <span className='shrink-0 text-base leading-none'>⚠️</span>
                    <p>
                      <span className='font-bold'>
                        Finalization is permanent.
                      </span>{" "}
                      Once sealed, the letter is locked and cannot be edited.
                      Save a draft first if you&rsquo;re not ready.
                    </p>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <Button
                      variant='outline'
                      className={`h-11 ${draftSaved ? "text-sealed" : ""}`}
                      disabled={isSavingDraft}
                      onClick={() => void handleSaveDraft()}
                    >
                      {isSavingDraft
                        ? "Saving…"
                        : draftSaved
                          ? "Draft Saved ✓"
                          : "Save Draft"}
                    </Button>
                    {draftSaveError && (
                      <p className='text-xs font-semibold text-declined'>
                        ❌ {draftSaveError}
                      </p>
                    )}
                    {footerHint ? (
                      <span className='text-xs font-semibold text-waiting'>
                        {footerHint}
                      </span>
                    ) : isDirty && requestId ? (
                      <span className='text-xs text-waiting'>
                        ● Unsaved changes
                      </span>
                    ) : lastAutosaved ? (
                      <span className='text-xs text-sealed'>
                        Autosaved{" "}
                        {lastAutosaved.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    variant='gold'
                    className='h-11'
                    disabled={isFinalizing || showFinalizeConfirm}
                    onClick={() => setShowFinalizeConfirm(true)}
                  >
                    Finalize &amp; Seal Letter
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unsaved-changes guard ── */}
      <Dialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl font-bold uppercase tracking-[0.04em] text-forest-ink'>
              Discard unsaved changes?
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes to this draft. If you close now, they
              will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex gap-2 sm:justify-end'>
            <Button
              variant='outline'
              className='h-11'
              onClick={() => setShowCloseWarning(false)}
            >
              Keep editing
            </Button>
            <Button
              variant='destructive'
              className='h-11'
              onClick={() => {
                setShowCloseWarning(false);
                setIsDirty(false);
                setIsOpen(false);
                setStep("details");
                setLastAutosaved(null);
              }}
            >
              Discard &amp; close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
