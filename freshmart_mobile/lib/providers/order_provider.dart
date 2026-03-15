import 'package:flutter/foundation.dart';

import '../core/models/models.dart';
import '../core/services/order_api_service.dart';
import 'auth_provider.dart';

class OrderProvider extends ChangeNotifier {
  OrderProvider(this._orderApi, this._authProvider);

  final OrderApiService _orderApi;
  final AuthProvider _authProvider;

  List<OrderModel> _orders = [];
  bool _loading = false;

  List<OrderModel> get orders => _orders;
  bool get loading => _loading;

  Future<void> loadOrders() async {
    if (!_authProvider.isAuthenticated) {
      _orders = [];
      notifyListeners();
      return;
    }
    _loading = true;
    notifyListeners();
    try {
      _orders = await _orderApi.fetchOrders();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<CheckoutResponse> checkout({
    required String paymentMethod,
    required List<CartItem> items,
    required List<Product> products,
    required String addressMode,
    int? addressId,
    Map<String, dynamic>? newAddress,
  }) {
    return _orderApi.checkout(
      paymentMethod: paymentMethod,
      items: items,
      products: products,
      addressMode: addressMode,
      addressId: addressId,
      newAddress: newAddress,
    );
  }

  Future<CheckoutResponse> confirmPayment(String orderRef, String providerRef) => _orderApi.confirmPayment(orderRef: orderRef, providerRef: providerRef);
  Future<CheckoutResponse> cancelPayment(String orderRef) => _orderApi.cancelPayment(orderRef: orderRef);

  OrderModel? byRef(String orderRef) {
    for (final order in _orders) {
      if (order.orderRef == orderRef) {
        return order;
      }
    }
    return null;
  }
}
