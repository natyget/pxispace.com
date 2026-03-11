import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import RouteListener from '../components/RouteListener';

export default function PublicLayout() {
    return (
        <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <RouteListener />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
