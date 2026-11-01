import { Routes, Route, Navigate } from "react-router-dom";

import RoleSelect from "./pages/RoleSelect";

import CustomerLayout from "./layouts/CustomerLayout";
import CustomerHome from "./pages/customer/Home";
import StorePage from "./pages/customer/StorePage";
import CartPage from "./pages/customer/CartPage";
import OrdersPage from "./pages/customer/Orders";
import ChatPage from "./pages/customer/Chat";
import ProfilePage from "./pages/customer/Profile";

import MerchantLayout from "./layouts/MerchantLayout";
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantOrders from "./pages/merchant/Orders";
import MerchantMenu from "./pages/merchant/Menu";
import MerchantReports from "./pages/merchant/Reports";
import MerchantChat from "./pages/merchant/Chat";
import MerchantSettings from "./pages/merchant/Settings";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminStores from "./pages/admin/Stores";
import AdminOrders from "./pages/admin/Orders";
import AdminReports from "./pages/admin/Reports";
import AdminPromotions from "./pages/admin/Promotions";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />

      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<CustomerHome />} />
        <Route path="store/:storeId" element={<StorePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/merchant" element={<MerchantLayout />}>
        <Route index element={<MerchantDashboard />} />
        <Route path="orders" element={<MerchantOrders />} />
        <Route path="menu" element={<MerchantMenu />} />
        <Route path="reports" element={<MerchantReports />} />
        <Route path="chat" element={<MerchantChat />} />
        <Route path="settings" element={<MerchantSettings />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="stores" element={<AdminStores />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="promotions" element={<AdminPromotions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}