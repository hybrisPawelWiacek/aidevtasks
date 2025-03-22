import React from "react";
import { UserMenu } from "./UserMenu";
import { User } from "@shared/schema";
import { Brain } from "lucide-react";

interface HeaderProps {
  user: User;
  onLogout: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">AI Dev Tasks</h1>
          </div>
          
          {/* User Menu */}
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};
