import '../models/models.dart';
import 'api_client.dart';

class OrderApiService {
  OrderApiService(this._client);

  final ApiClient _client;

  Future<List<OrderModel>> fetchOrders() async {
    final response = await _client.dio.get('/orders/orders/me');
    return (response.data as List).map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CheckoutResponse> checkout({
    required String paymentMethod,
    required List<CartItem> items,
    required List<Product> products,
    required String addressMode,
    int? addressId,
    Map<String, dynamic>? newAddress,
  }) async {
    final productBySku = {for (final product in products) product.sku: product};
    final payload = {
      'paymentMethod': paymentMethod,
      'items': items.map((item) {
        final product = productBySku[item.sku];
        return {
          'sku': item.sku,
          'name': item.itemName,
          'qty': item.quantity,
          'unitPrice': product?.price ?? 0,
        };
      }).toList(),
      'addressMode': addressMode,
      if (addressId != null) 'addressId': addressId,
      if (newAddress != null) 'newAddress': newAddress,
      if (newAddress != null) 'saveAddress': true,
    };
    final response = await _client.dio.post('/orders/orders/checkout', data: payload);
    return CheckoutResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CheckoutResponse> confirmPayment({required String orderRef, required String providerRef}) async {
    final response = await _client.dio.post('/orders/orders/${Uri.encodeComponent(orderRef)}/confirm-payment', queryParameters: {
      'providerRef': providerRef,
    });
    return CheckoutResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<CheckoutResponse> cancelPayment({required String orderRef}) async {
    final response = await _client.dio.post('/orders/orders/${Uri.encodeComponent(orderRef)}/cancel-payment');
    return CheckoutResponse.fromJson(response.data as Map<String, dynamic>);
  }
}
