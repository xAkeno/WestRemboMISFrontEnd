import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// Map UI entity name → API type key (matches backend prefixMap)
const TYPE_MAP: { [key: string]: string } = {
    "Resident":             "resident",
    "Barangay Clearance":   "barangay_clearance",
    "Business Clearance":   "business_clearance",
    "Building Clearance":   "building_clearance",
    "Barangay Certificate": "certificate",
};

const Cashier = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [choose, setChoose] = useState("Resident");
    const [loadedColumn, setLoadedColumn] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    // Service prices loaded from admin settings
    const [servicePrices, setServicePrices] = useState<{ [type: string]: number }>({});

    // Track OR input values per row
    const [orInputs, setOrInputs] = useState<{ [key: number]: string }>({});
    // Track which rows are saving OR
    const [savingOr, setSavingOr] = useState<Set<number>>(new Set());
    // Track which rows are auto-generating OR
    const [generatingOr, setGeneratingOr] = useState<Set<number>>(new Set());

    // Load service prices on mount
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:8000/api/service-prices", {
                    withCredentials: true,
                });
                const data: { type: string; amount: string | number }[] = res.data?.data ?? res.data ?? [];
                const map: { [type: string]: number } = {};
                data.forEach((d) => { map[d.type] = parseFloat(String(d.amount)); });
                setServicePrices(map);
            } catch (err) {
                console.error("Failed to load service prices:", err);
            }
        };
        fetchPrices();
    }, []);

    const getDataKey = (displayName: string): string => {
        const keyMap: { [key: string]: string } = {
            "ID": "id",
            "First Name": "first_name",
            "Last Name": "last_name",
            "Business Name": "business_name",
            "Purpose": "purpose",
            "Status": "status",
            "BCERT Number": "bcert_number",
            "Issued Date": "issued_date",
            "Name": "full_name",
            "Date of Birth": "date_of_birth",
        };
        return keyMap[displayName] || displayName.toLowerCase().replace(/ /g, '_');
    };

    const getStatusBadge = (status: string) => {
        const statusUpper = (status ?? "").toUpperCase();
        switch (statusUpper) {
            case "ENCODED":    return { bg: "bg-info-soft",    text: "text-fg-info-strong",    label: "Encoded"    };
            case "INCOMPLETE": return { bg: "bg-warning-soft", text: "text-fg-warning-strong", label: "Incomplete" };
            case "RELEASED":   return { bg: "bg-success-soft", text: "text-fg-success-strong", label: "Released"   };
            case "REJECTED":   return { bg: "bg-danger-soft",  text: "text-fg-danger-strong",  label: "Rejected"   };
            default:           return { bg: "bg-neutral-soft", text: "text-fg-neutral-strong", label: statusUpper  };
        }
    };

    const getEndpoint = () => {
        if (choose === "Resident")             return "http://127.0.0.1:8000/api/residents";
        if (choose === "Barangay Clearance")   return "http://127.0.0.1:8000/api/barangay-clearances";
        if (choose === "Business Clearance")   return "http://127.0.0.1:8000/api/business-clearances";
        if (choose === "Building Clearance")   return "http://127.0.0.1:8000/api/building-clearances";
        if (choose === "Barangay Certificate") return "http://127.0.0.1:8000/api/barangay-certificates";
        return "";
    };

    // Same pattern as status — PUT /api/{resource}/{id} with just the or_no field
    const getOrEndpoint = (row: any): string => {
        switch (choose) {
            case "Resident":             return `http://127.0.0.1:8000/api/residents/${row.id}`;
            case "Barangay Clearance":   return `http://127.0.0.1:8000/api/barangay-clearances/${row.id}`;
            case "Business Clearance":   return `http://127.0.0.1:8000/api/business-clearances/${row.id}`;
            case "Building Clearance":   return `http://127.0.0.1:8000/api/building-clearances/${row.id}`;
            case "Barangay Certificate": return `http://127.0.0.1:8000/api/barangay-certificates/${row.id}`;
            default: return "";
        }
    };

    // Auto-generate OR: GET /api/generate-or?type=...&reference_id=...&amount=...
    const handleAutoGenerateOr = async (row: any, rowIndex: number) => {
        const type = TYPE_MAP[choose];
        const amount = servicePrices[type] ?? 0;

        setGeneratingOr((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.get("http://127.0.0.1:8000/api/generate-or", {
                params: {
                    type,
                    reference_id: row.id,
                    amount,
                },
                withCredentials: true,
            });

            const generated: string = res.data?.or_number ?? "";
            if (!generated) {
                toast.error("No OR number returned from server.");
                return;
            }

            // Fill the OR input for this row
            setOrInputs((prev) => ({ ...prev, [rowIndex]: generated }));

            // Also persist or_no into tableData immediately
            setTableData((prev) => {
                const updated = [...prev];
                updated[rowIndex] = { ...updated[rowIndex], or_no: generated };
                return updated;
            });

            toast.success(`OR generated: ${generated} — ₱${amount.toFixed(2)}`);
        } catch (err: any) {
            console.error("Error generating OR:", err);
            toast.error(err?.response?.data?.message ?? "Failed to generate OR number.");
        } finally {
            setGeneratingOr((prev) => {
                const next = new Set(prev);
                next.delete(rowIndex);
                return next;
            });
        }
    };

    // Save the OR number manually
    const handleSaveOr = async (row: any, rowIndex: number) => {
        const orValue = orInputs[rowIndex] !== undefined
            ? orInputs[rowIndex]
            : (row.or_no ?? "");

        const orEndpoint = getOrEndpoint(row);
        if (!orEndpoint) return;

        setSavingOr((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.put(
                orEndpoint,
                { or_no: orValue.trim() === "" ? null : orValue.trim() },
                { withCredentials: true }
            );

            if (res.status === 200) {
                setTableData((prev) => {
                    const updated = [...prev];
                    updated[rowIndex] = {
                        ...updated[rowIndex],
                        or_no: orValue.trim() === "" ? null : orValue.trim(),
                    };
                    return updated;
                });
                toast.success(
                    orValue.trim() === "" ? "OR number cleared." : `OR number saved: ${orValue.trim()}`
                );
            }
        } catch (err: any) {
            console.error("Error saving OR number:", err);
            toast.error(err?.response?.data?.message ?? "Failed to save OR number.");
        } finally {
            setSavingOr((prev) => {
                const next = new Set(prev);
                next.delete(rowIndex);
                return next;
            });
        }
    };

    const mapData = (entity: string, data: any[]) => {
        return data.map((row: any) => {
            switch (entity) {
                case "Resident":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, status: row.status, or_no: row.or_no ?? null };
                case "Barangay Clearance":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, purpose: row.purpose, status: row.status, or_no: row.or_no ?? null };
                case "Business Clearance":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, business_name: row.business_name, status: row.status, or_no: row.or_no ?? null };
                case "Building Clearance":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, purpose: row.purpose, status: row.status, or_no: row.or_no ?? null };
                case "Barangay Certificate":
                    return {
                        id: row.id,
                        bcert_number: row.bcert_number || row.certificate_number || `BCERT-${row.id}`,
                        issued_date: row.issued_date ? new Date(row.issued_date).toLocaleDateString('en-US') : '',
                        full_name: `${row.first_name || ''} ${row.middle_name || ''} ${row.surname || ''} ${row.extension || ''}`.trim(),
                        date_of_birth: row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString('en-US') : '',
                        purpose: row.purpose,
                        status: row.status,
                        or_no: row.or_no ?? null,
                    };
                default:
                    return row;
            }
        });
    };

    useEffect(() => {
        if (choose === "Resident")                  setLoadedColumn(["ID", "First Name", "Last Name", "Status", "Action"]);
        else if (choose === "Barangay Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Status", "Action"]);
        else if (choose === "Business Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Business Name", "Status", "Action"]);
        else if (choose === "Building Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Status", "Action"]);
        else if (choose === "Barangay Certificate") setLoadedColumn(["BCERT Number", "Issued Date", "Name", "Date of Birth", "Purpose", "Status", "Action"]);

        const fetchData = async () => {
            const endpoint = getEndpoint();
            if (!endpoint) return setTableData([]);
            try {
                const res = await axios.get(endpoint, { params: { search }, withCredentials: true });
                const rows = res?.data?.data?.data && Array.isArray(res.data.data.data) ? res.data.data.data : [];
                setTableData(mapData(choose, rows));
                setOrInputs({});
            } catch (err) {
                console.error("API Error:", err);
            }
        };

        fetchData();
    }, [choose, search]);

    return (
        <Layout>
            <div className="relative w-full max-w-full bg-neutral-primary-soft h-full shadow-xs rounded-base border border-default">
                <div className="p-4 flex items-center justify-between space-x-4">
                    <label htmlFor="input-group-1" className="sr-only">Search</label>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-body" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="input-group-1"
                            className="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium px-3 py-2 rounded-base"
                            type="button"
                        >
                            <svg className="w-4 h-4 me-1.5" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874l3 2.25v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z" />
                            </svg>
                            {choose}
                            <svg className="w-4 h-4 ms-1.5" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" d="m19 9-7 7-7-7" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-16 right-4 z-10 bg-neutral-primary-medium border bg-gray-100 rounded-base shadow-lg w-44">
                                <ul className="p-2 text-sm text-body">
                                    {["Resident", "Barangay Clearance", "Building Clearance", "Business Clearance", "Barangay Certificate"].map((item) => (
                                        <li key={item}>
                                            <button
                                                onClick={() => { setChoose(item); setDropdownOpen(false); }}
                                                className="w-full p-2 hover:bg-neutral-tertiary-medium rounded text-left"
                                            >
                                                {item}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm text-left text-body">
                        <thead className="text-sm bg-neutral-secondary-medium border-b">
                            <tr>
                                <th className="p-4"><input type="checkbox" className="w-4 h-4" /></th>
                                {loadedColumn.map((item) => (
                                    <th key={item} className="px-6 py-3 font-medium">{item}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {tableData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-default-medium">
                                    <td className="p-4"><input type="checkbox" className="w-4 h-4" /></td>

                                    {loadedColumn.map((col, colIndex) => (
                                        col === "Action" ? (
                                            <td key={colIndex} className="px-6 py-3">
                                                <div className="flex flex-col gap-2 min-w-[220px]">

                                                    {/* Action 1 — Status Dropdown */}
                                                    <select
                                                        className="px-2 py-1 border rounded text-sm w-full"
                                                        value={(row.status ?? "PENDING").toUpperCase()}
                                                        onChange={async (e) => {
                                                            const newStatus = e.target.value;
                                                            try {
                                                                let statusEndpoint = "";
                                                                switch (choose) {
                                                                    case "Barangay Clearance":   statusEndpoint = `http://127.0.0.1:8000/api/barangay-clearances/status/${row.id}`; break;
                                                                    case "Business Clearance":   statusEndpoint = `http://127.0.0.1:8000/api/business-clearances/status/${row.id}`; break;
                                                                    case "Building Clearance":   statusEndpoint = `http://127.0.0.1:8000/api/building-clearances/status/${row.id}`; break;
                                                                    case "Barangay Certificate": statusEndpoint = `http://127.0.0.1:8000/api/barangay-certificates/status/${row.id}`; break;
                                                                    case "Resident":             statusEndpoint = `http://127.0.0.1:8000/api/residents/status/${row.id}`; break;
                                                                    default:                     statusEndpoint = `${getEndpoint()}/${row.id}`;
                                                                }
                                                                const ers = await axios.put(statusEndpoint, { status: newStatus }, { withCredentials: true });
                                                                if (ers.status === 200) toast.success("Status updated successfully.");
                                                                setTableData((prev) => {
                                                                    const updated = [...prev];
                                                                    updated[rowIndex] = { ...updated[rowIndex], status: newStatus };
                                                                    return updated;
                                                                });
                                                            } catch (err) {
                                                                console.error("Error updating status:", err);
                                                                toast.error("Failed to update status.");
                                                            }
                                                        }}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="INCOMPLETE">Incomplete</option>
                                                        <option value="REJECTED">Rejected</option>
                                                        <option value="RELEASED">Released</option>
                                                    </select>

                                                    {/* Action 2 — OR Number */}
                                                    <div className="flex flex-col gap-1.5">

                                                        {/* Fee badge */}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold text-gray-500">OR Number</span>
                                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                                ₱{(servicePrices[TYPE_MAP[choose]] ?? 0).toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* OR input + save */}
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="text"
                                                                placeholder="No OR yet"
                                                                className="flex-1 px-2 py-1 border rounded text-sm min-w-0 placeholder:text-gray-400"
                                                                value={
                                                                    orInputs[rowIndex] !== undefined
                                                                        ? orInputs[rowIndex]
                                                                        : (row.or_no ?? "")
                                                                }
                                                                onChange={(e) =>
                                                                    setOrInputs((prev) => ({ ...prev, [rowIndex]: e.target.value }))
                                                                }
                                                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveOr(row, rowIndex); }}
                                                            />
                                                            {/* Save checkmark */}
                                                            <button
                                                                onClick={() => handleSaveOr(row, rowIndex)}
                                                                disabled={savingOr.has(rowIndex)}
                                                                title="Save OR number"
                                                                className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed rounded transition-colors"
                                                            >
                                                                {savingOr.has(rowIndex) ? (
                                                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                                                        <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Auto Generate OR button */}
                                                        <button
                                                            onClick={() => handleAutoGenerateOr(row, rowIndex)}
                                                            disabled={generatingOr.has(rowIndex)}
                                                            className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed rounded transition-colors w-full"
                                                        >
                                                            {generatingOr.has(rowIndex) ? (
                                                                <>
                                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                    </svg>
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                                                                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                                                                    </svg>
                                                                    Auto Generate OR
                                                                </>
                                                            )}
                                                        </button>

                                                    </div>
                                                </div>
                                            </td>
                                        ) : (
                                            <td key={colIndex} className="px-6 py-3">
                                                {col === "Status" ? (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 border-gray-400 ${getStatusBadge(row[getDataKey(col)]).bg} ${getStatusBadge(row[getDataKey(col)]).text}`}>
                                                        {getStatusBadge(row[getDataKey(col)]).label}
                                                    </span>
                                                ) : (
                                                    row[getDataKey(col)] ?? ""
                                                )}
                                            </td>
                                        )
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Cashier;