import 'package:flutter/foundation.dart';

import '../core/models/models.dart';
import '../core/services/catalog_api_service.dart';

class CatalogProvider extends ChangeNotifier {
  CatalogProvider(this._catalogApi);

  final CatalogApiService _catalogApi;

  List<Product> _products = [];
  bool _loading = false;

  List<Product> get products => _products;
  bool get loading => _loading;

  Future<void> loadProducts() async {
    _loading = true;
    notifyListeners();
    try {
      _products = await _catalogApi.fetchProducts();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Product? byId(int id) {
    for (final product in _products) {
      if (product.id == id) {
        return product;
      }
    }
    return null;
  }

  Future<List<ProductReview>> loadReviews(int productId) => _catalogApi.fetchReviews(productId);
  Future<ProductReview?> loadMyReview(int productId) => _catalogApi.fetchMyReview(productId);

  Future<void> saveReview({required int productId, required double rating, String? comment}) async {
    await _catalogApi.saveReview(productId: productId, rating: rating, comment: comment);
    _products = await _catalogApi.fetchProducts();
    notifyListeners();
  }
}
