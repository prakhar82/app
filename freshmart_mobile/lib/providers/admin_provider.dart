import 'package:flutter/foundation.dart';

import '../core/models/models.dart';
import '../core/services/admin_api_service.dart';

class AdminProvider extends ChangeNotifier {
  AdminProvider(this._adminApi);

  final AdminApiService _adminApi;

  AdminSummary? summary;
  List<OrderModel> orders = [];
  List<InventoryItem> inventory = [];
  List<AdminUser> users = [];
  bool loading = false;
  String? error;

  Future<void> loadDashboard() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      try {
        summary = await _adminApi.fetchSummary();
      } catch (_) {}
      try {
        orders = await _adminApi.fetchAdminOrders();
      } catch (_) {}
      try {
        inventory = await _adminApi.fetchInventory();
      } catch (_) {}
      try {
        users = await _adminApi.fetchUsers();
      } catch (_) {}
    } catch (err) {
      error = err.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> refreshOrders() async {
    orders = await _adminApi.fetchAdminOrders();
    summary = await _adminApi.fetchSummary();
    notifyListeners();
  }

  Future<void> refreshInventory() async {
    inventory = await _adminApi.fetchInventory();
    notifyListeners();
  }

  Future<void> refreshUsers() async {
    users = await _adminApi.fetchUsers();
    notifyListeners();
  }

  Future<void> updateOrderStatus({
    required String orderRef,
    required String status,
    String? comment,
  }) async {
    await _adminApi.updateOrderStatus(orderRef: orderRef, status: status, comment: comment);
    await refreshOrders();
  }

  Future<void> adjustInventory({
    required String sku,
    required int quantityDelta,
    required String reason,
    int? reorderThreshold,
  }) async {
    await _adminApi.adjustInventory(
      sku: sku,
      quantityDelta: quantityDelta,
      reason: reason,
      reorderThreshold: reorderThreshold,
    );
    await refreshInventory();
  }

  Future<void> deleteInventoryItem(int id) async {
    await _adminApi.deleteInventoryItem(id);
    await refreshInventory();
  }

  Future<void> createUser({
    required String email,
    required String password,
    required String role,
    String? name,
    String? phone,
  }) async {
    await _adminApi.createUser(email: email, password: password, role: role, name: name, phone: phone);
    await refreshUsers();
  }

  Future<void> updateUser({
    required int id,
    String? name,
    String? phone,
    String? password,
    String? role,
    String? status,
  }) async {
    await _adminApi.updateUser(id: id, name: name, phone: phone, password: password, role: role, status: status);
    await refreshUsers();
  }

  Future<void> deleteUser(int id) async {
    await _adminApi.deleteUser(id);
    await refreshUsers();
  }
}
