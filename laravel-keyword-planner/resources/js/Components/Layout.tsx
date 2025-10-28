import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export function Errors({ errors }: { errors: Record<string, string> }) {
    return (
        <div className="fixed top-4 right-4 rounded bg-red-500 p-4 text-white shadow-lg">
            {Object.values(errors).map((error, index) => (
                <div key={index}>{error}</div>
            ))}
        </div>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const { errors } = usePage().props;
    console.log(usePage().props)
    const [showErr, setShowErr] = useState(false);
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (Object.keys(errors ?? {}).length > 0) {
            setLocalErrors(errors);
            setShowErr(true);

            const timer = setTimeout(() => {
                setShowErr(false);
                setLocalErrors({});
            }, 3000); // через 3 секунды скрыть

            return () => clearTimeout(timer);
        }
    }, [errors]);

    return (
        <div className="rubik flex h-[calc(100vh-0rem)] min-h-screen flex-col overflow-hidden bg-white">
            <Header />
            {showErr && <Errors errors={localErrors} />}
            <div className="flex h-full w-screen overflow-hidden">
                <Sidebar />
                <div className="h-[calc(100vh-4rem)] w-full overflow-auto bg-white p-4">{children}</div>
            </div>
        </div>
    );
}
