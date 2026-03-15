import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/models.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/profile_provider.dart';
import '../payment/payment_webview_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _paymentMethod = 'COD';
  bool _useSavedAddress = true;
  int? _selectedAddressId;
  bool _busy = false;

  final _labelController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _postcodeController = TextEditingController();
  final _countryController = TextEditingController(text: 'NL');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final profile = context.read<ProfileProvider>();
      await profile.load();
      if (!mounted) {
        return;
      }
      setState(() => _selectedAddressId = profile.profile?.defaultAddressId ?? (profile.addresses.isNotEmpty ? profile.addresses.first.id : null));
    });
  }

  @override
  void dispose() {
    _labelController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _cityController.dispose();
    _postcodeController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final cart = context.read<CartProvider>();
    final catalog = context.read<CatalogProvider>();

    if (_useSavedAddress && _selectedAddressId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a delivery address')));
      return;
    }

    setState(() => _busy = true);
    try {
      final response = await context.read<OrderProvider>().checkout(
            paymentMethod: _paymentMethod,
            items: cart.items,
            products: catalog.products,
            addressMode: _useSavedAddress ? 'SAVED' : 'NEW',
            addressId: _useSavedAddress ? _selectedAddressId : null,
            newAddress: _useSavedAddress
                ? null
                : {
                    'label': _labelController.text.trim(),
                    'line1': _line1Controller.text.trim(),
                    'line2': _line2Controller.text.trim(),
                    'city': _cityController.text.trim(),
                    'postcode': _postcodeController.text.trim(),
                    'country': _countryController.text.trim(),
                  },
          );

      if (!mounted) {
        return;
      }

      if (response.redirectUrl != null && response.redirectUrl!.isNotEmpty) {
        await Navigator.pushNamed(
          context,
          PaymentWebViewScreen.routeName,
          arguments: PaymentWebViewArgs(
            orderRef: response.orderRef,
            redirectUrl: response.redirectUrl!,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order placed: ${response.orderRef}')),
        );
      }

      await cart.loadCart();
      await context.read<OrderProvider>().loadOrders();
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Checkout failed: $error')));
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ProfileProvider>(
      builder: (context, profile, _) {
        return Scaffold(
          appBar: AppBar(title: const Text('Checkout')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Payment method', style: Theme.of(context).textTheme.titleMedium),
                      RadioListTile<String>(
                        value: 'COD',
                        groupValue: _paymentMethod,
                        title: const Text('Cash on delivery'),
                        onChanged: (value) => setState(() => _paymentMethod = value!),
                      ),
                      RadioListTile<String>(
                        value: 'IDEAL',
                        groupValue: _paymentMethod,
                        title: const Text('iDEAL / Stripe Checkout'),
                        onChanged: (value) => setState(() => _paymentMethod = value!),
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
                      Text('Delivery address', style: Theme.of(context).textTheme.titleMedium),
                      SwitchListTile(
                        value: _useSavedAddress,
                        title: const Text('Use saved address'),
                        onChanged: (value) => setState(() => _useSavedAddress = value),
                      ),
                      if (_useSavedAddress)
                        ...profile.addresses.map(
                          (address) => RadioListTile<int>(
                            value: address.id ?? 0,
                            groupValue: _selectedAddressId,
                            title: Text(address.label ?? address.line1),
                            subtitle: Text('${address.line1}, ${address.city}, ${address.postcode}'),
                            onChanged: (value) => setState(() => _selectedAddressId = value),
                          ),
                        )
                      else ...[
                        TextField(controller: _labelController, decoration: const InputDecoration(labelText: 'Label')),
                        const SizedBox(height: 12),
                        TextField(controller: _line1Controller, decoration: const InputDecoration(labelText: 'Address line 1')),
                        const SizedBox(height: 12),
                        TextField(controller: _line2Controller, decoration: const InputDecoration(labelText: 'Address line 2')),
                        const SizedBox(height: 12),
                        TextField(controller: _cityController, decoration: const InputDecoration(labelText: 'City')),
                        const SizedBox(height: 12),
                        TextField(controller: _postcodeController, decoration: const InputDecoration(labelText: 'Postcode')),
                        const SizedBox(height: 12),
                        TextField(controller: _countryController, decoration: const InputDecoration(labelText: 'Country')),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _busy ? null : _placeOrder,
                child: _busy
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Place order'),
              ),
            ],
          ),
        );
      },
    );
  }
}
