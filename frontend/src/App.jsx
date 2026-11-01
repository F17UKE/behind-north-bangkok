import { Routes, Route, Navigate } from "react-router-dom";

import RoleSelect from "./views/RoleSelect";

import CustomerLayout from "./layouts/CustomerLayout";
import CustomerHome from "./views/customer/Home";
import StorePage from "./views/customer/StorePage";
import CartPage from "./views/customer/CartPage";
import OrdersPage from "./views/customer/Orders";
import ChatPage from "./views/customer/Chat";
import ProfilePage from "./views/customer/Profile";

import MerchantLayout from "./layouts/MerchantLayout";
import MerchantDashboard from "./views/merchant/Dashboard";
import MerchantOrders from "./views/merchant/Orders";
import MerchantMenu from "./views/merchant/Menu";
import MerchantReports from "./views/merchant/Reports";
import MerchantChat from "./views/merchant/Chat";
import MerchantSettings from "./views/merchant/Settings";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./views/admin/Dashboard";
import AdminUsers from "./views/admin/Users";
import AdminStores from "./views/admin/Stores";
import AdminOrders from "./views/admin/Orders";
import AdminReports from "./views/admin/Reports";
import AdminPromotions from "./views/admin/Promotions";

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