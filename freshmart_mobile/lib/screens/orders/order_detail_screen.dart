import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/order_provider.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderRef});

  static const routeName = '/order-detail';

  final String orderRef;

  @override
  Widget build(BuildContext context) {
    final order = context.watch<OrderProvider>().byRef(orderRef);

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order details')),
        body: const Center(child: Text('Order not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(order.orderRef)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Status: ${order.status}'),
                  const SizedBox(height: 8),
                  Text('Payment method: ${order.paymentMethod}'),
                  const SizedBox(height: 8),
                  Text('Phone: ${order.userPhone ?? 'No phone'}'),
                  const SizedBox(height: 8),
                  Text('Created: ${order.createdAt.toLocal()}'),
                  const SizedBox(height: 8),
                  Text('Total: EUR ${order.totalAmount.toStringAsFixed(2)}'),
                  if (order.rejectionComment != null && order.rejectionComment!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text('Rejection reason: ${order.rejectionComment}'),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Items', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          ...order.items.map(
            (item) => Card(
              child: ListTile(
                title: Text(item.itemName),
                subtitle: Text('SKU ${item.sku} - Qty ${item.quantity}'),
                trailing: Text('EUR ${(item.unitPrice * item.quantity).toStringAsFixed(2)}'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
