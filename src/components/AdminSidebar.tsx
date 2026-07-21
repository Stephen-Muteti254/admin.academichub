import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  UserCheck,
  DollarSign,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  Sun,
  Moon,
  BarChart3,
  Shield,
  FileCheck
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Client Management", url: "/admin/clients", icon: Users },
  { title: "Writer Management", url: "/admin/writers", icon: UserCheck },
  { title: "Writer Applications", url: "/admin/applications", icon: FileCheck },
  { title: "Support Chats", url: "/admin/support", icon: MessageSquare },
  { title: "Payments", url: "/admin/payments/all", icon: DollarSign },
  { title: "System Notifications", url: "/admin/notifications", icon: Bell },
  // { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, setTheme } = useTheme();

  // Mock unread counts
  const pendingSupport = 8;
  const pendingWriters = 3;
  const pendingApplications = 5;

  const isActive = (path: string) => currentPath === path;

  const { logout } = useAuth();

  const { user } = useAuth();
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  // const getUnreadBadge = (count: number) => {
  //   if (count === 0) return null;
  //   const displayCount = count > 9 ? "9+" : count.toString();
  //   return (
  //     <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
  //       {displayCount}
  //     </span>
  //   );
  // };

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-border"
    >
      {/* Admin Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {open && (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {/*<div className="w-8 h-8 bg-gradient-to-br from-destructive to-destructive/80 rounded-lg flex items-center justify-center">
                <Shield className="text-destructive-foreground h-5 w-5" />
              </div>*/}
              <h1 className="font-bold text-lg text-foreground truncate">{user.full_name}</h1>
            </div>
          )}
        </div>
        
        {/* Desktop theme toggle and profile dropdown */}
        <div className="hidden lg:flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-destructive-foreground text-xs font-medium">{getInitials(user?.full_name)}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center space-x-2 p-2">
                <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                  <span className="text-destructive-foreground text-sm font-medium">{getInitials(user?.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">System Admin</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {/*<SidebarGroupLabel className="px-4 text-muted-foreground">
            Administration
          </SidebarGroupLabel>*/}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // const badge = item.title === "Support Chats" 
                //   ? getUnreadBadge(pendingSupport)
                //   : item.title === "Writer Management"
                //   ? getUnreadBadge(pendingWriters)
                //   : item.title === "Writer Applications"
                //   ? getUnreadBadge(pendingApplications)
                //   : null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink 
                        to={item.url}
                        className="flex items-center"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                        {/*{badge}*/}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Admin Info Footer */}
      <div className="border-t border-border p-4 mt-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Admin Access</p>
            <p className="text-xs text-muted-foreground">Full system control</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
