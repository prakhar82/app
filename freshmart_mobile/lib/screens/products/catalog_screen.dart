import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/catalog_provider.dart';
import 'product_detail_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadProducts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CatalogProvider>(
      builder: (context, catalog, _) {
        final query = _searchController.text.trim().toLowerCase();
        final products = catalog.products.where((product) {
          if (query.isEmpty) {
            return true;
          }
          return product.name.toLowerCase().contains(query) ||
              product.category.toLowerCase().contains(query) ||
              product.sku.toLowerCase().contains(query);
        }).toList();

        return Scaffold(
          appBar: AppBar(title: const Text('Product catalog')),
          body: RefreshIndicator(
            onRefresh: catalog.loadProducts,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search products',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isEmpty
                        ? null
                        : IconButton(
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                            icon: const Icon(Icons.close),
                          ),
                    border: const OutlineInputBorder(),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 16),
                if (catalog.loading)
                  const Padding(
                    padding: EdgeInsets.only(top: 48),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (products.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 48),
                    child: Center(child: Text('No products found')),
                  )
                else
                  ...products.map(
                    (product) => Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFD1FAE5),
                          child: Text(product.name.isEmpty ? '?' : product.name[0].toUpperCase()),
                        ),
                        title: Text(product.name),
                        subtitle: Text('${product.category} - ${product.unit} - ${product.sku}'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('EUR ${product.price.toStringAsFixed(2)}'),
                            Text(
                              '${(product.averageRating ?? 0).toStringAsFixed(1)} / 5 (${product.reviewCount ?? 0})',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                        onTap: () => Navigator.pushNamed(
                          context,
                          ProductDetailScreen.routeName,
                          arguments: product.id,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
