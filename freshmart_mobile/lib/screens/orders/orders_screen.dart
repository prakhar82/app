import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/order_provider.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OrderProvider>(
      builder: (context, orders, _) {
        return Scaffold(
          appBar: AppBar(title: const Text('Orders')),
          body: RefreshIndicator(
            onRefresh: orders.loadOrders,
            child: orders.loading
                ? const Center(child: CircularProgressIndicator())
                : orders.orders.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 120),
                          Center(child: Text('No orders found')),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: orders.orders.length,
                        itemBuilder: (context, index) {
                          final order = orders.orders[index];
                          return Card(
                            child: ListTile(
                              title: Text(order.orderRef),
                              subtitle: Text('${order.status} - ${order.paymentMethod}\n${order.createdAt.toLocal()}'),
                              isThreeLine: true,
                              trailing: Text('EUR ${order.totalAmount.toStringAsFixed(2)}'),
                              onTap: () => Navigator.pushNamed(
                                context,
                                OrderDetailScreen.routeName,
                                arguments: order.orderRef,
                              ),
                            ),
                          );
                        },
                      ),
          ),
        );
      },
    );
  }
}
