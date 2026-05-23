import { createHashRouter, RouterProvider } from 'react-router-dom';
import Analytics from "./pages/Analytics";
import Layout from './components/Layout';
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import TimerProfiles from "./pages/TimerProfiles";
import BlockLists from "./pages/BlockLists";
import StrictModeSettings from "./pages/StrictModeSettings";
import TimerProfileLayout, { loader as TimerProfileLoader } from './components/TimerProfileLayout';
import TimerProfileDetail from './pages/TimerProfileDetail';
import TimerProfileEdit, { action as editProfileAction } from './pages/TimerProfileEdit';
import TimerProfileCreate, { action as createProfileAction } from './pages/TimerProfileCreate';
import { deleteProfileAction, toggleProfileAction } from './actions/profiles';
import "@fontsource/inter/400.css";
import "@fontsource/montserrat/400.css";
import './App.css'

export default function App() {
  const router = createHashRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Analytics />,
        },
        {
          path: "block-lists",
          element: <BlockLists />,
        },
        {
          path: "pricing",
          element: <Pricing />,
        },
        {
          path: "account",
          element: <Account />,
        },
        {
          path: "strict-mode-settings",
          element: <StrictModeSettings />,
        },
        {
          path: "profiles",
          children: [
            {
              index: true,
              element: <TimerProfiles />
            },
            {
              path: 'create',
              action: createProfileAction,
              element: <TimerProfileCreate />
            }
          ]
        },
        {
          path: "profile/:profileId",
          id: 'timer-profile',
          loader: TimerProfileLoader,
          element: <TimerProfileLayout />,
          // shouldRevalidate: ({ currentUrl, defaultShouldRevalidate }) => { 
          //   const isEditingOrDeleting = currentUrl.pathname.includes('profile');
          //   if(isEditingOrDeleting) return true;
          //   return defaultShouldRevalidate
          // },
          children: [
            {
              index: true,
              // loader: TimerProfileLoader,
              element: <TimerProfileDetail />
            },
            {
              path: 'edit',
              // loader: TimerProfileLoader,
              element: <TimerProfileEdit />,
              action: editProfileAction
            },
            {
              path: 'toggle',
              action: toggleProfileAction
            },
            {
              path: 'delete',
              action: deleteProfileAction
            },
          ]
        },
      ]
    }
  ])

  return (
    <RouterProvider router={router} />
  );
}
