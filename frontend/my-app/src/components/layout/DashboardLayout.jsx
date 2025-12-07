import Navigation from './Navigation';

const DashboardLayout = ({ children }) => {
  return (
    <div className="h-screen bg-black overflow-hidden">
      <div className="flex h-full">
        <div className="relative z-50 h-full">
          <Navigation />
        </div>
        <main className="flex-1 overflow-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;