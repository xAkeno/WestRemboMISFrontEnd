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


    const getEndpoint = () => {
        if (choose === "Resident") return "http://127.0.0.1:8000/api/residents";
        if (choose === "Barangay Clearance") return "http://127.0.0.1:8000/api/barangay-clearances";
        if (choose === "Business Clearance") return "http://127.0.0.1:8000/api/business-clearances";
        if (choose === "Building Clearance") return "http://127.0.0.1:8000/api/building-clearances";
        if (choose === "Barangay Certificate") return "http://127.0.0.1:8000/api/barangay-certificates";
        return "";
    };
    const mapData = (entity: string, data: any[]) => {
        return data.map((row: any) => {
            switch(entity) {
                case "Resident":
                    const dob = row.date_of_birth ? new Date(row.date_of_birth) : null;
                    const age = dob ? Math.floor((new Date().getTime() - dob.getTime()) / (1000*60*60*24*365.25)) : "";
                    return {
                        id: row.id,
                        resident_id: row.resident_id,
                        prefix: row.prefix,
                        surname: row.surname,
                        firstname: row.first_name,
                        middle_name: row.middle_name,
                        extension: row.ext_name,
                        house_block_lot_no: row.house_block_lot_no,
                        street: row.street,
                        zone: row.zone,
                        date_of_birth: row.date_of_birth,
                        place_of_birth: row.place_of_birth,
                        age: age,
                        registered_voter: row.voter_status,
                        house_owner: row.house_owner,
                        relationship_to_owner: row.relationship_to_owner,
                        period_of_residency: row.period_of_residency,
                        status: row.status,
                    };
                case "Barangay Clearance":
                    return {
                        id: row.id,
                        bcert_number: row.bcert_number,
                        issued_date: row.issued_date,
                        surname: row.surname,
                        firstname: row.first_name,
                        middle_name: row.middle_name,
                        extension: row.ext_name,
                        house_block_lot_no: row.house_block_lot_no,
                        street: row.street,
                        zone: row.zone,
                        date_of_birth: row.dob,
                        place_of_birth: row.pob,
                        purpose: row.purpose,
                        remarks: row.remarks,
                        status: row.status,
                    };
                case "Business Clearance":
                    return {
                        id: row.id,
                        brgy_business_no: row.brgyBusinessNo,
                        issued_date: row.issuedDate,
                        prefix: row.prefix,
                        surname: row.surname,
                        firstname: row.firstname,
                        middle_name: row.middlename,
                        extension: row.ext,
                        street: row.street,
                        zone: row.zone,
                        business_name: row.businessName,
                        business_type: row.businessType,
                        business_details: row.businessDetails,
                        capital: row.capital,
                        house_block_lot_no: row.houseBlockLotNo,
                        or_no: row.orNo,
                        inspected_by: row.inspectedBy,
                        date_of_inspection: row.dateOfInspection,
                        inspection_remarks: row.inspectionRemarks,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        status: row.status,
                    };
                case "Building Clearance":
                    return {
                        record_id: row.id,
                        bcert_number: row.bcert_number,
                        issued_date: row.issuedDate,
                        prefix: row.prefix,
                        firstname: row.firstname,
                        middle_name: row.middlename,
                        surname: row.surname,
                        extension: row.extension,
                        purpose: row.purpose,
                        purpose_details: row.purposeDetails,
                        house_block_lot_no: row.houseBlockLot,
                        street: row.street,
                        zone: row.zone,
                        or_no: row.or_no,
                        remarks: row.remarks,
                        punong_barangay: row.punongBarangay,
                        for_the_punong_barangay: row.forThePunongBarangay,
                        barangay_position: row.barangayPosition,
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                        status: row.status,
                    };
                case "Barangay Certificate":
                    return {
                        id: row.id,
                        bcert_number: row.bcert_number,
                        issued_date: row.issued_date,
                        surname: row.surname,
                        firstname: row.firstname,
                        middle_name: row.middle_name,
                        extension: row.extension,
                        house_block_lot_no: row.house_block_lot_no,
                        street: row.street,
                        zone: row.zone,
                        date_of_birth: row.date_of_birth,
                        place_of_birth: row.place_of_birth,
                        age: row.age,
                        prefix: row.prefix,
                        punong_barangay: row.punong_barangay,
                        for_the_punong_barangay: row.for_the_punong_barangay,
                        registered_voter: row.registered_voter,
                        house_owner: row.house_owner,
                        relationship_to_owner: row.relationship_to_owner,
                        period_of_residency: row.period_of_residency,
                        purpose: row.purpose,
                        purpose_details: row.purpose_details,
                        status: row.status,
                    };
                default:
                    return row;
            }
        });
    };



    useEffect(() => {
        // Change Column Headers
        if (choose === "Resident") {
            setLoadedColumn([
                "id",
                "resident_id",
                "prefix",
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
                "registered_voter",
                "house_owner",
                "relationship_to_owner",
                "period_of_residency",
                "status",
                "Action",
            ]);
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
                "status",
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
                "created_at",
                "updated_at",
                "status",
                "Action",
            ]);
        } else if (choose === "Building Clearance") {
            setLoadedColumn([
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
                "status",
                "Action",
            ]);
        } else if (choose === "Barangay Certificate") {
            setLoadedColumn([
                "id",
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
                "status",
                "Action",
            ]);
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

                console.log(rows)

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
                                                                        statusEndpoint = `http://127.0.0.1:8000/api/barangay-clearances/status/${row.id}`;
                                                                        break;
                                                                    case "Business Clearance":
                                                                        statusEndpoint = `http://127.0.0.1:8000/api/business-clearances/status/${row.id}`;
                                                                        break;
                                                                    case "Building Clearance":
                                                                        statusEndpoint = `http://127.0.0.1:8000/api/building-clearances/status/${row.record_id}`;
                                                                        break;
                                                                    case "Barangay Certificate":
                                                                        statusEndpoint = `http://127.0.0.1:8000/api/barangay-certificates/status/${row.id}`;
                                                                        break;
                                                                    case "Resident":
                                                                        statusEndpoint = `http://127.0.0.1:8000/api/residents/status/${row.id}`;
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
                                                        <option value="RELEASED">Released</option>
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
            </div>
        </Layout>
    );
};

export default Cashier;
