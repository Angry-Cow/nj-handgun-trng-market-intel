import React, { useState, useRef } from "react";

type Props = {
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
  onUpdate?: (id: string, data: any) => Promise<any>;
  editData?: any | null;
  isMutating: boolean;
};

const NJ_COUNTIES = [
  "Atlantic", "Bergen", "Burlington", "Camden", "Cape May",
  "Cumberland", "Essex", "Gloucester", "Hudson", "Hunterdon",
  "Mercer", "Middlesex", "Monmouth", "Morris", "Ocean",
  "Passaic", "Salem", "Somerset", "Sussex", "Union", "Warren",
];

const FACILITY_TYPES = ["range", "private instructor", "gun club", "retailer"];

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      countrycodes: "us",
    });
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: { "Accept-Language": "en", "User-Agent": "NJ-Firearms-Dashboard/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

const EMPTY_FORM = {
  facilityName: "",
  facilityType: "range",
  county: "Middlesex",
  address: "",
  phone: "",
  website: "",
  servicesOffered: "",
  ownerOperator: "",
  basicHandgunPrice: "",
  ccwPrepPrice: "",
  laneFee: "",
  privateLessonRate: "",
  lanes: "",
  capacity: "",
  membershipOptions: "",
  instructorCredentials: "",
  dataConfidence: "90",
  needsVerification: "false",
  sourceUrl: "",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

export const AddCompetitorModal = ({ onClose, onCreate, onUpdate, editData, isMutating }: Props) => {
  const isEditMode = !!editData;

  // Resolved coords — null means not yet geocoded, { lat, lng } means geocoded
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "found" | "notfound">("idle");
  // Track the last address we actually geocoded so we don't re-geocode unchanged addresses
  const lastGeocodedAddress = useRef<string>("");

  const [form, setForm] = useState<FormState>(() => {
    if (editData) {
      return {
        facilityName: editData.facilityName ?? "",
        facilityType: editData.facilityType ?? "range",
        county: editData.county ?? "Middlesex",
        address: editData.address ?? "",
        phone: editData.phone ?? "",
        website: editData.website ?? "",
        servicesOffered: editData.servicesOffered ?? "",
        ownerOperator: editData.ownerOperator ?? "",
        basicHandgunPrice: editData.basicHandgunPrice != null ? String(editData.basicHandgunPrice) : "",
        ccwPrepPrice: editData.ccwPrepPrice != null ? String(editData.ccwPrepPrice) : "",
        laneFee: editData.laneFee != null ? String(editData.laneFee) : "",
        privateLessonRate: editData.privateLessonRate != null ? String(editData.privateLessonRate) : "",
        lanes: editData.lanes != null ? String(editData.lanes) : "",
        capacity: editData.capacity ?? "",
        membershipOptions: editData.membershipOptions ?? "",
        instructorCredentials: editData.instructorCredentials ?? "",
        dataConfidence: editData.dataConfidence != null ? String(editData.dataConfidence) : "90",
        needsVerification: editData.needsVerification ? "true" : "false",
        sourceUrl: editData.sourceUrl ?? "",
        notes: editData.notes ?? "",
      };
    }
    return { ...EMPTY_FORM };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Returns true if we need to geocode: create mode always; edit mode only when address changed or coords are 0/missing
  const shouldGeocode = (address: string) => {
    if (!address.trim()) return false;
    if (address === lastGeocodedAddress.current) return false;
    if (isEditMode) {
      const hasCoords = editData?.latitude && editData?.longitude && editData.latitude !== 0 && editData.longitude !== 0;
      const addressChanged = address.trim() !== (editData?.address ?? "").trim();
      return !hasCoords || addressChanged;
    }
    return true;
  };

  const runGeocode = async (address: string) => {
    if (!shouldGeocode(address)) return;
    setGeocoding(true);
    setGeocodeStatus("idle");
    const coords = await geocodeAddress(address);
    setGeocoding(false);
    if (coords) {
      setResolvedCoords(coords);
      setGeocodeStatus("found");
      lastGeocodedAddress.current = address;
    } else {
      setResolvedCoords(null);
      setGeocodeStatus("notfound");
    }
  };

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    // Reset geocode status when address changes
    if (key === "address") {
      setGeocodeStatus("idle");
      setResolvedCoords(null);
    }
  };

  const validateStep1 = () => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.facilityName.trim()) errs.facilityName = "Required";
    if (!form.address.trim()) errs.address = "Required";
    if (!form.phone.trim()) errs.phone = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep1()) return;
    // Kick off geocoding when advancing from step 1
    await runGeocode(form.address);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    // Determine final lat/lng:
    // 1. Use freshly geocoded coords if available
    // 2. Fall back to existing editData coords if they are non-zero
    // 3. Last resort: 0,0 (will be flagged for verification)
    const existingLat = editData?.latitude ?? 0;
    const existingLng = editData?.longitude ?? 0;
    const hasExistingCoords = existingLat !== 0 && existingLng !== 0;
    const finalLat = resolvedCoords?.lat ?? (hasExistingCoords ? existingLat : 0);
    const finalLng = resolvedCoords?.lng ?? (hasExistingCoords ? existingLng : 0);

    // If we still have no coords (geocode failed or wasn&#39;t run), try once more synchronously
    let lat = finalLat;
    let lng = finalLng;
    if (lat === 0 && lng === 0 && form.address.trim()) {
      setGeocoding(true);
      const coords = await geocodeAddress(form.address.trim());
      setGeocoding(false);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        setResolvedCoords(coords);
        setGeocodeStatus("found");
        lastGeocodedAddress.current = form.address.trim();
      }
    }

    const payload = {
      facilityName: form.facilityName.trim(),
      facilityType: form.facilityType,
      county: form.county,
      address: form.address.trim(),
      latitude: lat,
      longitude: lng,
      phone: form.phone.trim(),
      website: form.website.trim(),
      servicesOffered: form.servicesOffered.trim() || "General Training",
      ownerOperator: form.ownerOperator.trim() || undefined,
      basicHandgunPrice: form.basicHandgunPrice ? Number(form.basicHandgunPrice) : undefined,
      ccwPrepPrice: form.ccwPrepPrice ? Number(form.ccwPrepPrice) : undefined,
      laneFee: form.laneFee ? Number(form.laneFee) : undefined,
      privateLessonRate: form.privateLessonRate ? Number(form.privateLessonRate) : undefined,
      lanes: form.lanes ? Number(form.lanes) : undefined,
      capacity: form.capacity.trim() || undefined,
      membershipOptions: form.membershipOptions.trim() || undefined,
      instructorCredentials: form.instructorCredentials.trim() || undefined,
      dataConfidence: Number(form.dataConfidence),
      needsVerification: form.needsVerification === "true",
      sourceUrl: form.sourceUrl.trim() || "manual-entry",
      dateAccessed: new Date(),
      notes: form.notes.trim() || undefined,
    };
    try {
      if (isEditMode && onUpdate) {
        await onUpdate(editData.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err: any) {
      console.error("Competitor save failed", err);
      setSubmitError(`Failed to ${isEditMode ? "update" : "create"} competitor. Please try again.`);
    }
  };

  const inputCls = (field: keyof FormState) =>
    `w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-slate-50 transition-colors ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? "Edit Competitor" : "Add New Competitor"}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Step {step} of 2 — {step === 1 ? "Basic Info" : "Pricing & Details"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-8 pt-4 gap-2">
          {([1, 2] as const).map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? "bg-blue-600" : "bg-gray-100"}`} />
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-8 py-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Facility Name <span className="text-red-500">*</span></label>
                  <input value={form.facilityName} onChange={(e) => set("facilityName", e.target.value)} className={inputCls("facilityName")} placeholder="e.g., Central Jersey Firearms Academy" />
                  {errors.facilityName && <p className="text-red-500 text-xs mt-1">{errors.facilityName}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Facility Type</label>
                  <select value={form.facilityType} onChange={(e) => set("facilityType", e.target.value)} className={inputCls("facilityType")}>
                    {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">County</label>
                  <select value={form.county} onChange={(e) => set("county", e.target.value)} className={inputCls("county")}>
                    {NJ_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Full Address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      onBlur={(e) => runGeocode(e.target.value)}
                      className={inputCls("address")}
                      placeholder="123 Main St, City, NJ 07000"
                    />
                    {geocoding && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-blue-500">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-r-transparent inline-block" />
                        Looking up...
                      </span>
                    )}
                    {!geocoding && geocodeStatus === "found" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Coords found
                      </span>
                    )}
                    {!geocoding && geocodeStatus === "notfound" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Not found
                      </span>
                    )}
                  </div>
                  {geocodeStatus === "found" && resolvedCoords && (
                    <p className="text-xs text-green-600 mt-1">
                      📍 {resolvedCoords.lat.toFixed(5)}, {resolvedCoords.lng.toFixed(5)} — will be saved automatically
                    </p>
                  )}
                  {geocodeStatus === "notfound" && (
                    <p className="text-xs text-amber-500 mt-1">
                      ⚠ Could not resolve coordinates — record will be saved with lat/lng 0,0 and flagged for verification
                    </p>
                  )}
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Phone <span className="text-red-500">*</span></label>
                  <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls("phone")} placeholder="(732) 555-0100" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Website</label>
                  <input value={form.website} onChange={(e) => set("website", e.target.value)} className={inputCls("website")} placeholder="https://example.com" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Owner / Operator</label>
                  <input value={form.ownerOperator} onChange={(e) => set("ownerOperator", e.target.value)} className={inputCls("ownerOperator")} placeholder="Name or company" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Services Offered</label>
                  <input value={form.servicesOffered} onChange={(e) => set("servicesOffered", e.target.value)} className={inputCls("servicesOffered")} placeholder="Basic, CCW, Private Lessons" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Basic Handgun Price ($)</label>
                  <input type="number" min="0" value={form.basicHandgunPrice} onChange={(e) => set("basicHandgunPrice", e.target.value)} className={inputCls("basicHandgunPrice")} placeholder="e.g., 75" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">CCW Prep Price ($)</label>
                  <input type="number" min="0" value={form.ccwPrepPrice} onChange={(e) => set("ccwPrepPrice", e.target.value)} className={inputCls("ccwPrepPrice")} placeholder="e.g., 150" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Lane Fee ($/hr)</label>
                  <input type="number" min="0" value={form.laneFee} onChange={(e) => set("laneFee", e.target.value)} className={inputCls("laneFee")} placeholder="e.g., 25" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Private Lesson Rate ($/hr)</label>
                  <input type="number" min="0" value={form.privateLessonRate} onChange={(e) => set("privateLessonRate", e.target.value)} className={inputCls("privateLessonRate")} placeholder="e.g., 100" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Number of Lanes</label>
                  <input type="number" min="0" value={form.lanes} onChange={(e) => set("lanes", e.target.value)} className={inputCls("lanes")} placeholder="e.g., 12" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Capacity</label>
                  <input value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className={inputCls("capacity")} placeholder="e.g., 50 students/day" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Instructor Credentials</label>
                  <input value={form.instructorCredentials} onChange={(e) => set("instructorCredentials", e.target.value)} className={inputCls("instructorCredentials")} placeholder="NRA Certified, USCCA, etc." />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Membership Options</label>
                  <input value={form.membershipOptions} onChange={(e) => set("membershipOptions", e.target.value)} className={inputCls("membershipOptions")} placeholder="Monthly, Annual, Family" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Data Confidence (%)</label>
                  <input type="number" min="50" max="100" value={form.dataConfidence} onChange={(e) => set("dataConfidence", e.target.value)} className={inputCls("dataConfidence")} />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Needs Verification?</label>
                  <select value={form.needsVerification} onChange={(e) => set("needsVerification", e.target.value)} className={inputCls("needsVerification")}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Source URL</label>
                  <input value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} className={inputCls("sourceUrl")} placeholder="https://source-website.com or 'manual-entry'" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Internal Notes</label>
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={`${inputCls("notes")} resize-none`} placeholder="Any additional notes about this facility..." />
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {submitError}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="text-sm font-bold text-gray-500 bg-white border border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>

          {step === 1 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isMutating}
                className="text-sm font-bold text-blue-600 bg-white border border-blue-200 px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isMutating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                    Saving...
                  </>
                ) : (
                  isEditMode ? "Save Changes" : "Save & Close"
                )}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="text-sm font-bold text-white bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Next: Pricing & Details →
              </button>
            </div>
          ) : (
            <button
              type="submit"
              form=""
              disabled={isMutating}
              onClick={handleSubmit}
              className="text-sm font-bold text-white bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isMutating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Saving...
                </>
              ) : (
                isEditMode ? "Save Changes" : "Save Competitor"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
