import { Map, MessageCircle, Bot, BarChart3, Shield, User, Globe, History } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useDisasterMode } from '@/context/DisasterModeContext';

export function AppSidebar() {
  const { isDisasterMode } = useDisasterMode();
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isAdmin = localStorage.getItem('admin_session') === 'true';

  const navItems = [
    { title: isDisasterMode ? 'Tactical Map' : 'Dashboard', url: '/dashboard', icon: isDisasterMode ? Globe : Map },
    { title: 'My Requests', url: '/my-requests', icon: History },
    { title: 'Chat', url: '/chat', icon: MessageCircle },
    { title: 'AI Assistant', url: '/assistant', icon: Bot },
    { title: 'Profile', url: '/profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ title: isDisasterMode ? 'Command Hub' : 'Admin', url: '/admin', icon: BarChart3 });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`p-4 ${collapsed ? 'px-2' : ''}`}>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-colors duration-500`}>
              <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-lg tracking-tight">Relief-Map</span>
            )}
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{t(`nav.${item.title.toLowerCase().replace(' ', '_')}`, item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
