import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            {/* Welcome */}
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
                <h1 className="text-4xl font-bold text-gray-800">Welcome to the Application</h1>
                <p className="mt-4 text-lg text-gray-600">This is a simple welcome page.</p>
                <p className="mt-2 text-sm text-gray-500">Feel free to explore the application.</p>
                <p className="mt-2 text-sm text-gray-500">Current time: {new Date().toLocaleTimeString()}</p>
            </div>
        </>
    );
}
