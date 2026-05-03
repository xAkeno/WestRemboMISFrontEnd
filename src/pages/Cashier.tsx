import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const TYPE_MAP: { [key: string]: string } = {
    "Barangay Clearance":   "barangay_clearance",
    "Business Clearance":   "business_clearance",
    "Building Clearance":   "building_clearance",
    "Barangay Certificate": "certificate",
};

const ConfirmModal = ({
    open, title, message, onConfirm, onCancel,
}: {
    open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{message}</p>
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
                        Yes, Set It
                    </button>
                </div>
            </div>
        </div>
    );
};

const Cashier = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [choose, setChoose] = useState("Barangay Clearance");
    const [loadedColumn, setLoadedColumn] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [servicePrices, setServicePrices] = useState<{ [type: string]: number }>({});
    const [orInputs, setOrInputs] = useState<{ [key: number]: string }>({});

    const [tinByOr, setTinByOr] = useState<{ [or_number: string]: string }>({});
    const [tinInputs, setTinInputs] = useState<{ [key: number]: string }>({});

    const [savingRow, setSavingRow] = useState<Set<number>>(new Set());
    const [generatingOr, setGeneratingOr] = useState<Set<number>>(new Set());
    const [fetchingTin, setFetchingTin] = useState<Set<number>>(new Set());

    const [startingNumberInput, setStartingNumberInput] = useState<{ [type: string]: string }>({});
    const [settingStart, setSettingStart] = useState<{ [type: string]: boolean }>({});
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: string; value: string }>({ open: false, type: "", value: "" });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get("https://westrembomis.onrender.com/api/service-prices", { withCredentials: true });
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

    const fetchTinByOrNumber = async (orNumber: string, rowIndex: number) => {
        if (!orNumber || tinByOr[orNumber] !== undefined) return;

        setFetchingTin((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.get("https://westrembomis.onrender.com/api/official-receipts/by-or", {
                params: { or_number: orNumber },
                withCredentials: true,
            });
            const tin: string = res.data?.data?.tin_no ?? "";
            setTinByOr((prev) => ({ ...prev, [orNumber]: tin }));
        } catch {
            setTinByOr((prev) => ({ ...prev, [orNumber]: "" }));
        } finally {
            setFetchingTin((prev) => { const next = new Set(prev); next.delete(rowIndex); return next; });
        }
    };

    useEffect(() => {
        tableData.forEach((row, rowIndex) => {
            if (row.or_no) {
                fetchTinByOrNumber(row.or_no, rowIndex);
            }
        });
    }, [tableData]);

    const getDisplayTin = (row: any, rowIndex: number): string => {
        if (tinInputs[rowIndex] !== undefined) return tinInputs[rowIndex];
        if (row.or_no && tinByOr[row.or_no] !== undefined) return tinByOr[row.or_no];
        return "";
    };

    const getDataKey = (displayName: string): string => {
        const keyMap: { [key: string]: string } = {
            "ID":            "id",
            "First Name":    "first_name",
            "Last Name":     "last_name",
            "Business Name": "business_name",
            "Purpose":       "purpose",
            "Status":        "status",
            "BCERT Number":  "bcert_number",
            "Issued Date":   "issued_date",
            "Name":          "full_name",
            "Date of Birth": "date_of_birth",
            "To Pay":        "to_pay",
            "Paid":          "paid",
        };
        return keyMap[displayName] || displayName.toLowerCase().replace(/ /g, '_');
    };

    const getStatusBadge = (status: string) => {
        const statusUpper = (status ?? "").toUpperCase();
        switch (statusUpper) {
            case "ENCODED":    return { bg: "bg-info-soft",    text: "text-fg-info-strong",    label: "Encoded"    };
            case "INCOMPLETE": return { bg: "bg-warning-soft", text: "text-fg-warning-strong", label: "Incomplete" };
            case "RELEASED":   return { bg: "bg-blue-100",     text: "text-blue-700",         label: "Released"   };
            case "REJECTED":   return { bg: "bg-danger-soft",  text: "text-fg-danger-strong",  label: "Rejected"   };
            case "PAID":       return { bg: "bg-success-soft", text: "text-fg-success-strong", label: "Paid"       };
            case "PENDING":    return { bg: "bg-neutral-soft", text: "text-fg-neutral-strong", label: "Pending"    };
            case "TO PAY":     return { bg: "bg-amber-100",    text: "text-amber-700",        label: "To Pay"     };
            default:           return { bg: "bg-neutral-soft", text: "text-fg-neutral-strong", label: statusUpper  };
        }
    };

    const getEndpoint = () => {
        if (choose === "Barangay Clearance")   return "https://westrembomis.onrender.com/api/barangay-clearances";
        if (choose === "Business Clearance")   return "https://westrembomis.onrender.com/api/business-clearances";
        if (choose === "Building Clearance")   return "https://westrembomis.onrender.com/api/building-clearances";
        if (choose === "Barangay Certificate") return "https://westrembomis.onrender.com/api/barangay-certificates";
        return "";
    };

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

    const handleRequestSetStartingNumber = () => {
        const type = TYPE_MAP[choose];
        const raw  = (startingNumberInput[type] ?? "").trim();
        if (!raw || isNaN(Number(raw)) || Number(raw) < 1) {
            toast.error("Please enter a valid number (minimum 1).");
            return;
        }
        setConfirmModal({ open: true, type, value: raw });
    };

    const handleConfirmSetStartingNumber = async () => {
        const { type, value } = confirmModal;
        setConfirmModal({ open: false, type: "", value: "" });
        setSettingStart((prev) => ({ ...prev, [type]: true }));
        try {
            await axios.post(
                "https://westrembomis.onrender.com/api/or-starting-number",
                { type, starting_number: parseInt(value, 10) },
                { withCredentials: true }
            );
            toast.success(`OR starting number for ${choose} set to ${value.padStart(6, "0")}.`);
            setStartingNumberInput((prev) => ({ ...prev, [type]: "" }));
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to set starting number.");
        } finally {
            setSettingStart((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleAutoGenerateOr = async (row: any, rowIndex: number) => {
        const type     = TYPE_MAP[choose];
        const amount   = servicePrices[type] ?? 0;
        const tinValue = tinInputs[rowIndex] !== undefined
            ? tinInputs[rowIndex]
            : (row.or_no ? (tinByOr[row.or_no] ?? "") : "");

        setGeneratingOr((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.get("https://westrembomis.onrender.com/api/generate-or", {
                params: {
                    type,
                    reference_id: row.id,
                    amount,
                    tin_no: tinValue.trim() === "" ? undefined : tinValue.trim(),
                },
                withCredentials: true,
            });

            const generated: string = res.data?.or_number ?? "";
            if (!generated) { toast.error("No OR number returned from server."); return; }

            setOrInputs((prev) => ({ ...prev, [rowIndex]: generated }));
            setTableData((prev) => {
                const updated = [...prev];
                updated[rowIndex] = { ...updated[rowIndex], or_no: generated };
                return updated;
            });

            if (tinValue.trim() !== "") {
                setTinByOr((prev) => ({ ...prev, [generated]: tinValue.trim() }));
            }

            setTinInputs((prev) => { const next = { ...prev }; delete next[rowIndex]; return next; });

            toast.success(`OR generated: ${generated}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to generate OR number.");
        } finally {
            setGeneratingOr((prev) => { const next = new Set(prev); next.delete(rowIndex); return next; });
        }
    };

    const handleSaveOrAndTin = async (row: any, rowIndex: number) => {
        const orValue  = orInputs[rowIndex] !== undefined ? orInputs[rowIndex] : (row.or_no ?? "");
        const tinValue = tinInputs[rowIndex] !== undefined
            ? tinInputs[rowIndex]
            : (row.or_no ? (tinByOr[row.or_no] ?? "") : "");
        const endpoint = getRowEndpoint(row);
        if (!endpoint) return;

        setSavingRow((prev) => new Set(prev).add(rowIndex));
        try {
            const res = await axios.put(
                endpoint,
                { or_no: orValue.trim() === "" ? null : orValue.trim() },
                { withCredentials: true }
            );
            if (res.status === 200) {
                const newOrNo = orValue.trim() === "" ? null : orValue.trim();
                setTableData((prev) => {
                    const updated = [...prev];
                    updated[rowIndex] = { ...updated[rowIndex], or_no: newOrNo };
                    return updated;
                });

                const orForTin = newOrNo;
                if (orForTin && tinValue.trim() !== "") {
                    await axios.patch(
                        "https://westrembomis.onrender.com/api/official-receipts/by-or",
                        { or_number: orForTin, tin_no: tinValue.trim() },
                        { withCredentials: true }
                    );
                    setTinByOr((prev) => ({ ...prev, [orForTin]: tinValue.trim() }));
                    setTinInputs((prev) => { const next = { ...prev }; delete next[rowIndex]; return next; });
                } else if (newOrNo) {
                    fetchTinByOrNumber(newOrNo, rowIndex);
                }

                toast.success("OR and TIN saved.");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Failed to save.");
        } finally {
            setSavingRow((prev) => { const next = new Set(prev); next.delete(rowIndex); return next; });
        }
    };

    const mapData = (entity: string, data: any[]) => {
        return data.map((row: any) => {
            const toPay = row.to_pay ?? null;
            const paid  = row.paid   ?? null;
            switch (entity) {
                case "Barangay Clearance":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, purpose: row.purpose, status: row.status, to_pay: toPay, paid, or_no: row.or_no ?? null };
                case "Business Clearance":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, business_name: row.business_name, status: row.status, to_pay: toPay, paid, or_no: row.or_no ?? null };
                case "Building Clearance":
                    return { id: row.id, first_name: row.first_name, last_name: row.surname, purpose: row.purpose, status: row.status, to_pay: toPay, paid, or_no: row.or_no ?? null };
                case "Barangay Certificate":
                    return {
                        id: row.id,
                        bcert_number: row.bcert_number || row.certificate_number || `BCERT-${row.id}`,
                        issued_date: row.issued_date ? new Date(row.issued_date).toLocaleDateString('en-US') : '',
                        full_name: `${row.first_name || ''} ${row.middle_name || ''} ${row.surname || ''} ${row.extension || ''}`.trim(),
                        date_of_birth: row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString('en-US') : '',
                        purpose: row.purpose,
                        status: row.status,
                        to_pay: toPay,
                        paid,
                        or_no: row.or_no ?? null,
                    };
                default:
                    return row;
            }
        });
    };

    useEffect(() => {
        if (choose === "Barangay Clearance")        setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Status", "Action"]);
        else if (choose === "Business Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Business Name", "Status", "Action"]);
        else if (choose === "Building Clearance")   setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Status", "Action"]);
        else if (choose === "Barangay Certificate") setLoadedColumn(["BCERT Number", "Issued Date", "Name", "Date of Birth", "Purpose", "Status", "Action"]);

        const fetchData = async () => {
            const endpoint = getEndpoint();
            if (!endpoint) return setTableData([]);
            try {
                const res = await axios.get(endpoint, { params: { search }, withCredentials: true });
                const rows = res?.data?.data?.data && Array.isArray(res.data.data.data) ? res.data.data.data : [];
                const mappedData = mapData(choose, rows);
                // Filter to only show rows with "To Pay" or "Released" status
                const filteredData = mappedData.filter((row) => {
                    const statusUpper = (row.status ?? "").toUpperCase();
                    return statusUpper === "TO PAY" || statusUpper === "RELEASED";
                });
                setTableData(filteredData);
                setCurrentPage(1);
                setOrInputs({});
                setTinInputs({});
                setTinByOr({});
            } catch (err) {
                console.error("API Error:", err);
            }
        };
        fetchData();
    }, [choose, search]);

    const currentType = TYPE_MAP[choose];
    
    // Pagination logic
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    return (
        <Layout>
            <ConfirmModal
                open={confirmModal.open}
                title="Set OR Starting Number"
                message={`Are you sure you want to set the starting OR number for "${choose}" to ${String(confirmModal.value).padStart(6, "0")}? Any future auto-generated ORs will begin from this number.`}
                onConfirm={handleConfirmSetStartingNumber}
                onCancel={() => setConfirmModal({ open: false, type: "", value: "" })}
            />

            <div className="relative w-full max-w-full bg-neutral-primary-soft h-full shadow-xs rounded-base border border-default">

                {/* Toolbar */}
                <div className="p-4 flex items-center justify-between space-x-4">
                    <label htmlFor="input-group-1" className="sr-only">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-body" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input type="text" id="input-group-1"
                            className="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                            placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="inline-flex items-center text-body bg-neutral-secondary-medium border border-default-medium px-3 py-2 rounded-base" type="button">
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
                                    {["Barangay Clearance", "Building Clearance", "Business Clearance", "Barangay Certificate"].map((item) => (
                                        <li key={item}>
                                            <button onClick={() => { setChoose(item); setDropdownOpen(false); }}
                                                className="w-full p-2 hover:bg-neutral-tertiary-medium rounded text-left">{item}</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* OR Starting Number Bar - Only show for non-Certificate types */}
                {choose !== "Barangay Certificate" && (
                    <div className="px-4 pb-3 flex items-center gap-2 border-b border-default-medium">
                        <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                d="M9 12h6m-3-3v6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                            OR Starting # for <span className="text-indigo-600 font-bold">{choose}</span>:
                        </span>
                        <input type="text" maxLength={6} placeholder="e.g. 00025"
                            className="px-2 py-1 border rounded text-sm w-28 placeholder:text-gray-400 font-mono tracking-widest"
                            value={startingNumberInput[currentType] ?? ""}
                            onChange={(e) => setStartingNumberInput((prev) => ({ ...prev, [currentType]: e.target.value.replace(/\D/g, "") }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRequestSetStartingNumber(); }} />
                        <button onClick={handleRequestSetStartingNumber} disabled={settingStart[currentType] ?? false}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-lg transition-colors">
                            {settingStart[currentType] ? (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            ) : (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 7" />
                                </svg>
                            )}
                            Set Start
                        </button>
                        <span className="text-xs text-gray-400 italic hidden sm:inline">Next auto-generate will begin from this number</span>
                    </div>
                )}

                {/* Table */}
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
                            {paginatedData.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-default-medium">
                                    <td className="p-4"><input type="checkbox" className="w-4 h-4" /></td>

                                    {loadedColumn.map((col, colIndex) => {

                                        if (col === "Action") return (
                                            <td key={colIndex} className="px-6 py-3">
                                                <div className="flex flex-col gap-2 min-w-[150px]">

                                                    {/* Mark as Paid Button */}
                                                    {(row.status ?? "").toUpperCase() !== "PAID" && (row.status ?? "").toUpperCase() !== "RELEASED" && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const ers = await axios.put(getStatusEndpoint(row), { status: "PAID" }, { withCredentials: true });
                                                                    if (ers.status === 200) {
                                                                        toast.success("Status updated to PAID.");
                                                                        setTableData((prev) => {
                                                                            const updated = [...prev];
                                                                            updated[rowIndex] = { ...updated[rowIndex], status: "PAID" };
                                                                            return updated;
                                                                        });
                                                                    }
                                                                } catch { toast.error("Failed to update status."); }
                                                            }}
                                                            className="w-full px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                                                        >
                                                            Mark as Paid
                                                        </button>
                                                    )}

                                                    <div className="flex items-end gap-2">

                                                        {/* TIN Number */}
                                                        <div className="flex flex-col flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-semibold text-gray-500">
                                                                    TIN Number (optional)
                                                                </span>
                                                                {fetchingTin.has(rowIndex) && (
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                        </svg>
                                                                        Loading...
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter TIN"
                                                                className="w-full px-2 py-1 border rounded text-sm placeholder:text-gray-400 font-mono"
                                                                value={getDisplayTin(row, rowIndex)}
                                                                onChange={(e) =>
                                                                    setTinInputs((prev) => ({ ...prev, [rowIndex]: e.target.value }))
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleSaveOrAndTin(row, rowIndex);
                                                                }}
                                                            />
                                                        </div>

                                                        {/* OR Number */}
                                                        <div className="flex flex-col flex-1">
                                                            <span className="text-xs font-semibold text-gray-500">
                                                                OR Number
                                                            </span>
                                                            <input
                                                                type="text"
                                                                placeholder="No OR yet"
                                                                className={`w-full px-2 py-1 border rounded text-sm placeholder:text-gray-400 font-mono ${row.or_no ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                value={
                                                                    orInputs[rowIndex] !== undefined
                                                                        ? orInputs[rowIndex]
                                                                        : row.or_no ?? ""
                                                                }
                                                                onChange={(e) => {
                                                                    if (!row.or_no) {
                                                                        setOrInputs((prev) => ({
                                                                            ...prev,
                                                                            [rowIndex]: e.target.value,
                                                                        }));
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (!row.or_no && e.key === "Enter") handleSaveOrAndTin(row, rowIndex);
                                                                }}
                                                                readOnly={!!row.or_no}
                                                            />
                                                        </div>

                                                        {/* Save Button */}
                                                        <button
                                                            onClick={() => handleSaveOrAndTin(row, rowIndex)}
                                                            disabled={savingRow.has(rowIndex) || !!row.or_no}
                                                            className={`inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white rounded whitespace-nowrap transition-colors ${
                                                                row.or_no
                                                                    ? 'bg-gray-300 cursor-not-allowed'
                                                                    : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed'
                                                            }`}
                                                        >
                                                            {savingRow.has(rowIndex) ? (
                                                                <>
                                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                                    </svg>
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                                                                    <path
                                                                        stroke="currentColor"
                                                                        strokeWidth="2.5"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M5 12l5 5L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>

                                                    </div>
                                                </div>
                                            </td>
                                        );

                                        if (col === "Status") return (
                                            <td key={colIndex} className="px-6 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 border-gray-400 ${getStatusBadge(row.status).bg} ${getStatusBadge(row.status).text}`}>
                                                    {getStatusBadge(row.status).label}
                                                </span>
                                            </td>
                                        );

                                        return (
                                            <td key={colIndex} className="px-6 py-3">
                                                {row[getDataKey(col)] ?? ""}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-default-medium bg-neutral-secondary-soft">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, tableData.length)}</span> of <span className="font-semibold">{tableData.length}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded transition-colors"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
                                            currentPage === page
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Cashier;