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
  List<Product> products = [];
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
      try {
        products = await _adminApi.fetchAdminProducts();
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

  Future<void> refreshProducts() async {
    products = await _adminApi.fetchAdminProducts();
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

  Future<void> upsertInventory({
    required String sku,
    required String productName,
    required int quantityDelta,
    int? reorderThreshold,
  }) async {
    await _adminApi.upsertInventory(
      sku: sku,
      productName: productName,
      quantityDelta: quantityDelta,
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

  Future<void> createProduct({
    required String sku,
    required String name,
    required String category,
    required String subcategory,
    required double price,
    required double taxPercent,
    required double discountPercent,
    required String unit,
    String? description,
    String? imageUrl,
  }) async {
    await _adminApi.createProduct(
      sku: sku,
      name: name,
      category: category,
      subcategory: subcategory,
      price: price,
      taxPercent: taxPercent,
      discountPercent: discountPercent,
      unit: unit,
      description: description,
      imageUrl: imageUrl,
    );
    await refreshProducts();
  }

  Future<void> updateProduct({
    required int id,
    required String name,
    required String category,
    required String subcategory,
    required double price,
    required double taxPercent,
    required double discountPercent,
    required String unit,
    String? description,
    String? imageUrl,
  }) async {
    await _adminApi.updateProduct(
      id: id,
      name: name,
      category: category,
      subcategory: subcategory,
      price: price,
      taxPercent: taxPercent,
      discountPercent: discountPercent,
      unit: unit,
      description: description,
      imageUrl: imageUrl,
    );
    await refreshProducts();
  }

  Future<void> deleteProduct(int id) async {
    await _adminApi.deleteProduct(id);
    await refreshProducts();
  }
}
