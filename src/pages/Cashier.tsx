import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const Cashier = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [choose, setChoose] = useState("Resident");
    const [loadedColumn, setLoadedColumn] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [endpoint, setEndpoint] = useState('');
    const [search, setSearch] = useState("");

    // Helper function to convert snake_case to Title Case
    const snakeCaseToTitleCase = (str: string): string => {
        return str
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Map display column names to data keys
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

    // Get status badge styling
    const getStatusBadge = (status: string) => {
        const statusUpper = (status ?? "").toUpperCase();
        switch(statusUpper) {
            case "ENCODED":
                return { 
                    bg: "bg-info-soft", 
                    border: "border-info-subtle", 
                    text: "text-fg-info-strong",
                    dot: "bg-info",
                    label: "Encoded" 
                };
            case "INCOMPLETE":
                return { 
                    bg: "bg-warning-soft", 
                    border: "border-warning-subtle", 
                    text: "text-fg-warning-strong",
                    dot: "bg-warning",
                    label: "Incomplete" 
                };
            case "RELEASED":
                return { 
                    bg: "bg-success-soft", 
                    border: "border-success-subtle", 
                    text: "text-fg-success-strong",
                    dot: "bg-success",
                    label: "Released" 
                };
            case "REJECTED":
                return { 
                    bg: "bg-danger-soft", 
                    border: "border-danger-subtle", 
                    text: "text-fg-danger-strong",
                    dot: "bg-danger",
                    label: "Rejected" 
                };
            default:
                return { 
                    bg: "bg-neutral-soft", 
                    border: "border-neutral-subtle", 
                    text: "text-fg-neutral-strong",
                    dot: "bg-neutral",
                    label: statusUpper 
                };
        }
    };


    const getEndpoint = () => {
        if (choose === "Resident") return "https://westrembomis.onrender.com/api/residents";
        if (choose === "Barangay Clearance") return "https://westrembomis.onrender.com/api/barangay-clearances";
        if (choose === "Business Clearance") return "https://westrembomis.onrender.com/api/business-clearances";
        if (choose === "Building Clearance") return "https://westrembomis.onrender.com/api/building-clearances";
        if (choose === "Barangay Certificate") return "https://westrembomis.onrender.com/api/barangay-certificates";
        return "";
    };
    const mapData = (entity: string, data: any[]) => {
        return data.map((row: any) => {
            console.log("Mapping row:", row);
            switch(entity) {
                case "Resident":
                    return {
                        id: row.id,
                        first_name: row.first_name,
                        last_name: row.surname,
                        status: row.status,
                    };
                case "Barangay Clearance":
                    return {
                        id: row.id,
                        first_name: row.first_name,
                        last_name: row.surname,
                        purpose: row.purpose,
                        status: row.status,
                    };
                case "Business Clearance":
                    return {
                        id: row.id,
                        first_name: row.first_name,
                        last_name: row.surname,
                        business_name: row.business_name,
                        status: row.status,
                    };
                case "Building Clearance":
                    return {
                        id: row.id,
                        first_name: row.first_name,
                        last_name: row.surname,
                        purpose: row.purpose,
                        status: row.status,
                    };
                case "Barangay Certificate":
                    return {
                        id: row.id,
                        bcert_number: row.bcert_number || row.certificate_number || `BCERT-${row.id}`,
                        issued_date: row.issued_date ? new Date(row.issued_date).toLocaleDateString('en-US') : '',
                        full_name: `${row.first_name || ''} ${row.middle_name || ''} ${row.surname || ''} ${row.extension || ''}`.trim(),
                        date_of_birth: row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString('en-US') : '',
                        purpose: row.purpose,
                        status: row.status,
                    };
                default:
                    return row;
            }
        });
    };



    useEffect(() => {
        // Change Column Headers - Essential fields only
        if (choose === "Resident") {
            setLoadedColumn(["ID", "First Name", "Last Name", "Status", "Action"]);
        } else if (choose === "Barangay Clearance") {
            setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Status", "Action"]);
        } else if (choose === "Business Clearance") {
            setLoadedColumn(["ID", "First Name", "Last Name", "Business Name", "Status", "Action"]);
        } else if (choose === "Building Clearance") {
            setLoadedColumn(["ID", "First Name", "Last Name", "Purpose", "Status", "Action"]);
        } else if (choose === "Barangay Certificate") {
            setLoadedColumn(["BCERT Number", "Issued Date", "Name", "Date of Birth", "Purpose", "Status", "Action"]);
        }

        // Fetch Data Based on Selected Filter
        const fetchData = async () => {
            const endpoint = getEndpoint();
            if (!endpoint) return setTableData([]);

            try {
                const res = await axios.get(endpoint, { 
                    params: { search },   // <-- add this
                    withCredentials: true 
                });

                // Laravel paginate handling
                const rows =
                    res?.data?.data?.data && Array.isArray(res.data.data.data)
                        ? res.data.data.data
                        : [];

                console.log(rows);

                // const pendingRows = rows.filter((row: any) => row.status?.toUpperCase() === "ENCODED");

                const mappedRows = mapData(choose, rows); // <-- map API data
                setTableData(mappedRows);
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

                        {/* Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute top-16 right-4 z-10 bg-neutral-primary-medium border bg-gray-100 rounded-base shadow-lg w-40">
                                <ul className="p-2 text-sm text-body">
                                    {[
                                        "Resident",
                                        "Barangay Clearance",
                                        "Building Clearance",
                                        "Business Clearance",
                                        "Barangay Certificate",
                                    ].map((item) => (
                                        <li key={item}>
                                            <button
                                                onClick={() => {
                                                    setChoose(item);
                                                    setDropdownOpen(false);
                                                }}
                                                className="w-full p-2 hover:bg-neutral-tertiary-medium rounded"
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
                        {/* Table */}
                    <table className="w-full text-sm text-left text-body">
                        <thead className="text-sm bg-neutral-secondary-medium border-b">
                            <tr>
                                <th className="p-4">
                                    <input type="checkbox" className="w-4 h-4" />
                                </th>

                                {loadedColumn.map((item) => (
                                    <th key={item} className="px-6 py-3 font-medium">{item}</th>
                                ))}
                                
                            </tr>
                        </thead>

                            <tbody>
                                {tableData.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-b border-default-medium">
                                        <td className="p-4">
                                            <input type="checkbox" className="w-4 h-4" />
                                        </td>

                                        {loadedColumn.map((col, colIndex) => (
                                            col === "Action" ? (
                                                <td key={colIndex} className="px-6 py-3">
                                                    
                                                    {/* Action Combo Box */}
                                                    <select
                                                        className="px-2 py-1 border rounded"
                                                        value={(row.status ?? "Pending").toUpperCase()}
                                                        onChange={async (e) => {
                                                            const newStatus = e.target.value;

                                                            try {
                                                                // Determine the proper status endpoint
                                                                let statusEndpoint = "";
                                                                switch (choose) {
                                                                    case "Barangay Clearance":
                                                                        statusEndpoint = `https://westrembomis.onrender.com/api/barangay-clearances/status/${row.id}`;
                                                                        break;
                                                                    case "Business Clearance":
                                                                        statusEndpoint = `https://westrembomis.onrender.com/api/business-clearances/status/${row.id}`;
                                                                        break;
                                                                    case "Building Clearance":
                                                                        statusEndpoint = `https://westrembomis.onrender.com/api/building-clearances/status/${row.record_id}`;
                                                                        break;
                                                                    case "Barangay Certificate":
                                                                        statusEndpoint = `https://westrembomis.onrender.com/api/barangay-certificates/status/${row.id}`;
                                                                        break;
                                                                    case "Resident":
                                                                        statusEndpoint = `https://westrembomis.onrender.com/api/residents/status/${row.id}`;
                                                                        break;
                                                                    default:
                                                                        statusEndpoint = `${getEndpoint()}/${row.id}`;
                                                                }

                                                                // PUT request to update status
                                                                const ers = await axios.put(
                                                                    statusEndpoint,
                                                                    { status: newStatus },
                                                                    { withCredentials: true }
                                                                );

                                                                if(ers.status == 200){
                                                                    toast("Successfully change the status")
                                                                }


                                                                // Update UI instantly
                                                                setTableData((prev) => {
                                                                    const updated = [...prev];
                                                                    updated[rowIndex].status = newStatus;
                                                                    return updated;
                                                                });
                                                            } catch (err) {
                                                                console.error("Error updating status:", err);
                                                            }
                                                        }}

                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="INCOMPLETE">Incomplete</option>
                                                        <option value="REJECTED">Rejected</option>
                                                        <option value="RELEASED">Released</option>
                                                    </select>


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
