import axios from "axios";
import { Layout } from "@/components/Layout";
import React, { useEffect, useState } from "react";

const Cashier = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [choose, setChoose] = useState("Filter By");
    const [loadedColumn, setLoadedColumn] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        // Change Column Headers
        if (choose === "Resident") {
            setLoadedColumn([]);
        } else if (choose === "Barangay Clearance") {
            setLoadedColumn([
                "bcert_number",
                "issued_date",
                "surname",
                "firstname",
                "middle_name",
                "extension",
                "house_block_lot_no",
                "street",
                "zone",
                "date_of_birth",
                "place_of_birth",
                "purpose",
                "remarks",
                "Action",
            ]);
        } else if (choose === "Business Clearance") {
            setLoadedColumn([
                "brgy_business_no",
                "issued_date",
                "prefix",
                "surname",
                "firstname",
                "middle_name",
                "extension",
                "street",
                "zone",
                "business_name",
                "business_type",
                "business_details",
                "capital",
                "house_block_lot_no",
                "or_no",
                "inspected_by",
                "date_of_inspection",
                "inspection_remarks",
                "created_at",
                "updated_at",
                "Action",
            ]);
        } else if (choose === "Building Clearance") {
            setLoadedColumn([
                "record_id",
                "bcert_number",
                "issued_date",
                "prefix",
                "firstname",
                "middle_name",
                "surname",
                "extension",
                "establishment",
                "purpose",
                "purpose_details",
                "house_block_lot_no",
                "street",
                "zone",
                "or_no",
                "remarks",
                "punong_barangay",
                "for_the_punong_barangay",
                "barangay_position",
                "created_at",
                "updated_at",
                "Action",
            ]);
        } else if (choose === "Barangay Certificate") {
            setLoadedColumn([
                "bcert_number",
                "issued_date",
                "surname",
                "firstname",
                "middle_name",
                "extension",
                "house_block_lot_no",
                "street",
                "zone",
                "date_of_birth",
                "place_of_birth",
                "age",
                "prefix",
                "punong_barangay",
                "for_the_punong_barangay",
                "registered_voter",
                "house_owner",
                "relationship_to_owner",
                "period_of_residency",
                "purpose",
                "purpose_details",
                "Action",
            ]);
        }

        // Fetch Data Based on Selected Filter
        const fetchData = async () => {
            try {
                let endpoint = "";

                if (choose === "Barangay Clearance") {
                    endpoint = "http://127.0.0.1:8000/api/barangay-clearances";
                } else if (choose === "Business Clearance") {
                    endpoint = "http://127.0.0.1:8000/api/business-clearances";
                } else if (choose === "Building Clearance") {
                    endpoint = "http://127.0.0.1:8000/api/building-clearances";
                } else if (choose === "Barangay Certificate") {
                    endpoint = "http://127.0.0.1:8000/api/barangay-certificates";
                } else {
                    setTableData([]);
                    return;
                }

                const res = await axios.get(endpoint,{withCredentials:true});
                
                console.log(res);

                // Laravel paginate() returns: res.data.data.data
                const rows =
                            res?.data?.data?.data && Array.isArray(res.data.data.data)
                                ? res.data.data.data
                                : [];

                console.log("Fetched rows:", rows);

                setTableData(rows);
            } catch (err) {
                console.error("API Error:", err);
            }
        };


        fetchData();
    }, [choose]);

    return (
        <Layout>
            <div className="relative w-full max-w-full overflow-x-auto bg-neutral-primary-soft h-full shadow-xs rounded-base border border-default">
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
                            <div className="absolute top-16 right-4 z-10 bg-neutral-primary-medium border rounded-base shadow-lg w-40">
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
                                                    value={row.status || "Pending"}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;

                                                        try {
                                                            await axios.put(
                                                                `http://127.0.0.1:8000/api/update-status/${row.id}`,
                                                                { status: newStatus },
                                                                { withCredentials: true }
                                                            );

                                                            // Update UI instantly
                                                            setTableData(prev => {
                                                                const updated = [...prev];
                                                                updated[rowIndex].status = newStatus;
                                                                return updated;
                                                            });

                                                        } catch (err) {
                                                            console.error("Error updating status:", err);
                                                        }
                                                    }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Released">Released</option>
                                                </select>

                                            </td>
                                        ) : (
                                            <td key={colIndex} className="px-6 py-3">
                                                {row[col] ?? ""}
                                            </td>
                                        )
                                    ))}
                                </tr>
                            ))}
                        </tbody>

                </table>
            </div>
        </Layout>
    );
};

export default Cashier;
