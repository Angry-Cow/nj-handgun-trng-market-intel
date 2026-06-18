import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@animaapp/playground-react-sdk";

type Competitor = {
  id: string;
  facilityName: string;
  facilityType: string;
  county: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  servicesOffered: string;
  ownerOperator?: string;
  basicHandgunPrice?: number | null;
  ccwPrepPrice?: number | null;
  laneFee?: number | null;
  privateLessonRate?: number | null;
  lanes?: number | null;
  capacity?: string;
  membershipOptions?: string;
  instructorCredentials?: string;
  dataConfidence: number;
  needsVerification: boolean;
  sourceUrl: string;
  dateAccessed: Date;
  notes?: string;
};

type Props = {
  competitor: Competitor | null;
  onClose: () => void;
  onFlyTo: (id: string) => void;
};

const TYPE_COLORS: Record<string, string> = {
  range: "bg-blue-600 text-white",
  "private instructor": "bg-green-600 text-white",
  "gun club": "bg-amber-500 text-white",
  retailer: "bg-purple-600 text-white",
};

const getConfColor = (score: number) => {
  if (score >= 95) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 92) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
};

type EditState = {
  facilityName: string;
  phone: string;
  website: string;
  address: string;
  county: string;
  ownerOperator: string;
  servicesOffered: string;
  basicHandgunPrice: string;
  ccwPrepPrice: string;
  laneFee: string;
  privateLessonRate: string;
  lanes: string;
  capacity: string;
  membershipOptions: string;
  instructorCredentials: string;
  dataConfidence: string;
  needsVerification: string;
  sourceUrl: string;
  notes: string;
};

const NJ_COUNTIES = [
  "Atlantic","Bergen","Burlington","Camden","Cape May",
  "Cumberland","Essex","Gloucester","Hudson","Hunterdon",
  "Mercer","Middlesex","Monmouth","Morris","Ocean",
  "Passaic","Salem","Somerset","Sussex","Union","Warren",
];

function toEditState(c: Competitor): EditState {
  return {
    facilityName: c.facilityName ?? "",
    phone: c.phone ?? "",
    website: c.website ?? "",
    address: c.address ?? "",
    county: c.county ?? "Middlesex",
    ownerOperator: c.ownerOperator ?? "",
    servicesOffered: c.servicesOffered ?? "",
    basicHandgunPrice: c.basicHandgunPrice != null ? String(c.basicHandgunPrice) : "",
    ccwPrepPrice: c.ccwPrepPrice != null ? String(c.ccwPrepPrice) : "",
    laneFee: c.laneFee != null ? String(c.laneFee) : "",
    privateLessonRate: c.privateLessonRate != null ? String(c.privateLessonRate) : "",
    lanes: c.lanes != null ? String(c.lanes) : "",
    capacity: c.capacity ?? "",
    membershipOptions: c.membershipOptions ?? "",
    instructorCredentials: c.instructorCredentials ?? "",
    dataConfidence: String(c.dataConfidence),
    needsVerification: c.needsVerification ? "true" : "false",
    sourceUrl: c.sourceUrl ?? "",
    notes: c.notes ?? "",
  };
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  basic_handgun: "Basic Handgun",
  ccw_prep: "CCW Prep",
  advanced: "Advanced",
  private_lesson: "Private Lesson",
  certification: "Certification",
  other: "Other",
};

const COURSE_TYPE_COLORS: Record<string, string> = {
  basic_handgun: "bg-blue-100 text-blue-700",
  ccw_prep: "bg-green-100 text-green-700",
  advanced: "bg-purple-100 text-purple-700",
  private_lesson: "bg-amber-100 text-amber-700",
  certification: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-600",
};

export const ProviderDetailPanel = ({ competitor, onClose, onFlyTo }: Props) => {
  const [activeTab, setActiveTab] = useState<"overview" | "courses">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { update, isPending: isSaving } = useMutation("Competitor");

  const { data: courses, isPending: coursesLoading } = useQuery("CourseOffering", {
    where: { competitorId: competitor?.id ?? "" },
    orderBy: { courseType: "asc" },
  });

  // Reset state whenever the selected competitor changes
  useEffect(() => {
    setIsEditing(false);
    setEditState(null);
    setSaveError(null);
    setSaveSuccess(false);
    setActiveTab("overview");
  }, [competitor?.id]);

  const startEdit = () => {
    if (!competitor) return;
    setEditState(toEditState(competitor));
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditState(null);
    setSaveError(null);
  };

  const set = (k: keyof EditState, v: string) => setEditState((s) => s ? { ...s, [k]: v } : s);

  const handleSave = async () => {
    if (!editState || !competitor) return;
    setSaveError(null);
    try {
      await update(competitor.id, {
        facilityName: editState.facilityName.trim(),
        phone: editState.phone.trim(),
        website: editState.website.trim(),
        address: editState.address.trim(),
        county: editState.county,
        ownerOperator: editState.ownerOperator.trim() || undefined,
        servicesOffered: editState.servicesOffered.trim() || "General Training",
        basicHandgunPrice: editState.basicHandgunPrice ? Number(editState.basicHandgunPrice) : undefined,
        ccwPrepPrice: editState.ccwPrepPrice ? Number(editState.ccwPrepPrice) : undefined,
        laneFee: editState.laneFee ? Number(editState.laneFee) : undefined,
        privateLessonRate: editState.privateLessonRate ? Number(editState.privateLessonRate) : undefined,
        lanes: editState.lanes ? Number(editState.lanes) : undefined,
        capacity: editState.capacity.trim() || undefined,
        membershipOptions: editState.membershipOptions.trim() || undefined,
        instructorCredentials: editState.instructorCredentials.trim() || undefined,
        dataConfidence: Number(editState.dataConfidence),
        needsVerification: editState.needsVerification === "true",
        sourceUrl: editState.sourceUrl.trim() || "manual-entry",
        notes: editState.notes.trim() || undefined,
      });
      setIsEditing(false);
      setEditState(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? "Failed to save. Please try again.");
    }
  };

  const isOpen = !!competitor;

  const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-slate-50 transition-colors";
  const labelCls = "text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1";

  // Read-only row
  const Row = ({ label, value, href, mono }: { label: string; value?: string | number | null; href?: string; mono?: boolean }) => {
    if (value == null || value === "") return null;
    return (
      <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={`text-sm font-semibold text-blue-600 hover:underline truncate ${mono ? "font-mono" : ""}`}>{String(value)}</a>
        ) : (
          <span className={`text-sm font-semibold text-gray-800 ${mono ? "font-mono" : ""}`}>{String(value)}</span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed top-20 right-0 h-[calc(100vh-5rem)] w-full max-w-[520px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {competitor && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                {isEditing ? (
                  <input
                    value={editState?.facilityName ?? ""}
                    onChange={(e) => set("facilityName", e.target.value)}
                    className="w-full text-xl font-bold border border-blue-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-blue-50"
                  />
                ) : (
                  <h2 className="text-xl font-bold leading-tight text-gray-900 truncate">{competitor.facilityName}</h2>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${TYPE_COLORS[competitor.facilityType] ?? "bg-gray-400 text-white"}`}>
                    {competitor.facilityType}
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${getConfColor(competitor.dataConfidence)}`}>
                    {competitor.dataConfidence}% confidence
                  </span>
                  {competitor.needsVerification && (
                    <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200">
                      ⚠ Verify
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onFlyTo(competitor.id)}
                  title="Fly to on map"
                  className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {!isEditing && (
                  <button
                    onClick={startEdit}
                    title="Edit record"
                    className="p-2 rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-100 shrink-0 px-8">
              {(["overview", "courses"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setIsEditing(false); setEditState(null); }}
                  className={`py-3 px-1 mr-6 text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab === "courses"
                    ? `Courses${courses && courses.length > 0 ? ` (${courses.length})` : ""}`
                    : "Overview"}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Changes saved successfully.
                </div>
              )}
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{saveError}</div>
              )}

              {/* Contact & Location */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Contact &amp; Location</h3>
                <div className="bg-gray-50 rounded-2xl px-5 py-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className={labelCls}>Address</label>
                          <input value={editState?.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>County</label>
                          <select value={editState?.county ?? "Middlesex"} onChange={(e) => set("county", e.target.value)} className={inputCls}>
                            {NJ_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Phone</label>
                          <input value={editState?.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
                        </div>
                        <div className="col-span-2">
                          <label className={labelCls}>Website</label>
                          <input value={editState?.website ?? ""} onChange={(e) => set("website", e.target.value)} className={inputCls} placeholder="https://" />
                        </div>
                        <div className="col-span-2">
                          <label className={labelCls}>Owner / Operator</label>
                          <input value={editState?.ownerOperator ?? ""} onChange={(e) => set("ownerOperator", e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Row label="Address" value={competitor.address} />
                      <Row label="County" value={`${competitor.county} County, NJ`} />
                      <Row label="Phone" value={competitor.phone} href={`tel:${competitor.phone}`} />
                      <Row label="Website" value={competitor.website?.replace(/^https?:\/\//, "")} href={competitor.website} />
                      {competitor.ownerOperator && <Row label="Operator" value={competitor.ownerOperator} />}
                      {(competitor.latitude !== 0 || competitor.longitude !== 0) && (
                        <Row label="Coordinates" value={`${competitor.latitude?.toFixed(5)}, ${competitor.longitude?.toFixed(5)}`} mono />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Pricing</h3>
                <div className="bg-gray-50 rounded-2xl px-5 py-3">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "ccwPrepPrice" as const, label: "CCW Prep ($)" },
                        { key: "basicHandgunPrice" as const, label: "Basic Handgun ($)" },
                        { key: "laneFee" as const, label: "Lane Fee ($/hr)" },
                        { key: "privateLessonRate" as const, label: "Private Lesson ($/hr)" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className={labelCls}>{label}</label>
                          <input type="number" min="0" value={editState?.[key] ?? ""} onChange={(e) => set(key, e.target.value)} className={inputCls} placeholder="—" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {competitor.ccwPrepPrice != null && (
                        <div className="flex gap-3 py-2 border-b border-gray-100">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider w-28 shrink-0">CCW Prep</span>
                          <span className="text-sm font-black text-blue-600">${competitor.ccwPrepPrice}</span>
                        </div>
                      )}
                      <Row label="Basic Handgun" value={competitor.basicHandgunPrice != null ? `$${competitor.basicHandgunPrice}` : null} />
                      <Row label="Lane Fee" value={competitor.laneFee != null ? `$${competitor.laneFee}/hr` : null} />
                      <Row label="Private Lesson" value={competitor.privateLessonRate != null ? `$${competitor.privateLessonRate}/hr` : null} />
                      {competitor.ccwPrepPrice == null && competitor.basicHandgunPrice == null && competitor.laneFee == null && competitor.privateLessonRate == null && (
                        <p className="text-sm text-gray-400 py-2">No pricing data available.</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Facility Details */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Facility Details</h3>
                <div className="bg-gray-50 rounded-2xl px-5 py-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Lanes</label>
                          <input type="number" min="0" value={editState?.lanes ?? ""} onChange={(e) => set("lanes", e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Capacity</label>
                          <input value={editState?.capacity ?? ""} onChange={(e) => set("capacity", e.target.value)} className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Services Offered</label>
                        <input value={editState?.servicesOffered ?? ""} onChange={(e) => set("servicesOffered", e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Instructor Credentials</label>
                        <input value={editState?.instructorCredentials ?? ""} onChange={(e) => set("instructorCredentials", e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Membership Options</label>
                        <input value={editState?.membershipOptions ?? ""} onChange={(e) => set("membershipOptions", e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  ) : (
                    <>
                      {competitor.lanes != null && <Row label="Lanes" value={competitor.lanes} />}
                      {competitor.capacity && <Row label="Capacity" value={competitor.capacity} />}
                      <Row label="Services" value={competitor.servicesOffered} />
                      {competitor.instructorCredentials && <Row label="Credentials" value={competitor.instructorCredentials} />}
                      {competitor.membershipOptions && <Row label="Membership" value={competitor.membershipOptions} />}
                    </>
                  )}
                </div>
              </div>

              {/* Data Quality */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Data Quality</h3>
                <div className="bg-gray-50 rounded-2xl px-5 py-3">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Confidence (%)</label>
                        <input type="number" min="50" max="100" value={editState?.dataConfidence ?? "90"} onChange={(e) => set("dataConfidence", e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Needs Verification?</label>
                        <select value={editState?.needsVerification ?? "false"} onChange={(e) => set("needsVerification", e.target.value)} className={inputCls}>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Source URL</label>
                        <input value={editState?.sourceUrl ?? ""} onChange={(e) => set("sourceUrl", e.target.value)} className={inputCls} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Row label="Confidence" value={`${competitor.dataConfidence}%`} />
                      <Row label="Source" value={competitor.sourceUrl !== "manual-entry" ? competitor.sourceUrl : "Manual Entry"} href={competitor.sourceUrl !== "manual-entry" ? competitor.sourceUrl : undefined} />
                      <Row label="Last Accessed" value={competitor.dateAccessed ? new Date(competitor.dateAccessed).toLocaleDateString() : undefined} />
                      {competitor.needsVerification && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                          ⚠ This record requires phone or email verification before relying on it for analysis.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3">Notes</h3>
                <div className="bg-gray-50 rounded-2xl px-5 py-3">
                  {isEditing ? (
                    <textarea
                      value={editState?.notes ?? ""}
                      onChange={(e) => set("notes", e.target.value)}
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Internal notes about this facility..."
                    />
                  ) : (
                    competitor.notes
                      ? <p className="text-sm text-gray-700 leading-relaxed">{competitor.notes}</p>
                      : <p className="text-sm text-gray-400">No notes recorded.</p>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-r-transparent" />
                  </div>
                ) : !courses || courses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-sm font-bold text-gray-400">No course data on record</p>
                    <p className="text-xs text-gray-300 mt-1">Course offerings will appear here once collected.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(courses as any[]).map((course) => (
                      <div key={course.id} className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-900 leading-snug">{course.courseName}</span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${COURSE_TYPE_COLORS[course.courseType] ?? "bg-gray-100 text-gray-600"}`}>
                            {COURSE_TYPE_LABELS[course.courseType] ?? course.courseType}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                          {course.price != null && (
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Price</span>
                              <span className="text-sm font-black text-blue-600">${course.price}</span>
                            </div>
                          )}
                          {(course.durationHours != null || course.durationDescription) && (
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Duration</span>
                              <span className="text-sm font-semibold text-gray-800">
                                {course.durationDescription ?? `${course.durationHours}h`}
                              </span>
                            </div>
                          )}
                          {course.classCapacity != null && (
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Capacity</span>
                              <span className="text-sm font-semibold text-gray-800">{course.classCapacity} students</span>
                            </div>
                          )}
                          {course.certificationBody && (
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Certification</span>
                              <span className="text-sm font-semibold text-gray-800">{course.certificationBody}</span>
                            </div>
                          )}
                        </div>
                        {course.notes && (
                          <p className="text-xs text-gray-500 mt-3 italic border-t border-gray-100 pt-2">{course.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getConfColor(course.dataConfidence)}`}>
                            {course.dataConfidence}% confidence
                          </span>
                          {course.needsVerification && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">⚠ Verify</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {isEditing && (
              <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/60 shrink-0">
                <button
                  onClick={cancelEdit}
                  className="text-sm font-bold text-gray-500 bg-white border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-sm font-bold text-white bg-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
