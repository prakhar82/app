import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().loadCart();
      if (context.read<CatalogProvider>().products.isEmpty) {
        context.read<CatalogProvider>().loadProducts();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<CartProvider, CatalogProvider>(
      builder: (context, cart, catalog, _) {
        final productsBySku = {for (final product in catalog.products) product.sku: product};
        final subtotal = cart.subtotal(productsBySku);

        return Scaffold(
          appBar: AppBar(
            title: const Text('Cart'),
            actions: [
              IconButton(
                onPressed: () => context.read<AuthProvider>().logout(),
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          body: cart.loading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    Expanded(
                      child: cart.items.isEmpty
                          ? const Center(child: Text('Your cart is empty'))
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: cart.items.length,
                              itemBuilder: (context, index) {
                                final item = cart.items[index];
                                final product = productsBySku[item.sku];
                                return Card(
                                  child: ListTile(
                                    title: Text(item.itemName),
                                    subtitle: Text('Qty ${item.quantity} - EUR ${((product?.price ?? 0) * item.quantity).toStringAsFixed(2)}'),
                                    trailing: Wrap(
                                      spacing: 4,
                                      children: [
                                        IconButton(
                                          onPressed: item.quantity > 1 && product != null
                                              ? () => cart.addOrUpdate(product, item.quantity - 1)
                                              : null,
                                          icon: const Icon(Icons.remove_circle_outline),
                                        ),
                                        IconButton(
                                          onPressed: product != null
                                              ? () => cart.addOrUpdate(product, item.quantity + 1)
                                              : null,
                                          icon: const Icon(Icons.add_circle_outline),
                                        ),
                                        IconButton(
                                          onPressed: () => cart.remove(item.sku),
                                          icon: const Icon(Icons.delete_outline),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Subtotal: EUR ${subtotal.toStringAsFixed(2)}'),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: cart.items.isEmpty
                                  ? null
                                  : () => Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                                      ),
                              child: const Text('Checkout'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }
}
