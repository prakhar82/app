import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/models.dart';
import '../../core/services/admin_api_service.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auth_provider.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _index = 0;
  final _rejectionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().loadDashboard();
    });
  }

  @override
  void dispose() {
    _rejectionController.dispose();
    super.dispose();
  }

  List<OrderModel> _activeOrders(List<OrderModel> orders) => orders.where((order) {
        final status = order.status.toUpperCase();
        return {
          'PENDING',
          'COD_PENDING',
          'PENDING_PAYMENT',
          'CONFIRMED',
          'FULFILLING',
          'SHIPPED',
        }.contains(status);
      }).toList();

  List<OrderModel> _rejectedOrders(List<OrderModel> orders) => orders.where((order) => order.status.toUpperCase() == 'REJECTED').toList();

  List<OrderModel> _historyOrders(List<OrderModel> orders) => orders.where((order) {
        final status = order.status.toUpperCase();
        return {
          'DELIVERED',
          'CANCELED',
          'PAYMENT_CANCELLED',
          'PAYMENT_FAILED',
        }.contains(status);
      }).toList();

  String _normalizeStatus(String status) {
    const allowed = {'PAYMENT_PENDING', 'CONFIRMED', 'COD_PENDING', 'REJECTED'};
    final normalized = status.trim().toUpperCase();
    if (allowed.contains(normalized)) {
      return normalized;
    }
    if (normalized == 'PENDING_PAYMENT') {
      return 'PAYMENT_PENDING';
    }
    if (normalized == 'CASH_ON_DELIVERY') {
      return 'COD_PENDING';
    }
    if (normalized == 'DELIVERED') {
      return 'CONFIRMED';
    }
    return 'PAYMENT_PENDING';
  }

  Future<void> _saveBytes(List<int> bytes, String suggestedName) async {
    final path = await FilePicker.platform.saveFile(fileName: suggestedName);
    if (path == null) {
      return;
    }
    await File(path).writeAsBytes(bytes, flush: true);
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved $suggestedName')));
  }

  Future<void> _pickAndUploadInventory() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['xlsx', 'xls'], withData: true);
    if (result == null || result.files.isEmpty || result.files.single.bytes == null) {
      return;
    }
    try {
      await context.read<AdminApiService>().uploadInventory(result.files.single.bytes!, result.files.single.name);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inventory upload completed')));
      await context.read<AdminProvider>().refreshProducts();
      await context.read<AdminProvider>().refreshInventory();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $error')));
    }
  }

  Future<void> _downloadBackup() async {
    try {
      final bytes = await context.read<AdminApiService>().downloadBackup();
      await _saveBytes(bytes, 'backup.zip');
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Backup download failed: $error')));
    }
  }

  Future<void> _restoreBackup() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['zip'], withData: true);
    if (result == null || result.files.isEmpty || result.files.single.bytes == null) {
      return;
    }
    try {
      await context.read<AdminApiService>().restoreBackup(result.files.single.bytes!, result.files.single.name);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Backup restored')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Restore failed: $error')));
    }
  }

  Future<void> _downloadReport(String kind, String format) async {
    try {
      final bytes = await context.read<AdminApiService>().downloadReport(kind, format);
      await _saveBytes(bytes, '$kind.$format');
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Report download failed: $error')));
    }
  }

  Future<void> _cleanupSystem() async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Clean system'),
            content: const Text('Delete app data and keep only admin users? Download a backup first.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Clean')),
            ],
          ),
        ) ??
        false;
    if (!confirmed) {
      return;
    }
    try {
      await context.read<AdminApiService>().cleanupSystem();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('System cleaned')));
      await context.read<AdminProvider>().loadDashboard();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Cleanup failed: $error')));
    }
  }

  Future<void> _changeOrderStatus(String orderRef, String currentStatus) async {
    String status = _normalizeStatus(currentStatus);
    _rejectionController.clear();
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
              title: Text('Update $orderRef'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: status,
                    items: const [
                      DropdownMenuItem(value: 'PAYMENT_PENDING', child: Text('Payment Pending')),
                      DropdownMenuItem(value: 'CONFIRMED', child: Text('Payment Confirmed')),
                      DropdownMenuItem(value: 'COD_PENDING', child: Text('Cash on Delivery')),
                      DropdownMenuItem(value: 'REJECTED', child: Text('Rejected')),
                    ],
                    onChanged: (value) => setDialogState(() => status = value ?? status),
                  ),
                  if (status == 'REJECTED') ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _rejectionController,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Rejection comment', border: OutlineInputBorder()),
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
              ],
            ),
          ),
        ) ??
        false;
    if (!confirmed) {
      return;
    }
    try {
      await context.read<AdminProvider>().updateOrderStatus(
            orderRef: orderRef,
            status: status,
            comment: status == 'REJECTED' ? _rejectionController.text.trim() : null,
          );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order update failed: $error')));
    }
  }

  Future<void> _editInventory([InventoryItem? item]) async {
    final availableProducts = context.read<AdminProvider>().products;
    String selectedSku = item?.sku ?? (availableProducts.isNotEmpty ? availableProducts.first.sku : '');
    String productName = item?.productName ?? (availableProducts.isNotEmpty ? availableProducts.first.name : '');
    final qtyController = TextEditingController(text: item == null ? '0' : item.availableQty.toString());
    final thresholdController = TextEditingController(text: item?.reorderThreshold.toString() ?? '0');

    final save = await showDialog<bool>(
          context: context,
          builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
              title: Text(item == null ? 'Add inventory' : 'Edit inventory'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      value: selectedSku.isEmpty ? null : selectedSku,
                      items: availableProducts
                          .map((product) => DropdownMenuItem(
                                value: product.sku,
                                child: Text('${product.name} (${product.category} / ${product.subcategory})'),
                              ))
                          .toList(),
                      onChanged: item == null
                          ? (value) {
                              Product? selectedProduct;
                              for (final product in availableProducts) {
                                if (product.sku == value) {
                                  selectedProduct = product;
                                  break;
                                }
                              }
                              setDialogState(() {
                                selectedSku = value ?? '';
                                productName = selectedProduct?.name ?? '';
                              });
                            }
                          : null,
                      decoration: const InputDecoration(labelText: 'Product'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: TextEditingController(text: _productBySkuStatic(availableProducts, selectedSku)?.category ?? 'Unknown'),
                      decoration: const InputDecoration(labelText: 'Category'),
                      readOnly: true,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: TextEditingController(text: _productBySkuStatic(availableProducts, selectedSku)?.subcategory ?? 'General'),
                      decoration: const InputDecoration(labelText: 'Subcategory'),
                      readOnly: true,
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: qtyController, decoration: const InputDecoration(labelText: 'Quantity delta'), keyboardType: TextInputType.number),
                    const SizedBox(height: 12),
                    TextField(controller: thresholdController, decoration: const InputDecoration(labelText: 'Threshold'), keyboardType: TextInputType.number),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
              ],
            ),
          ),
        ) ??
        false;
    if (!save) {
      return;
    }
    try {
      await context.read<AdminProvider>().upsertInventory(
            sku: selectedSku.trim(),
            productName: productName.trim(),
            quantityDelta: int.tryParse(qtyController.text.trim()) ?? 0,
            reorderThreshold: int.tryParse(thresholdController.text.trim()),
          );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Inventory save failed: $error')));
    }
  }

  Future<void> _editUser([AdminUser? user]) async {
    final emailController = TextEditingController(text: user?.email ?? '');
    final nameController = TextEditingController(text: user?.name ?? '');
    final phoneController = TextEditingController(text: user?.phone ?? '');
    final passwordController = TextEditingController();
    String role = user?.role ?? 'USER';
    String status = user?.status ?? 'ACTIVE';

    final save = await showDialog<bool>(
          context: context,
          builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
              title: Text(user == null ? 'Add user' : 'Edit user'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (user == null) TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email')),
                    TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
                    TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Phone')),
                    TextField(controller: passwordController, decoration: const InputDecoration(labelText: 'Password')),
                    DropdownButtonFormField<String>(
                      value: role,
                      items: const [
                        DropdownMenuItem(value: 'USER', child: Text('USER')),
                        DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
                      ],
                      onChanged: (value) => setDialogState(() => role = value ?? role),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: status,
                      items: const [
                        DropdownMenuItem(value: 'ACTIVE', child: Text('ACTIVE')),
                        DropdownMenuItem(value: 'INACTIVE', child: Text('INACTIVE')),
                      ],
                      onChanged: (value) => setDialogState(() => status = value ?? status),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
              ],
            ),
          ),
        ) ??
        false;
    if (!save) {
      return;
    }
    try {
      if (user == null) {
        await context.read<AdminProvider>().createUser(
              email: emailController.text.trim(),
              password: passwordController.text,
              role: role,
              name: nameController.text.trim(),
              phone: phoneController.text.trim(),
            );
      } else {
        await context.read<AdminProvider>().updateUser(
              id: user.id,
              name: nameController.text.trim(),
              phone: phoneController.text.trim(),
              password: passwordController.text.trim().isEmpty ? null : passwordController.text.trim(),
              role: role,
              status: status,
            );
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('User save failed: $error')));
    }
  }

  Future<void> _editProduct([Product? product]) async {
    final nameController = TextEditingController(text: product?.name ?? '');
    final skuController = TextEditingController(text: product?.sku ?? '');
    final priceController = TextEditingController(text: product?.price.toString() ?? '0');
    final taxController = TextEditingController(text: (product?.taxPercent ?? 0).toString());
    final discountController = TextEditingController(text: (product?.discountPercent ?? 0).toString());
    final unitController = TextEditingController(text: product?.unit ?? '');
    final descriptionController = TextEditingController(text: product?.description ?? '');
    final imageController = TextEditingController(text: product?.imageUrl ?? '');
    String selectedCategory = product?.category ?? '';
    String selectedSubcategory = product?.subcategory ?? '';

    final save = await showDialog<bool>(
          context: context,
          builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
              title: Text(product == null ? 'Add product' : 'Edit product'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (product == null) TextField(controller: skuController, decoration: const InputDecoration(labelText: 'SKU')),
                    TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
                    DropdownButtonFormField<String>(
                      value: selectedCategory.isEmpty ? null : selectedCategory,
                      items: _categoryOptions(context.read<AdminProvider>().products, current: selectedCategory)
                          .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                          .toList(),
                      onChanged: (value) => setDialogState(() {
                        selectedCategory = value ?? '';
                        final subcategories = _subcategoryOptions(context.read<AdminProvider>().products, selectedCategory, current: selectedSubcategory);
                        if (!subcategories.contains(selectedSubcategory)) {
                          selectedSubcategory = '';
                        }
                      }),
                      decoration: const InputDecoration(labelText: 'Category'),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: selectedSubcategory.isEmpty ? null : selectedSubcategory,
                      items: _subcategoryOptions(context.read<AdminProvider>().products, selectedCategory, current: selectedSubcategory)
                          .map((subcategory) => DropdownMenuItem(value: subcategory, child: Text(subcategory)))
                          .toList(),
                      onChanged: (value) => setDialogState(() => selectedSubcategory = value ?? ''),
                      decoration: const InputDecoration(labelText: 'Subcategory'),
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: priceController, decoration: const InputDecoration(labelText: 'Price'), keyboardType: TextInputType.number),
                    const SizedBox(height: 12),
                    TextField(controller: taxController, decoration: const InputDecoration(labelText: 'Tax %'), keyboardType: TextInputType.number),
                    const SizedBox(height: 12),
                    TextField(controller: discountController, decoration: const InputDecoration(labelText: 'Discount %'), keyboardType: TextInputType.number),
                    const SizedBox(height: 12),
                    TextField(controller: unitController, decoration: const InputDecoration(labelText: 'Unit')),
                    const SizedBox(height: 12),
                    TextField(controller: imageController, decoration: const InputDecoration(labelText: 'Image URL')),
                    const SizedBox(height: 12),
                    TextField(controller: descriptionController, decoration: const InputDecoration(labelText: 'Description')),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
              ],
            ),
          ),
        ) ??
        false;
    if (!save) {
      return;
    }
    try {
      if (product == null) {
        await context.read<AdminProvider>().createProduct(
              sku: skuController.text.trim(),
              name: nameController.text.trim(),
              category: selectedCategory.trim(),
              subcategory: selectedSubcategory.trim(),
              price: double.tryParse(priceController.text.trim()) ?? 0,
              taxPercent: double.tryParse(taxController.text.trim()) ?? 0,
              discountPercent: double.tryParse(discountController.text.trim()) ?? 0,
              unit: unitController.text.trim(),
              description: descriptionController.text.trim(),
              imageUrl: imageController.text.trim(),
            );
      } else {
        await context.read<AdminProvider>().updateProduct(
              id: product.id,
              name: nameController.text.trim(),
              category: selectedCategory.trim(),
              subcategory: selectedSubcategory.trim(),
              price: double.tryParse(priceController.text.trim()) ?? 0,
              taxPercent: double.tryParse(taxController.text.trim()) ?? 0,
              discountPercent: double.tryParse(discountController.text.trim()) ?? 0,
              unit: unitController.text.trim(),
              description: descriptionController.text.trim(),
              imageUrl: imageController.text.trim(),
            );
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Product save failed: $error')));
    }
  }

  Widget _buildOrders(AdminProvider admin) {
    final active = _activeOrders(admin.orders);
    final rejected = _rejectedOrders(admin.orders);
    final history = _historyOrders(admin.orders);

    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          if (admin.summary != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(child: _StatCard(label: 'Items Sold', value: '${admin.summary!.itemsSold}')),
                  const SizedBox(width: 12),
                  Expanded(child: _StatCard(label: 'Revenue', value: 'EUR ${admin.summary!.revenue.toStringAsFixed(2)}')),
                  const SizedBox(width: 12),
                  Expanded(child: _StatCard(label: 'In Process', value: '${admin.summary!.ordersInProcess}')),
                ],
              ),
            ),
          const TabBar(
            tabs: [
              Tab(text: 'Active'),
              Tab(text: 'Rejected'),
              Tab(text: 'History'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _OrderList(orders: active, onManage: _changeOrderStatus),
                _OrderList(orders: rejected, onManage: _changeOrderStatus),
                _OrderList(orders: history, onManage: _changeOrderStatus),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInventory(AdminProvider admin) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Inventory Dashboard', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            FilledButton.tonal(onPressed: () => _editInventory(), child: const Text('Add')),
          ],
        ),
        const SizedBox(height: 12),
        ...admin.inventory.map(
          (item) => Card(
            child: ListTile(
              title: Text(item.productName),
              subtitle: Text('${item.sku} - ${_productBySkuStatic(admin.products, item.sku)?.category ?? 'Unknown'} / ${_productBySkuStatic(admin.products, item.sku)?.subcategory ?? 'General'}\nAvailable ${item.availableQty} - Threshold ${item.reorderThreshold}'),
              isThreeLine: true,
              trailing: Wrap(
                spacing: 4,
                children: [
                  IconButton(onPressed: () => _editInventory(item), icon: const Icon(Icons.edit_outlined)),
                  IconButton(
                    onPressed: () async {
                      try {
                        await context.read<AdminProvider>().deleteInventoryItem(item.id);
                      } catch (error) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $error')));
                      }
                    },
                    icon: const Icon(Icons.delete_outline),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProducts(AdminProvider admin) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Products', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            FilledButton.tonal(onPressed: () => _editProduct(), child: const Text('Add')),
          ],
        ),
        const SizedBox(height: 12),
        ...admin.products.map(
          (product) => Card(
            child: ListTile(
              title: Text(product.name),
              subtitle: Text('${product.category} / ${product.subcategory} - EUR ${product.price.toStringAsFixed(2)}'),
              trailing: Wrap(
                spacing: 4,
                children: [
                  IconButton(onPressed: () => _editProduct(product), icon: const Icon(Icons.edit_outlined)),
                  IconButton(
                    onPressed: () async {
                      try {
                        await context.read<AdminProvider>().deleteProduct(product.id);
                      } catch (error) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete product failed: $error')));
                      }
                    },
                    icon: const Icon(Icons.delete_outline),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUsers(AdminProvider admin) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Users', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            FilledButton.tonal(onPressed: () => _editUser(), child: const Text('Add')),
          ],
        ),
        const SizedBox(height: 12),
        ...admin.users.map(
          (user) => Card(
            child: ListTile(
              title: Text(user.email),
              subtitle: Text('${user.role} - ${user.status}\n${user.name ?? 'No name'} - ${user.phone ?? 'No phone'}'),
              isThreeLine: true,
              trailing: Wrap(
                spacing: 4,
                children: [
                  IconButton(onPressed: () => _editUser(user), icon: const Icon(Icons.edit_outlined)),
                  IconButton(
                    onPressed: () async {
                      try {
                        await context.read<AdminProvider>().deleteUser(user.id);
                      } catch (error) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete user failed: $error')));
                      }
                    },
                    icon: const Icon(Icons.delete_outline),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMaintenance() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Maintenance', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Inventory Upload', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                FilledButton.tonal(onPressed: _pickAndUploadInventory, child: const Text('Upload Inventory Excel')),
                const SizedBox(height: 16),
                const Text('Backup and Restore', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                FilledButton.tonal(onPressed: _downloadBackup, child: const Text('Download backup.zip')),
                const SizedBox(height: 8),
                FilledButton.tonal(onPressed: _restoreBackup, child: const Text('Restore backup.zip')),
                const SizedBox(height: 16),
                const Text('Reports', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.tonal(onPressed: () => _downloadReport('orders', 'pdf'), child: const Text('Orders PDF')),
                    FilledButton.tonal(onPressed: () => _downloadReport('orders', 'xlsx'), child: const Text('Orders Excel')),
                    FilledButton.tonal(onPressed: () => _downloadReport('inventory', 'pdf'), child: const Text('Inventory PDF')),
                    FilledButton.tonal(onPressed: () => _downloadReport('inventory', 'xlsx'), child: const Text('Inventory Excel')),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _cleanupSystem,
                  style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
                  child: const Text('Clean System'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<AdminProvider, AuthProvider>(
      builder: (context, admin, auth, _) {
        final pages = [
          _buildOrders(admin),
          _buildProducts(admin),
          _buildInventory(admin),
          _buildUsers(admin),
          _buildMaintenance(),
        ];

        return Scaffold(
          appBar: AppBar(
            title: const Text('FreshMart Admin'),
            actions: [
              IconButton(onPressed: () => admin.loadDashboard(), icon: const Icon(Icons.refresh)),
              IconButton(onPressed: () => auth.logout(), icon: const Icon(Icons.logout)),
            ],
          ),
          body: admin.loading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    if (admin.error != null && admin.error!.isNotEmpty)
                      MaterialBanner(
                        content: Text(admin.error!),
                        actions: [
                          TextButton(onPressed: () => admin.loadDashboard(), child: const Text('Retry')),
                        ],
                      ),
                    Expanded(child: pages[_index]),
                  ],
                ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (index) => setState(() => _index = index),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
              NavigationDestination(icon: Icon(Icons.category_outlined), selectedIcon: Icon(Icons.category), label: 'Products'),
              NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Inventory'),
              NavigationDestination(icon: Icon(Icons.group_outlined), selectedIcon: Icon(Icons.group), label: 'Users'),
              NavigationDestination(icon: Icon(Icons.build_outlined), selectedIcon: Icon(Icons.build), label: 'Maintenance'),
            ],
          ),
        );
      },
    );
  }
}

List<String> _categoryOptions(List<Product> products, {String current = ''}) {
  final values = <String>{};
  for (final product in products) {
    final category = product.category.trim();
    if (category.isNotEmpty) {
      values.add(category);
    }
  }
  if (current.trim().isNotEmpty) {
    values.add(current.trim());
  }
  final sorted = values.toList()..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
  return sorted;
}

List<String> _subcategoryOptions(List<Product> products, String category, {String current = ''}) {
  final normalized = category.trim().toLowerCase();
  final values = <String>{};
  for (final product in products) {
    if (product.category.trim().toLowerCase() == normalized) {
      final subcategory = product.subcategory.trim();
      if (subcategory.isNotEmpty) {
        values.add(subcategory);
      }
    }
  }
  if (current.trim().isNotEmpty) {
    values.add(current.trim());
  }
  final sorted = values.toList()..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
  return sorted;
}

Product? _productBySkuStatic(List<Product> products, String sku) {
  for (final product in products) {
    if (product.sku == sku) {
      return product;
    }
  }
  return null;
}

class _OrderList extends StatelessWidget {
  const _OrderList({
    required this.orders,
    required this.onManage,
  });

  final List<OrderModel> orders;
  final Future<void> Function(String orderRef, String currentStatus) onManage;

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return const Center(child: Text('No orders'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return Card(
          child: ListTile(
            title: Text(order.orderRef),
            subtitle: Text('${order.status} - ${order.paymentMethod}\n${order.userEmail}\n${order.userPhone ?? 'No phone'}'),
            isThreeLine: true,
            trailing: FilledButton.tonal(
              onPressed: () => onManage(order.orderRef, order.status),
              child: const Text('Manage'),
            ),
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      ),
    );
  }
}
