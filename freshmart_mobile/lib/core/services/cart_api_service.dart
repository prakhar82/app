import '../models/models.dart';
import 'api_client.dart';

class CartApiService {
  CartApiService(this._client);

  final ApiClient _client;

  Future<List<CartItem>> fetchCart(String email) async {
    final response = await _client.dio.get('/cart/cart/${Uri.encodeComponent(email)}');
    return (response.data as List).map((e) => CartItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> upsertItem({
    required String email,
    required Product product,
    required int quantity,
  }) async {
    await _client.dio.post('/cart/cart/items', data: {
      'userEmail': email,
      'sku': product.sku,
      'itemName': product.name,
      'quantity': quantity,
    });
  }

  Future<void> removeItem({required String email, required String sku}) async {
    await _client.dio.delete('/cart/cart/${Uri.encodeComponent(email)}/${Uri.encodeComponent(sku)}');
  }
}
