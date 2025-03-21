import React from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { TasksContainer } from "@/components/task/TasksContainer";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // If no user, the AuthContext will show the auth modal
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header user={user} onLogout={logout} />
      <main className="flex-grow overflow-hidden flex flex-col">
        <TasksContainer userId={user.id} />
      </main>
    </div>
  );
};

export default Dashboard;
