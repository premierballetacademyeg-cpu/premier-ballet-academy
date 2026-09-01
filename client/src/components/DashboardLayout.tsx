import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import StaffPinLogin from "./StaffPinLogin";
import {
  BadgeCheck,
  BellRing,
  FileText,
  CircleDollarSign,
  Gift,
  Link2,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PlusCircle,
  ScanLine,
  ShieldCheck,
  ChartNoAxesCombined,
  UsersRound,
  Waypoints,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";

const navigation = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: UsersRound, label: "Members & Families", path: "/members" },
  { icon: Link2, label: "Parent Updates", path: "/parent-updates" },
  { icon: PlusCircle, label: "New Registration", path: "/register" },
  { icon: Gift, label: "Offers & Pricing", path: "/offers" },
  { icon: CircleDollarSign, label: "Payments", path: "/payments" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: BellRing, label: "Notifications", path: "/notifications" },
  { icon: Waypoints, label: "Sync Centre", path: "/sync" },
  {
    icon: ShieldCheck,
    label: "Staff Access",
    path: "/staff-access",
    systemAdminOnly: true,
  },
  { icon: ChartNoAxesCombined, label: "Reports", path: "/reports" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: unread } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: Boolean(user?.role === "admin"),
    refetchInterval: 30_000,
  });

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return <StaffPinLogin />;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#fbf7f3] grid place-items-center px-6">
        <section className="w-full max-w-md rounded-[2rem] bg-white p-9 text-center shadow-[0_24px_70px_rgba(62,32,40,0.12)]">
          <p className="eyebrow">Restricted access</p>
          <h1 className="mt-3 font-serif text-3xl text-[#302126]">
            This workspace is for administrators
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#76666b]">
            Your account must have administrator access before viewing family
            records or completing Point of Sale actions.
          </p>
          <Button
            variant="outline"
            onClick={logout}
            className="mt-7 h-11 rounded-xl"
          >
            Sign out
          </Button>
        </section>
      </div>
    );
  }

  const currentLabel =
    navigation.find(item => item.path === location)?.label ?? "Premier Ballet";
  const isSystemAdmin =
    !("staffRole" in user) || user.staffRole === "system_admin";
  const visibleNavigation = navigation.filter(
    item => !item.systemAdminOnly || isSystemAdmin
  );
  return (
    <SidebarProvider defaultOpen className="min-h-svh overflow-x-hidden">
      <Sidebar
        collapsible="icon"
        className="shrink-0 border-0 bg-[#302126] text-[#fcf9f5]"
      >
        <SidebarHeader className="h-[90px] border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-[#171215] shadow-lg">
              <img
                src="/manus-storage/premier-ballet-header-logo_3c8a0926.png"
                alt="Premier Ballet Academy"
                className="h-full w-full object-contain p-1"
              />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="font-serif text-base leading-none">
                Premier Ballet
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#d6a792]">
                Staff workspace
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-5">
          <SidebarMenu className="gap-1.5">
            {visibleNavigation.map(item => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={location === item.path}
                  tooltip={item.label}
                  onClick={() => setLocation(item.path)}
                  className="h-11 rounded-xl text-[#f8eeea] hover:bg-white/10 hover:text-white data-[active=true]:bg-[#d6a792] data-[active=true]:text-[#302126]"
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarFallback className="bg-[#7c3f52] text-xs text-white">
                {user.name?.slice(0, 1).toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">
                {user.name ?? "Administrator"}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[#d6a792]">
                System administrator
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-[#d6a792] transition hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 overflow-x-hidden bg-[#fbf7f3]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#eaded9] bg-[#fbf7f3]/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="rounded-xl md:hidden" />
            <img
              src="/manus-storage/premier-ballet-header-logo_3c8a0926.png"
              alt="Premier Ballet Academy"
              className="h-9 w-9 rounded-xl bg-[#171215] object-contain p-1.5 shadow-sm"
            />
            <div>
              <p className="eyebrow hidden sm:block">Premier Ballet Academy</p>
              <h2 className="font-serif text-xl text-[#302126]">
                {currentLabel}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/notifications")}
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-[#eaded9] bg-white text-[#7c3f52] transition hover:bg-[#fcf4f0]"
            >
              <BellRing className="h-4 w-4" />
              {unread ? (
                <span className="absolute -left-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#7c3f52] px-1 text-[9px] text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#eaded9] bg-white px-3 py-1.5 text-xs font-medium text-[#6e5960]">
              <span className="h-2 w-2 rounded-full bg-[#76a28a]" />
              Central database protected
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-76px)] p-5 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
