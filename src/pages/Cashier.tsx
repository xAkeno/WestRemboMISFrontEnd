import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

const TYPE_MAP: { [key: string]: string } = {
    "Barangay Clearance":   "barangay_clearance",
    "Business Clearance":   "business_clearance",
    "Building Clearance":   "building_clearance",
    "Barangay Certificate": "certificate",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    ENCODED:    { bg: "bg-blue-100",   text: "text-blue-800",   label: "Encoded"    },
    INCOMPLETE: { bg: "bg-orange-100", text: "text-orange-800", label: "Incomplete" },
    RELEASED:   { bg: "bg-green-100",  text: "text-green-800",  label: "Released"   },
    REJECTED:   { bg: "bg-red-100",    text: "text-red-800",    label: "Rejected"   },
    PAID:       { bg: "bg-teal-100",   text: "text-teal-800",   label: "Paid"       },
    NOT_PAID:   { bg: "bg-red-100",    text: "text-red-700",    label: "Not Paid"   },
    PENDING:    { bg: "bg-gray-100",   text: "text-gray-700",   label: "Pending"    },
    REVIEWED:   { bg: "bg-purple-100", text: "text-purple-800", label: "Reviewed"   },
    TO_PAY:     { bg: "bg-purple-100", text: "text-purple-800", label: "Reviewed"   },
    SCHEDULED:  { bg: "bg-indigo-100", text: "text-indigo-800", label: "Scheduled"  },
    INSPECTING: { bg: "bg-cyan-100",   text: "text-cyan-800",   label: "Inspecting" },
};

function normaliseStatus(raw: string | null | undefined): string {
    if (!raw) return "";
    if (raw.toUpperCase() === "TO_PAY") return "REVIEWED";
    return raw.toUpperCase();
}

function getStatusBadge(status: string) {
    const key = normaliseStatus(status);
    return STATUS_BADGE[key] ?? { bg: "bg-gray-100", text: "text-gray-700", label: key || "—" };
}

interface CmsService {
    id: number;
    name: string;
    fee: string;
    description?: string;
    processing_time?: string;
}

function isCmsFree(fee: string | undefined): boolean {
    if (!fee) return true;
    const trimmed = fee.trim().toLowerCase();
    if (trimmed === "" || trimmed === "free") return true;
    const num = parseFloat(trimmed);
    return isNaN(num) || num === 0;
}

function formatTin(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 13);
    const parts: string[] = [];
    let i = 0;
    const sizes = [3, 3, 3, 4];
    for (const size of sizes) {
        if (i >= digits.length) break;
        parts.push(digits.slice(i, i + size));
        i += size;
    }
    return parts.join("-");
}

const Spinner = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
);

const CheckIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
    </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
);

const ReleaseIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ── OR + TIN panel ────────────────────────────────────────────────────────────
interface OrTinPanelProps {
    row: any;
    rowIndex: number;
    fee: number;
    orInputs: Record<number, string>;
    tinInputs: Record<number, string>;
    tinByOr: Record<string, string>;
    fetchingTin: Set<number>;
    savingRow: Set<number>;
    isPaid: boolean;
    isReleased: boolean;
    releasingRow: Set<number>;
    onOrChange: (rowIndex: number, value: string) => void;
    onTinChange: (rowIndex: number, value: string) => void;
    onSave: () => void;
    onRelease: () => void;
    isFreeService: boolean;
}

const OrTinPanel = ({
    row, rowIndex, orInputs, tinInputs, tinByOr,
    savingRow, isPaid, isReleased, releasingRow,
    onOrChange, onTinChange, onSave, onRelease, isFreeService,
}: OrTinPanelProps) => {
    const displayTin = tinInputs[rowIndex] !== undefined
        ? tinInputs[rowIndex]
        : (row.or_no && tinByOr[row.or_no] !== undefined ? tinByOr[row.or_no] : "");

    const displayOr = orInputs[rowIndex] !== undefined ? orInputs[rowIndex] : (row.or_no ?? "");
    const fieldsDisabled = isPaid || isReleased;

    // Show release button when: paid AND (free service OR OR number is present)
    const orValue = orInputs[rowIndex] !== undefined ? orInputs[rowIndex] : (row.or_no ?? "");
    const canShowRelease = isPaid && !isReleased && (isFreeService || orValue.trim().length > 0);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-end gap-1.5">
                {/* TIN */}
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">TIN (optional)</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Enter TIN"
                        disabled={fieldsDisabled}
                        className={`w-full px-2 py-1 border rounded text-xs placeholder:text-gray-300 font-mono focus:outline-none focus:border-blue-400 ${
                            fieldsDisabled
                                ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 bg-white"
                        }`}
                        value={displayTin}
                        onChange={(e) => onTinChange(rowIndex, formatTin(e.target.value))}
                        onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
                        maxLength={16}
                    />
                </div>

                {/* OR */}
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">OR Number</span>
                    <input
                        type="text"
                        placeholder="No OR yet"
                        disabled={fieldsDisabled}
                        className={`w-full px-2 py-1 border rounded text-xs placeholder:text-gray-300 font-mono focus:outline-none focus:border-blue-400 ${
                            fieldsDisabled
                                ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 bg-white"
                        }`}
                        value={displayOr}
                        onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 20);
                            onOrChange(rowIndex, cleaned);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") onSave(); }}
                        maxLength={20}
                    />
                </div>

                {/* Save */}
                {!fieldsDisabled && (
                    <button
                        onClick={onSave}
                        disabled={savingRow.has(rowIndex)}
                        title="Save OR & TIN"
                        className="flex-shrink-0 inline-flex items-center justify-center px-2.5 py-[7px] rounded transition-colors text-white bg-green-500 hover:bg-green-600 disabled:bg-green-200"
                    >
                        {savingRow.has(rowIndex) ? <Spinner className="w-2.5 h-2.5" /> : <CheckIcon className="w-2.5 h-2.5" />}
                    </button>
                )}
            </div>

            {/* Release button — appears when paid + OR filled (or free service) */}
            {canShowRelease && (
                <button
                    onClick={onRelease}
                    disabled={releasingRow.has(rowIndex)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 transition-colors border border-green-700"
                >
                    {releasingRow.has(rowIndex) ? (
                        <><Spinner className="w-3 h-3" /> Releasing…</>
                    ) : (
                        <><ReleaseIcon /> Release Document</>
                    )}
                </button>
            )}

            {/* Released badge */}
            {isReleased && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-green-700 bg-green-50 border border-green-200">
                    <CheckIcon className="w-3 h-3" /> Released
                </div>
            )}
        </div>
    );
};

// ── Fee Table Component ───────────────────────────────────────────────────────
interface FeeTableProps {
    serviceName: string;
    fee: number;
    isFree: boolean;
    formatFee: (fee: number) => string;
    cmsLoaded: boolean;
}

const FeeTable = ({ serviceName, fee, isFree, formatFee, cmsLoaded }: FeeTableProps) => {
    return (
        <div className="px-4 py-3 border-b border-default-medium bg-white">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fee Schedule</span>
                {!cmsLoaded && <Spinner className="w-3 h-3 text-gray-400" />}
            </div>
            <table className="w-full text-xs border border-gray-100 rounded overflow-hidden">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-1.5 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Service</th>
                        <th className="text-center px-3 py-1.5 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Fee Amount</th>
                        <th className="text-center px-3 py-1.5 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">Payment Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-white">
                        <td className="px-3 py-2 text-gray-700 font-medium">{serviceName}</td>
                        <td className="px-3 py-2 text-center">
                            {!cmsLoaded ? (
                                <span className="text-gray-400 italic">Loading…</span>
                            ) : (
                                <span className={`font-bold ${isFree ? "text-green-600" : "text-amber-700"}`}>
                                    {isFree ? "₱0.00 (Free)" : formatFee(fee)}
                                </span>
                            )}
                        </td>
                        <td className="px-3 py-2 text-center">
                            {!cmsLoaded ? (
                                <span className="text-gray-400 italic text-[10px]">—</span>
                            ) : isFree ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200">
                                    <CheckIcon className="w-2.5 h-2.5" /> Auto-Paid (Free)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Payment Required
                                </span>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const Cashier = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [choose, setChoose] = useState("Barangay Clearance");
    const [loadedColumn, setLoadedColumn] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("REVIEWED");

    const [cmsServices, setCmsServices] = useState<CmsService[]>([]);
    const [cmsLoaded, setCmsLoaded] = useState(false);
    const [servicePrices, setServicePrices] = useState<{ [type: string]: number }>({});

    const [orInputs, setOrInputs] = useState<{ [key: number]: string }>({});
    const [tinByOr, setTinByOr] = useState<{ [or_number: string]: string }>({});
    const [tinInputs, setTinInputs] = useState<{ [key: number]: string }>({});
    const [savingRow, setSavingRow] = useState<Set<number>>(new Set());
    const [markingPaid, setMarkingPaid] = useState<Set<number>>(new Set());
    const [deletingRow, setDeletingRow] = useState<Set<number>>(new Set());
    const [releasingRow, setReleasingRow] = useState<Set<number>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);

    const fetchDataRef = useRef<() => Promise<void>>();

    const CMS_NAME_MAP: Record<string, string> = {
        "Barangay Clearance":   "barangay clearance",
        "Business Clearance":   "business clearance",
        "Building Clearance":   "building clearance",
        "Barangay Certificate": "barangay certificate",
    };

    const getFeeByCmsName = useCallback((displayName: string): { fee: number; free: boolean; found: boolean } => {
        if (!cmsLoaded || cmsServices.length === 0) {
            const type = TYPE_MAP[displayName];
            const legacyFee = servicePrices[type] ?? 0;
            return { fee: legacyFee, free: legacyFee === 0, found: false };
        }
        const needle = CMS_NAME_MAP[displayName]?.toLowerCase() ?? displayName.toLowerCase();
        const matched = cmsServices.find(s =>
            s.name.toLowerCase().includes(needle) ||
            needle.includes(s.name.toLowerCase())
        );
        if (!matched) {
            const type = TYPE_MAP[displayName];
            const legacyFee = servicePrices[type] ?? 0;
            return { fee: legacyFee, free: legacyFee === 0, found: false };
        }
        const free = isCmsFree(matched.fee);
        const fee = free ? 0 : (parseFloat(matched.fee) || 0);
        return { fee, free, found: true };
    }, [cmsLoaded, cmsServices, servicePrices]);

    const getCurrentServiceFee = useCallback((): number => getFeeByCmsName(choose).fee, [choose, getFeeByCmsName]);
    const isFreeService = useCallback((): boolean => getFeeByCmsName(choose).free, [choose, getFeeByCmsName]);
    const formatFee = useCallback((fee: number): string => fee === 0 ? "₱0.00" : `₱${fee.toFixed(2)}`, []);

    useEffect(() => {
        const fetchCmsServices = async () => {
            setCmsLoaded(false);
            try {
                const res = await axios.get("https://westrembomis.onrender.com/api/services", { withCredentials: true });
                const data: CmsService[] = res.data?.data ?? res.data ?? [];
                setCmsServices(data);
            } catch (err) {
                console.error("Failed to load CMS services:", err);
            } finally {
                setCmsLoaded(true);
            }
        };
        fetchCmsServices();
    }, []);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get("https://westrembomis.onrender.com/api/service-prices", { withCredentials: true });
                const data: { type: string; amount: string | number }[] = res.data?.data ?? res.data ?? [];
                const map: { [type: string]: number } = {};
                data.forEach((d) => { map[d.type] = parseFloat(String(d.amount)) || 0; });
                setServicePrices(map);
            } catch (err) {
                console.error("Failed to load legacy service prices:", err);
            }
        };
        fetchPrices();
    }, []);

    const fetchTinByOrNumber = useCallback(async (orNumber: string, rowIndex: number) => {
        if (!orNumber || tinByOr[orNumber] !== undefined) return;
        try {
            const res = await axios.get("https://westrembomis.onrender.com/api/official-receipts/by-or", {
                params: { or_number: orNumber }, withCredentials: true,
            });
            const tin: string = res.data?.data?.tin_no ?? "";
            setTinByOr((prev) => ({ ...prev, [orNumber]: tin }));
        } catch {
            setTinByOr((prev) => ({ ...prev, [orNumber]: "" }));
        }
    }, [tinByOr]);

    useEffect(() => {
        tableData.forEach((row, rowIndex) => {
            if (row.or_no) fetchTinByOrNumber(row.or_no, rowIndex);
        });
    }, [tableData]);

    const getEndpoint = useCallback(() => {
        if (choose === "Barangay Clearance")   return "https://westrembomis.onrender.com/api/barangay-clearances";
        if (choose === "Business Clearance")   return "https://westrembomis.onrender.com/api/business-clearances";
        if (choose === "Building Clearance")   return "https://westrembomis.onrender.com/api/building-clearances";
        if (choose === "Barangay Certificate") return "https://westrembomis.onrender.com/api/barangay-certificates";
        return "";
    }, [choose]);

    const getRowEndpoint = (row: any): string => {
        switch (choose) {
            case "Barangay Clearance":   return `https://westrembomis.onrender.com/api/barangay-clearances/${row.id}`;
            case "Business Clearance":   return `https://westrembomis.onrender.com/api/business-clearances/${row.id}`;
            case "Building Clearance":   return `https://westrembomis.onrender.com/api/building-clearances/${row.id}`;
            case "Barangay Certificate": return `https://westrembomis.onrender.com/api/barangay-certificates/${row.id}`;
            default: return "";
        }
    };

    const getStatusEndpoint = (row: any): string => {
        switch (choose) {
            case "Barangay Clearance":   return `https://westrembomis.onrender.com/api/barangay-clearances/status/${row.id}`;
            case "Business Clearance":   return `https://westrembomis.onrender.com/api/business-clearances/status/${row.id}`;
            case "Building Clearance":   return `https://westrembomis.onrender.com/api/building-clearances/status/${row.id}`;
            case "Barangay Certificate": return `https://westrembomis.onrender.com/api/barangay-certificates/status/${row.id}`;
            default:                     return getRowEndpoint(row);
        }
    };

    const getReleaseEndpoint = (row: any): string => {
        switch (choose) {
            case "Barangay Clearance":   return `https://westrembomis.onrender.com/api/documents/release/barangay-clearances/${row.id}`;
            case "Business Clearance":   return `https://westrembomis.onrender.com/api/documents/release/business-clearances/${row.id}`;
            case "Building Clearance":   return `https://westrembomis.onrender.com/api/documents/release/building-clearances/${row.id}`;
            case "Barangay Certificate": return `https://westrembomis.onrender.com/api/documents/release/barangay-certificates/${row.id}`;
            default: return "";
        }
    };

    const getDataKey = (displayName: string): string => {
        const keyMap: { [key: string]: string } = {
            "ID":            "id",
            "First Name":    "first_name",
            "Last Name":     "last_name",
            "Business Name": "business_name",
            "Purpose":       "purpose",
            "Status":        "status",
            "Fee":           "__fee__",
            "BCERT Number":  "bcert_number",
            "Issued Date":   "issued_date",
            "Name":          "full_name",
            "Date of Birth": "date_of_birth",
        };
        return keyMap[displayName] || displayName.toLowerCase().replace(/ /g, '_');
    };

    const mapData = useCallback((entity: string, data: any[]) => {
        return data.map((row: any) => {
            const base = { or_no: row.or_no ?? null };
            switch (entity) {
                case "Barangay Clearance":
                    return { ...base, id: row.id, first_name: row.first_name, last_name: row.surname, purpose: row.purpose, status: normaliseStatus(row.status) };
                case "Business Clearance":
                    return { ...base, id: row.id, first_name: row.first_name, last_name: row.surname, business_name: row.business_name, status: normaliseStatus(row.status) };
                case "Building Clearance":
                    return { ...base, id: row.id, first_name: row.first_name, last_name: row.surname, purpose: row.purpose, status: normaliseStatus(row.status) };
                case "Barangay Certificate":
                    return {
                        ...base, id: row.id,
                        bcert_number: row.bcert_number || row.certificate_number || `BCERT-${row.id}`,
                        issued_date: row.issued_date ? new Date(row.issued_date).toLocaleDateString('en-US') : '',
                        full_name: `${row.first_name || ''} ${row.middle_name || ''} ${row.surname || ''} ${row.extension || ''}`.trim(),
                        date_of_birth: row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString('en-US') : '',
                        purpose: row.purpose, status: normaliseStatus(row.status),
                    };
                default:
                    return { ...row, status: normaliseStatus(row.status) };
            }
        });
    }, []);

    const fetchData = useCallback(async (silent = false) => {
        const endpoint = getEndpoint();
        if (!endpoint) { setTableData([]); return; }
        if (!silent) setIsRefreshing(true);
        try {
            const params: Record<string, any> = { search };
            if (statusFilter === "REVIEWED") params.status = "TO_PAY";
            else if (statusFilter)           params.status = statusFilter;

            const res = await axios.get(endpoint, { params, withCredentials: true });
            const rows = res?.data?.data?.data && Array.isArray(res.data.data.data) ? res.data.data.data : [];
            const mapped = mapData(choose, rows);
            setTableData(mapped);

            if (statusFilter !== "REVIEWED") {
                try {
                    const rRes = await axios.get(endpoint, { params: { status: "TO_PAY", search: "" }, withCredentials: true });
                    setReviewedCount((rRes?.data?.data?.data ?? []).length);
                } catch { /* silent */ }
            } else {
                setReviewedCount(mapped.length);
            }

            setOrInputs({});
            setTinInputs({});
            setTinByOr({});
        } catch (err) {
            console.error("API Error:", err);
        } finally {
            setIsRefreshing(false);
        }
    }, [choose, search, statusFilter, mapData, getEndpoint]);

    useEffect(() => { fetchDataRef.current = () => fetchData(true); }, [fetchData]);

    useEffect(() => {
        if (choose === "Barangay Clearance")        setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Fee", "Status", "Action"]);
        else if (choose === "Business Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Business Name", "Fee", "Status", "Action"]);
        else if (choose === "Building Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Fee", "Status", "Action"]);
        else if (choose === "Barangay Certificate") setLoadedColumn(["BCERT Number", "Issued Date", "Name", "Date of Birth", "Purpose", "Fee", "Status", "Action"]);
        fetchData();
    }, [choose, search, statusFilter]);

    const handleMarkPaid = async (row: any, rowIndex: number) => {
        if (row.status === "PAID") return;
        setMarkingPaid((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.put(getStatusEndpoint(row), { status: "PAID" }, { withCredentials: true });
            if (res.status === 200) {
                setTableData((prev) => { const u = [...prev]; u[rowIndex] = { ...u[rowIndex], status: "PAID" }; return u; });
                if (statusFilter === "REVIEWED") {
                    setTimeout(() => setTableData(p => p.filter((_, i) => i !== rowIndex)), 800);
                    setReviewedCount(c => Math.max(0, c - 1));
                }
                toast.success("Payment confirmed.");
            }
        } catch {
            toast.error("Failed to confirm payment.");
        } finally {
            setMarkingPaid((prev) => { const n = new Set(prev); n.delete(rowIndex); return n; });
        }
    };

    // ── Duplicate OR check ────────────────────────────────────────────────────
    const checkOrDuplicate = async (orNumber: string, excludeRowId?: number): Promise<boolean> => {
        if (!orNumber.trim()) return false;
        try {
            const res = await axios.get("https://westrembomis.onrender.com/api/official-receipts/by-or", {
                params: { or_number: orNumber.trim() }, withCredentials: true,
            });
            const existing = res.data?.data;
            if (!existing) return false;
            // If found and it belongs to a different record, it's a duplicate
            if (excludeRowId && existing.id === excludeRowId) return false;
            return true;
        } catch {
            // 404 = not found = not a duplicate; other errors — allow through
            return false;
        }
    };

    const handleSaveOrAndTin = async (row: any, rowIndex: number) => {
        const orValue  = orInputs[rowIndex] !== undefined ? orInputs[rowIndex] : (row.or_no ?? "");
        const tinValue = tinInputs[rowIndex] !== undefined ? tinInputs[rowIndex] : (row.or_no ? (tinByOr[row.or_no] ?? "") : "");
        const endpoint = getRowEndpoint(row);
        if (!endpoint) return;

        // ── Duplicate OR check ─────────────────────────────────────────────
        if (orValue.trim()) {
            const isDuplicate = await checkOrDuplicate(orValue.trim(), row.id);
            if (isDuplicate) {
                toast.error(`OR Number "${orValue.trim()}" is already in use. Please use a different OR number.`);
                return;
            }
        }

        setSavingRow((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.put(endpoint, { or_no: orValue.trim() || null }, { withCredentials: true });
            if (res.status === 200) {
                const newOrNo = orValue.trim() || null;
                setTableData((prev) => { const u = [...prev]; u[rowIndex] = { ...u[rowIndex], or_no: newOrNo }; return u; });
                if (newOrNo && tinValue.trim()) {
                    const rawTin = tinValue.replace(/-/g, "");
                    await axios.patch("https://westrembomis.onrender.com/api/official-receipts/by-or",
                        { or_number: newOrNo, tin_no: rawTin }, { withCredentials: true });
                    setTinByOr((prev) => ({ ...prev, [newOrNo]: tinValue }));
                    setTinInputs((prev) => { const n = { ...prev }; delete n[rowIndex]; return n; });
                } else if (newOrNo) {
                    fetchTinByOrNumber(newOrNo, rowIndex);
                }
                toast.success("OR and TIN saved.");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to save.");
        } finally {
            setSavingRow((prev) => { const n = new Set(prev); n.delete(rowIndex); return n; });
        }
    };

    // ── Release document ──────────────────────────────────────────────────────
    const handleRelease = async (row: any, rowIndex: number) => {
        const releaseEndpoint = getReleaseEndpoint(row);
        if (!releaseEndpoint) return;
        setReleasingRow((prev) => new Set(prev).add(rowIndex));
        try {
            // Trigger release — this sets status to RELEASED on the backend
            await axios.post(releaseEndpoint, {}, { withCredentials: true });

            // Update local state to RELEASED
            setTableData((prev) => {
                const u = [...prev];
                u[rowIndex] = { ...u[rowIndex], status: "RELEASED" };
                return u;
            });
            toast.success("Document released successfully.");
        } catch (err: any) {
            // Some backends return 200 via PUT on the status endpoint — try fallback
            try {
                await axios.put(
                    getStatusEndpoint(row),
                    { status: "RELEASED" },
                    { withCredentials: true }
                );
                setTableData((prev) => {
                    const u = [...prev];
                    u[rowIndex] = { ...u[rowIndex], status: "RELEASED" };
                    return u;
                });
                toast.success("Document released successfully.");
            } catch (fallbackErr: any) {
                toast.error(fallbackErr?.response?.data?.message ?? err?.response?.data?.message ?? "Failed to release document.");
            }
        } finally {
            setReleasingRow((prev) => { const n = new Set(prev); n.delete(rowIndex); return n; });
        }
    };

    const handleDelete = async (row: any, rowIndex: number) => {
        if (row.status !== "PAID") return;
        const endpoint = getRowEndpoint(row);
        if (!endpoint) return;
        setDeletingRow((prev) => new Set(prev).add(rowIndex));
        try {
            await axios.delete(endpoint, { withCredentials: true });
            setTableData((prev) => prev.filter((_, i) => i !== rowIndex));
            toast.success("Record deleted.");
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to delete.");
        } finally {
            setDeletingRow((prev) => { const n = new Set(prev); n.delete(rowIndex); return n; });
        }
    };

    const STATUS_TABS = [
        { value: "REVIEWED", label: "To Pay",  activeClass: "bg-purple-600 text-white border-transparent shadow-sm", inactiveClass: "bg-white border-gray-200 hover:bg-purple-50 text-purple-700" },
        { value: "PAID",     label: "Paid",    activeClass: "bg-teal-600 text-white border-transparent shadow-sm",   inactiveClass: "bg-white border-gray-200 hover:bg-teal-50 text-teal-700"   },
        { value: "",         label: "All",     activeClass: "bg-gray-700 text-white border-transparent shadow-sm",   inactiveClass: "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"   },
    ];

    const fee      = getCurrentServiceFee();
    const free     = isFreeService();
    const feeLabel = free ? "₱0.00 (Free)" : formatFee(fee);

    return (
        <Layout>
            <div className="relative w-full max-w-full bg-neutral-primary-soft h-full shadow-xs rounded-base border border-default flex flex-col">

                <FeeTable serviceName={choose} fee={fee} isFree={free} formatFee={formatFee} cmsLoaded={cmsLoaded} />

                {/* Toolbar */}
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap border-b border-default-medium">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input type="text"
                            className="block w-full ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                            placeholder="Search by name, ID..."
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                            free ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {!cmsLoaded ? "Loading fee…" : feeLabel}
                        </div>

                        <button onClick={() => fetchData()} disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                            <svg className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isRefreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        <div className="relative">
                            <button onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="inline-flex items-center gap-1.5 text-body bg-neutral-secondary-medium border border-default-medium px-3 py-2 rounded-base text-sm" type="button">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeWidth="2" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874l3 2.25v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z" />
                                </svg>
                                {choose}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeWidth="2" d="m19 9-7 7-7-7" />
                                </svg>
                            </button>
                            {dropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-52">
                                    <ul className="p-1.5 text-sm">
                                        {["Barangay Clearance", "Building Clearance", "Business Clearance", "Barangay Certificate"].map((item) => (
                                            <li key={item}>
                                                <button onClick={() => { setChoose(item); setDropdownOpen(false); }}
                                                    className="w-full px-3 py-2 hover:bg-gray-50 rounded-md text-left text-gray-700">
                                                    {item}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status tabs */}
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-default-medium bg-gray-50/50">
                    <span className="text-xs font-semibold text-gray-400 mr-1">Show:</span>
                    {STATUS_TABS.map(tab => (
                        <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                statusFilter === tab.value ? tab.activeClass : tab.inactiveClass
                            }`}>
                            {tab.label}
                            {tab.value === "REVIEWED" && reviewedCount > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1 ${
                                    statusFilter === "REVIEWED" ? "bg-white/30 text-white" : "bg-purple-600 text-white"
                                }`}>{reviewedCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto flex-1">
                    <table className="w-full text-sm text-left text-body">
                        <thead className="text-sm bg-neutral-secondary-medium border-b">
                            <tr>
                                {loadedColumn.map((item) => (
                                    <th key={item} className="px-6 py-3 font-medium text-gray-600">{item}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length === 0 ? (
                                <tr>
                                    <td colSpan={loadedColumn.length} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24">
                                                <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-sm font-medium">
                                                {statusFilter === "REVIEWED" ? "No records awaiting payment." : "No records found."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : tableData.map((row, rowIndex) => {
                                const isPaid     = row.status === "PAID";
                                const isReleased = row.status === "RELEASED";

                                return (
                                    <tr key={rowIndex} className={`border-b border-default-medium transition-colors align-middle ${
                                        isReleased ? "bg-green-50/20 hover:bg-green-50/40" :
                                        !isPaid    ? "bg-purple-50/30 hover:bg-purple-50/60"
                                                   : "hover:bg-gray-50/60"
                                    }`}>
                                        {loadedColumn.map((col, colIndex) => {

                                            // ── Fee column ──────────────────
                                            if (col === "Fee") return (
                                                <td key={colIndex} className="px-6 py-3 align-middle">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                        free
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}>
                                                        {!cmsLoaded ? "…" : (free ? "₱0.00" : formatFee(fee))}
                                                    </span>
                                                </td>
                                            );

                                            // ── Status column ───────────────
                                            if (col === "Status") return (
                                                <td key={colIndex} className="px-6 py-3 align-middle">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(row.status).bg} ${getStatusBadge(row.status).text}`}>
                                                        {getStatusBadge(row.status).label}
                                                    </span>
                                                </td>
                                            );

                                            // ── Action column ───────────────
                                            if (col === "Action") return (
                                                <td key={colIndex} className="px-4 py-3 align-middle min-w-[320px] max-w-[400px]">
                                                    <div className="flex flex-col gap-2">

                                                        {/* Payment row */}
                                                        <div className="flex items-center gap-2">
                                                            {/* Green checkbox */}
                                                            <button
                                                                onClick={() => !isPaid && !isReleased && handleMarkPaid(row, rowIndex)}
                                                                disabled={isPaid || isReleased || markingPaid.has(rowIndex) || !cmsLoaded}
                                                                title={isPaid || isReleased ? "Already paid" : "Mark as Paid"}
                                                                className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${
                                                                    isPaid || isReleased
                                                                        ? "bg-green-500 border-green-500 cursor-not-allowed"
                                                                        : markingPaid.has(rowIndex)
                                                                            ? "bg-green-200 border-green-300 cursor-wait"
                                                                            : "bg-white border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer"
                                                                }`}
                                                            >
                                                                {isPaid || isReleased ? (
                                                                    <CheckIcon className="w-3.5 h-3.5 text-white" />
                                                                ) : markingPaid.has(rowIndex) ? (
                                                                    <Spinner className="w-3 h-3 text-green-500" />
                                                                ) : (
                                                                    <span className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>

                                                            <span className={`text-xs font-semibold ${isPaid || isReleased ? "text-green-700" : "text-gray-400"}`}>
                                                                {isPaid || isReleased
                                                                    ? `Paid — ${!cmsLoaded ? "…" : (free ? "₱0.00" : formatFee(fee))}`
                                                                    : "Click to confirm payment"}
                                                            </span>

                                                            {/* Delete — only for paid (not released) */}
                                                            {isPaid && !isReleased && (
                                                                <button
                                                                    onClick={() => handleDelete(row, rowIndex)}
                                                                    disabled={deletingRow.has(rowIndex)}
                                                                    title="Delete record"
                                                                    className={`ml-auto flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
                                                                        deletingRow.has(rowIndex)
                                                                            ? "text-red-300 cursor-wait"
                                                                            : "text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                                    }`}
                                                                >
                                                                    {deletingRow.has(rowIndex) ? <Spinner className="w-3.5 h-3.5" /> : <TrashIcon className="w-3.5 h-3.5" />}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* TIN + OR + Release panel */}
                                                        <OrTinPanel
                                                            row={row} rowIndex={rowIndex} fee={fee}
                                                            orInputs={orInputs} tinInputs={tinInputs} tinByOr={tinByOr}
                                                            fetchingTin={new Set()}
                                                            savingRow={savingRow}
                                                            isPaid={isPaid}
                                                            isReleased={isReleased}
                                                            releasingRow={releasingRow}
                                                            onOrChange={(i, v) => setOrInputs(p => ({ ...p, [i]: v }))}
                                                            onTinChange={(i, v) => setTinInputs(p => ({ ...p, [i]: v }))}
                                                            onSave={() => handleSaveOrAndTin(row, rowIndex)}
                                                            onRelease={() => handleRelease(row, rowIndex)}
                                                            isFreeService={free}
                                                        />

                                                    </div>
                                                </td>
                                            );

                                            return (
                                                <td key={colIndex} className="px-6 py-3 align-middle text-gray-700">
                                                    {row[getDataKey(col)] ?? ""}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Cashier;