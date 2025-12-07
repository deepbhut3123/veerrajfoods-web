import NotFound from "./Components/NotFound";
import SalesPage from "./Pages/Sale/Index";
import Dashboard from "./DesignLayout/Dashboard";

const AdminRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/sales",
    name: "Sales",
    component: SalesPage,
  },

  { path: "*", name: 'Not Found', component: NotFound },
  ];

export { AdminRoutes };