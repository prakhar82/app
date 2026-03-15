import '../models/models.dart';
import 'api_client.dart';

class CatalogApiService {
  CatalogApiService(this._client);

  final ApiClient _client;

  Future<List<Product>> fetchProducts() async {
    final response = await _client.dio.get('/catalog/catalog/products');
    return (response.data as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ProductReview>> fetchReviews(int productId) async {
    final response = await _client.dio.get('/catalog/catalog/products/$productId/reviews');
    return (response.data as List).map((e) => ProductReview.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ProductReview?> fetchMyReview(int productId) async {
    try {
      final response = await _client.dio.get('/catalog/catalog/me/reviews/$productId');
      if (response.data == null || response.data == '') {
        return null;
      }
      return ProductReview.fromJson(response.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveReview({required int productId, required double rating, String? comment}) async {
    await _client.dio.post('/catalog/catalog/me/reviews/$productId', data: {
      'rating': rating,
      'comment': comment,
    });
  }
}
