import { useState, useEffect} from "react";
import axios from "axios";
import { toast } from "sonner";
interface Props {
  updateModal: (open: boolean) => void;
  updateSelect: (open: any) => void;
}

export const BarangayBuildingFindModal = ({updateModal,updateSelect}:Props) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search,setSearch] = useState("");
    const [filter, setFilter] = useState([]);
    const [json,setJson] = useState([]);
    const [latest, setLatest] = useState<any>(null);
    useEffect(() => {
        const fetchdata = async () => {
            try{
                const res = await axios.get(
                    "http://127.0.0.1:8000/api/building-clearances",
                    {withCredentials:true}
                )
                var json = res.data.data
                setJson(json.data);

            }catch (error: any) {
                const errorMessage = error.response?.data?.message || "Failed to save barangay clearance record";
                toast.error(errorMessage);
                console.error(error);
            } 
        }
        fetchdata();
    },[])
    console.log(json)
    return (
        <div className="overflow-y-auto fixed top-0 right-0 left-0 z-50 bg-gray-100 w-[95%] md:inset-0 h-[calc(100%-1rem)] max-h-[80%] mx-auto my-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
        <div className="">
                {/* Top Bar */}
            <div className="p-4 flex items-center justify-between">
                {/* Search */}
                <div className="flex">
                    <input
                        type="text"
                        className="block w-full max-w-96 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body"
                        placeholder="Search"
                    />
                    <button  type="button" className="cursor-pointer py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Search</button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="inline-flex items-center justify-center text-body bg-neutral-secondary-medium border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium rounded-base text-sm px-3 py-2" type="button">
                    <svg
                        className="w-4 h-4 me-1.5 -ms-0.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2"
                        d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"
                        />
                    </svg>
                    Filter by
                    <svg
                        className="w-4 h-4 ms-1.5 -me-0.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 9-7 7-7-7"
                        />
                    </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                    <div className="absolute top-16 right-4 z-10 bg-neutral-primary-medium bg-gray-200 border border-default-medium rounded-base shadow-lg w-32">
                        <ul className="p-2 text-sm text-body font-medium">
                        {["Date", "Surname", "First name", "Last name","Middle name", "Street name", "Zone", "Date of birth", "Purpose"].map((item) => (
                            <li key={item}>
                            <button className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">
                                {item}
                            </button>
                            </li>
                        ))}
                        </ul>
                    </div>
                    )}

                    <div>
                        <button onClick={() => {updateModal(false)}} type="button" className="cursor-pointer py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">X</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full text-sm text-left rtl:text-right text-body">
                <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
                <tr>
                    <th className="p-4">
                    <div className="flex items-center">
                        <input
                        type="checkbox"
                        className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"
                        />
                    </div>
                    </th>
                        {
                        [
                            "Record ID",
                            "BCert Number",
                            "Issued Date",
                            "Prefix",
                            "First Name",
                            "Middle Name",
                            "Surname",
                            "Extension",
                            "Establishment",
                            "Purpose",
                            "Purpose Details",
                            "Block / Lot No.",
                            "Street",
                            "Zone",
                            "OR No.",
                            "Remarks",
                            "Punong Barangay",
                            "For the Punong Barangay",
                            "Barangay Position",
                            "Created At",
                            "Updated At",
                            "Action"
                        ].map((item) => (
                            <th key={item} className="px-6 py-3 font-medium">
                            {item}
                            </th>
                        ))
                        }


                </tr>
                </thead>

                <tbody>
                {json.map((item, i) => (
                    <tr
                    key={i}
                    className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium"
                    >
                    <td className="w-4 p-4">
                        <input
                        type="checkbox"
                        className="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"
                        />
                    </td>
                    <td className="px-6 py-4">{item.id}</td>

                    <th className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                        {item.bcert_number}
                    </th>
                    <td className="px-6 py-4">{item.issuedDate}</td>
                    <td className="px-6 py-4">{item.prefix}</td>
                    <td className="px-6 py-4">{item.firstname}</td>
                    <td className="px-6 py-4">{item.middlename}</td>
                    <td className="px-6 py-4">{item.surname}</td>
                    <td className="px-6 py-4">{item.extension}</td>
                    <td className="px-6 py-4">{item.establishment}</td>
                    <td className="px-6 py-4">{item.purpose}</td>
                    <td className="px-6 py-4">{item.purposeDetails}</td>
                    <td className="px-6 py-4">{item.houseBlockLot}</td>
                    <td className="px-6 py-4">{item.street}</td>
                    <td className="px-6 py-4">{item.zone}</td>
                    <td className="px-6 py-4">{item.orNo}</td>
                    <td className="px-6 py-4">{item.remarks}</td>
                    <td className="px-6 py-4">{item.punongBarangay}</td>
                    <td className="px-6 py-4">{item.forThePunongBarangay}</td>
                    <td className="px-6 py-4">{item.barangayPosition}</td>
                    <td className="px-6 py-4">{item.created_at}</td>
                    <td className="px-6 py-4">{item.updated_at}</td>

                    

                    <td className="px-6 py-4 flex">
                        <button onClick={() => (updateSelect(item))} className="font-medium text-fg-brand hover:underline">
                        View
                        </button>
                        /
                        <button className="font-medium text-fg-brand hover:underline">
                        Edit
                        </button>
                        
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        </div>
    );
}