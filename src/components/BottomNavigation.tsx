import React from 'react';
import { Home, Search, ChefHat, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'home' | 'search' | 'cooking' | 'favorites';

interface BottomNavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  favoritesCount?: number;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'search', label: 'Search', icon: <Search className="w-5 h-5" /> },
  { id: 'cooking', label: 'Cooking', icon: <ChefHat className="w-5 h-5" /> },
  { id: 'favorites', label: 'Favorites', icon: <Heart className="w-5 h-5" /> },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  onViewChange,
  favoritesCount = 0,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const showBadge = item.id === 'favorites' && favoritesCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-h-[44px] relative transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={cn(
                "relative transition-transform duration-200",
                isActive ? "scale-110" : "scale-100"
              )}>
                {item.icon}
                {showBadge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium mt-1 transition-all duration-200",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
