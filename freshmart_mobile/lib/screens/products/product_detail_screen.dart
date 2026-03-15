import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/models.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  static const routeName = '/product';

  final int productId;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _commentController = TextEditingController();

  int _quantity = 1;
  double _rating = 5;
  bool _savingReview = false;
  List<ProductReview> _reviews = [];
  ProductReview? _myReview;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadReviews());
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadReviews() async {
    final catalog = context.read<CatalogProvider>();
    final reviews = await catalog.loadReviews(widget.productId);
    final myReview = await catalog.loadMyReview(widget.productId);
    if (!mounted) {
      return;
    }
    setState(() {
      _reviews = reviews;
      _myReview = myReview;
      _rating = myReview?.rating ?? 5;
      _commentController.text = myReview?.comment ?? '';
    });
  }

  Future<void> _saveReview() async {
    setState(() => _savingReview = true);
    try {
      await context.read<CatalogProvider>().saveReview(
            productId: widget.productId,
            rating: _rating,
            comment: _commentController.text.trim().isEmpty ? null : _commentController.text.trim(),
          );
      await _loadReviews();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review saved')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save review: $error')));
    } finally {
      if (mounted) {
        setState(() => _savingReview = false);
      }
    }
  }

  Future<void> _addToCart(Product product) async {
    try {
      await context.read<CartProvider>().addOrUpdate(product, _quantity);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to cart')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Add to cart failed: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = context.watch<CatalogProvider>().byId(widget.productId);
    if (product == null) {
      return const Scaffold(body: Center(child: Text('Product not found')));
    }

    return Scaffold(
      appBar: AppBar(title: Text(product.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text('${product.category} - ${product.subcategory}'),
                  const SizedBox(height: 8),
                  Text('EUR ${product.price.toStringAsFixed(2)} / ${product.unit}'),
                  const SizedBox(height: 8),
                  Text(product.description ?? 'No description'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text('Quantity'),
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('$_quantity'),
                      IconButton(
                        onPressed: () => setState(() => _quantity++),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                      const Spacer(),
                      FilledButton(
                        onPressed: () => _addToCart(product),
                        child: const Text('Add to cart'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Your review', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: List.generate(10, (index) {
                      final value = (index + 1) / 2;
                      return ChoiceChip(
                        selected: _rating == value,
                        label: Text('${value.toStringAsFixed(1)} / 5'),
                        onSelected: (_) => setState(() => _rating = value),
                      );
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _commentController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Comment',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _savingReview ? null : _saveReview,
                    child: _savingReview
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(_myReview == null ? 'Submit review' : 'Update review'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Customer reviews', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          if (_reviews.isEmpty)
            const Card(child: Padding(padding: EdgeInsets.all(16), child: Text('No reviews yet')))
          else
            ..._reviews.map(
              (review) => Card(
                child: ListTile(
                  title: Text(review.userDisplayName),
                  subtitle: Text(review.comment ?? 'No comment'),
                  trailing: Text('${review.rating.toStringAsFixed(1)} / 5'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
