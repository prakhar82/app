import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../models/models.dart';
import 'api_client.dart';

class AdminApiService {
  AdminApiService(this._client);

  final ApiClient _client;

  Future<List<OrderModel>> fetchAdminOrders() async {
    final response = await _client.dio.get('/orders/orders/admin/all');
    return (response.data as List).map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AdminSummary> fetchSummary() async {
    final response = await _client.dio.get('/orders/orders/admin/summary');
    return AdminSummary.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderModel> updateOrderStatus({
    required String orderRef,
    required String status,
    String? comment,
  }) async {
    final response = await _client.dio.patch(
      '/orders/orders/${Uri.encodeComponent(orderRef)}/status',
      data: {'status': status, if (comment != null && comment.isNotEmpty) 'comment': comment},
    );
    return OrderModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<InventoryItem>> fetchInventory() async {
    final response = await _client.dio.get('/inventory/inventory/items');
    return (response.data as List).map((e) => InventoryItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<InventoryItem> upsertInventory({
    required String sku,
    required String productName,
    required int quantityDelta,
    int? reorderThreshold,
  }) async {
    final response = await _client.dio.post('/inventory/inventory/admin/upsert', data: {
      'sku': sku,
      'productName': productName,
      'quantityDelta': quantityDelta,
      'reorderThreshold': reorderThreshold,
    });
    return InventoryItem.fromJson(response.data as Map<String, dynamic>);
  }

  Future<InventoryItem> adjustInventory({
    required String sku,
    required int quantityDelta,
    required String reason,
    int? reorderThreshold,
  }) async {
    final response = await _client.dio.post('/inventory/inventory/admin/adjust', data: {
      'sku': sku,
      'quantityDelta': quantityDelta,
      'reason': reason,
      'reorderThreshold': reorderThreshold,
    });
    return InventoryItem.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteInventoryItem(int id) async {
    await _client.dio.delete('/inventory/inventory/admin/items/$id');
  }

  Future<List<AdminUser>> fetchUsers() async {
    final response = await _client.dio.get('/identity/admin/users');
    return (response.data as List).map((e) => AdminUser.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AdminUser> createUser({
    required String email,
    required String password,
    required String role,
    String? name,
    String? phone,
  }) async {
    final response = await _client.dio.post('/identity/admin/users', data: {
      'email': email,
      'password': password,
      'role': role,
      'name': name,
      'phone': phone,
    });
    return AdminUser.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AdminUser> updateUser({
    required int id,
    String? name,
    String? phone,
    String? password,
    String? role,
    String? status,
  }) async {
    final response = await _client.dio.patch('/identity/admin/users/$id', data: {
      'name': name,
      'phone': phone,
      'password': password,
      'role': role,
      'status': status,
    });
    return AdminUser.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteUser(int id) async {
    await _client.dio.delete('/identity/admin/users/$id');
  }

  Future<List<Product>> fetchAdminProducts() async {
    final response = await _client.dio.get('/catalog/catalog/admin/products');
    return (response.data as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Product> createProduct({
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
    final response = await _client.dio.post('/catalog/catalog/admin/products', data: {
      'sku': sku,
      'name': name,
      'category': category,
      'subcategory': subcategory,
      'price': price,
      'taxPercent': taxPercent,
      'discountPercent': discountPercent,
      'unit': unit,
      'description': description,
      'imageUrl': imageUrl,
    });
    return Product.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Product> updateProduct({
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
    final response = await _client.dio.patch('/catalog/catalog/admin/products/$id', data: {
      'name': name,
      'category': category,
      'subcategory': subcategory,
      'price': price,
      'taxPercent': taxPercent,
      'discountPercent': discountPercent,
      'unit': unit,
      'description': description,
      'imageUrl': imageUrl,
    });
    return Product.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteProduct(int id) async {
    await _client.dio.delete('/catalog/catalog/admin/products/$id');
  }

  Future<void> uploadInventory(Uint8List bytes, String fileName) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    });
    await _client.dio.post('/catalog/catalog/admin/upload', data: formData);
  }

  Future<Uint8List> downloadBackup() async {
    final response = await _client.dio.get<List<int>>(
      '/identity/admin/tools/backup',
      options: Options(responseType: ResponseType.bytes),
    );
    return Uint8List.fromList(response.data ?? const []);
  }

  Future<void> restoreBackup(Uint8List bytes, String fileName) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    });
    await _client.dio.post('/identity/admin/tools/restore', data: formData);
  }

  Future<void> cleanupSystem() async {
    await _client.dio.post('/identity/admin/tools/cleanup', data: {});
  }

  Future<Uint8List> downloadReport(String kind, String format) async {
    final response = await _client.dio.get<List<int>>(
      '/identity/admin/tools/reports/$kind',
      queryParameters: {'format': format},
      options: Options(responseType: ResponseType.bytes),
    );
    return Uint8List.fromList(response.data ?? const []);
  }
}
