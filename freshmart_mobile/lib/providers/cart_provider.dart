import 'package:flutter/foundation.dart';

import '../core/models/models.dart';
import '../core/services/cart_api_service.dart';
import 'auth_provider.dart';

class CartProvider extends ChangeNotifier {
  CartProvider(this._cartApi, this._authProvider);

  final CartApiService _cartApi;
  final AuthProvider _authProvider;

  List<CartItem> _items = [];
  bool _loading = false;

  List<CartItem> get items => _items;
  bool get loading => _loading;

  Future<void> loadCart() async {
    final email = _authProvider.email;
    if (email == null) {
      _items = [];
      notifyListeners();
      return;
    }
    _loading = true;
    notifyListeners();
    try {
      _items = await _cartApi.fetchCart(email);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> addOrUpdate(Product product, int quantity) async {
    final email = _authProvider.email;
    if (email == null) {
      return;
    }
    await _cartApi.upsertItem(email: email, product: product, quantity: quantity);
    await loadCart();
  }

  Future<void> remove(String sku) async {
    final email = _authProvider.email;
    if (email == null) {
      return;
    }
    await _cartApi.removeItem(email: email, sku: sku);
    await loadCart();
  }

  double subtotal(Map<String, Product> productsBySku) {
    return _items.fold(0, (sum, item) {
      final product = productsBySku[item.sku];
      return sum + ((product?.price ?? 0) * item.quantity);
    });
  }
}
