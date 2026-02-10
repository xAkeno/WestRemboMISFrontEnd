import { useState } from "react";
import 'flowbite';

export default function ProfileDropdown({ self }: { self: { url_photo: string, first_name: string, surname: string, email: string } | null }) {
  const [isOpen, setIsOpen] = useState(false);
    
  console.log("ProfileDropdown self:", self); // Debug log to check the value of self
  if (!self) {
    // User not logged in
    return (
      <a
        href="/"
        className="text-primary-foreground underline underline-offset-4 text-sm font-medium hover:text-gold transition-colors"
      >
        Sign In
      </a>
    );
  }

  // User logged in
  return (
    <div className="relative inline-block">
      {/* Avatar Button */}
      <div className="flex items-center" onClick={() => setIsOpen(!isOpen)}>
        <button
            
            className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-emerald-500 flex items-center justify-center focus:outline-none"
        >
            <img
            src={"http://127.0.0.1:8000/storage/" + self.url_photo}
            alt="Profile"
            className="rounded-full w-12 h-12"
            />
        </button>
        {
            !isOpen ? <h1 className="ml-1 text-sm font-medium text-gray-200 cursor-pointer">↓</h1> : <h1 className="ml-1 text-sm font-medium text-gray-200 cursor-pointer">↑</h1>
        }
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 z-10 bg-gray-200 border rounded-md rounded-base shadow-lg">
          <div className="p-2">
            <div className="flex items-center px-2.5 p-2 space-x-1.5 text-sm bg-neutral-secondary-strong rounded">
              <img
                className="w-8 h-8 rounded-full"
                src={"http://127.0.0.1:8000/storage/" + self.url_photo}
                alt="Avatar"
              />
              <div className="text-sm">
                <div className="font-medium text-heading">{self.first_name + " " + self.surname}</div>
                <div className="truncate text-body">{self.email}</div>
              </div>
            </div>
          </div>

          <ul className="px-2 pb-2 text-sm text-body font-medium">
            <li>
                <a href="/profile" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">
                <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
                Profile
                </a>
            </li>
            <li>
                <a href="#" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">
                <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M20 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6h-2m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4"/></svg>
                Settings
                </a>
            </li>
            <li>
                <a href="/dashboard" className="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-wrench-icon lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></svg>
                Admin panel
                </a>
            </li>
            <li className="flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded mb-1.5">
                <a href="#" className="inline-flex items-center">
                <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 0 1-.5-17.986V3c-.354.966-.5 1.911-.5 3a9 9 0 0 0 9 9c.239 0 .254.018.488 0A9.004 9.004 0 0 1 12 21Z"/></svg>
                Dark mode
                </a>
                <label className="inline-flex items-center cursor-pointer ms-auto bg-green-700 rounded-full p-1">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="relative w-9 h-5 bg-neutral-quaternary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft dark:peer-focus:ring-brand-soft rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    <span className="ms-3 text-sm font-medium text-heading sr-only">Toggle me</span>
                </label>
            </li>
            <li>
                <a href="/" className="inline-flex items-center w-full p-2 text-red-600 hover:bg-neutral-tertiary-medium rounded">
                <svg className="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/></svg>
                Sign out
                </a>
            </li>

          </ul>
        </div>
      )}
    </div>
  );
}
