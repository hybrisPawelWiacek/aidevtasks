import React, { useState, useRef, useEffect } from "react";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, LogOut } from "lucide-react";

interface UserMenuProps {
  user: User;
  onLogout: () => Promise<void>;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleUserMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await onLogout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative flex justify-end" ref={menuRef}>
      <button 
        className="flex items-center gap-2" 
        onClick={toggleUserMenu}
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.username} />
          <AvatarFallback>
            {getInitials(user.displayName || user.username)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="font-medium text-sm">{user.displayName || user.username}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button 
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
