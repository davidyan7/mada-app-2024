import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import TrainingPage from './components/TrainingPage';
import ManagePage from './components/ManagePage';
import Navigation from './components/Navigation';

const AppLayout = ({ children }) => (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>

        <Navigation/>
        <div>
            <h1 className="page-h1">מסך התרעות ירי טילים (ארצי)</h1>
        </div>
        <div style={{flexGrow: 1, overflow: 'hidden'}}>
            {children}
        </div>
    </div>
);

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <AppLayout>
                <TrainingPage />
            </AppLayout>
        ),
    },
    {
        path: "/manage",
        element: (
            <AppLayout>
                <ManagePage />
            </AppLayout>
        ),
    },
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;