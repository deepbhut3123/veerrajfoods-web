import NotFound from "./Components/NotFound";
import SalesPage from "./Pages/Sale/Index";

const AdminRoutes = [
  {
    path: "/sales",
    name: "Sales",
    component: SalesPage,
  },

  { path: "*", name: 'Not Found', component: NotFound },
  ];

export { AdminRoutes };