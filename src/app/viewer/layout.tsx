// Viewer portal — standalone, no app nav
export default function ViewerLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen">{children}</div>;
}